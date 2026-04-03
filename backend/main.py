"""
FastAPI application for Lazy Footers.

This file defines ALL API routes and middleware configuration.
It handles HTTP concerns: request validation, file saving, response formatting.

This file does NOT contain any file manipulation logic — that lives in processor.py.
"""

import json
import logging
import os
import shutil
import tempfile
import threading
import time
import uuid
import zipfile
from pathlib import Path
from typing import List

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import (
    ALLOWED_EXTENSIONS,
    MAX_FILES,
    MAX_TOTAL_SIZE_BYTES,
    MAX_TOTAL_SIZE_MB,
    OUTPUT_DIR_NAME,
    SESSION_TTL_MINUTES,
    TEMP_DIR_PREFIX,
)
from processor import process_single_file

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Lazy Footers API",
    description="Upload PDF/DOCX files, set a footer, get back PDFs.",
    version="1.0.0",
)

# Allow all origins so the Next.js frontend (running on a different port)
# can reach this API during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose X-Errors header so the frontend can read partial failure info
    expose_headers=["X-Errors"],
)

# ---------------------------------------------------------------------------
# In-memory session registry
# ---------------------------------------------------------------------------

# Maps session_id → absolute path of the session's temp directory.
# This lets the download endpoints locate processed files by session ID.
active_sessions: dict[str, str] = {}
# Thread lock to prevent race conditions when multiple requests modify the registry
sessions_lock = threading.Lock()


def schedule_session_cleanup(session_id: str, session_directory: str) -> None:
    """
    Schedule deletion of a session's temp directory after the TTL expires.

    Runs in a background thread so it doesn't block the API response.
    Uses time.sleep() which is simple and good enough for this use case.
    For production at scale, a task queue (Celery, etc.) would be better.

    Args:
        session_id:        The UUID identifying this session.
        session_directory: Absolute path to the session's temp directory.
    """
    def _cleanup() -> None:
        # Wait for the TTL to expire before deleting
        time.sleep(SESSION_TTL_MINUTES * 60)
        try:
            shutil.rmtree(session_directory, ignore_errors=True)
            with sessions_lock:
                active_sessions.pop(session_id, None)
            logger.info("Cleaned up session %s at %s", session_id, session_directory)
        except Exception as error:
            # Log but don't crash — cleanup failure shouldn't affect the server
            logger.error("Failed to clean up session %s: %s", session_id, error)

    cleanup_thread = threading.Thread(target=_cleanup, daemon=True)
    cleanup_thread.start()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root() -> dict:
    """
    Root endpoint — simple health/identity check.

    Returns:
        JSON with status and a human-readable message.
    """
    return {"status": "ok", "message": "Lazy Footers API is running"}


@app.get("/api/health")
async def health_check() -> dict:
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        JSON with status "healthy".
    """
    return {"status": "healthy"}


@app.post("/api/process")
async def process_files(
    files: List[UploadFile] = File(..., description="PDF or DOCX files to process"),
    footer_left: str = Form("", description="Left footer text (e.g. name)"),
    footer_center: str = Form("", description="Center footer text (e.g. class)"),
    footer_right: str = Form("", description="Right footer text (e.g. roll no)"),
) -> JSONResponse:
    """
    Process uploaded files: apply a footer and convert to PDF.

    Accepts up to MAX_FILES files with a combined size under MAX_TOTAL_SIZE_BYTES.
    Each file is processed independently — one failure does not block others.

    Args:
        files:       List of uploaded files (PDF or DOCX).
        footer_text: The footer text string to apply to every file.

    Returns:
        JSONResponse with session_id, list of processed files, and any errors.

    Raises:
        HTTPException 400: If file count, total size, or extensions are invalid.
        HTTPException 500: If ALL files fail to process.
    """
    # --- Validation -----------------------------------------------------------

    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum is {MAX_FILES}, but {len(files)} were uploaded.",
        )

    # Read all file contents into memory for size validation and later saving.
    # We do this upfront so we can validate total size before doing any work.
    file_contents: list[tuple[UploadFile, bytes]] = []
    total_size = 0

    for uploaded_file in files:
        content = await uploaded_file.read()
        total_size += len(content)
        file_contents.append((uploaded_file, content))

    if total_size > MAX_TOTAL_SIZE_BYTES:
        total_size_mb = round(total_size / (1024 * 1024), 2)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Total upload size ({total_size_mb} MB) exceeds the "
                f"{MAX_TOTAL_SIZE_MB} MB limit."
            ),
        )

    for uploaded_file, _ in file_contents:
        extension = Path(uploaded_file.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type: '{extension}' "
                    f"(file: {uploaded_file.filename}). "
                    f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                ),
            )

    if not footer_left.strip() and not footer_center.strip() and not footer_right.strip():
        raise HTTPException(
            status_code=400,
            detail="At least one footer field must be filled in.",
        )

    # --- Setup temp directory and session ID ----------------------------------

    session_id = str(uuid.uuid4())
    session_directory = tempfile.mkdtemp(prefix=TEMP_DIR_PREFIX)
    output_directory = os.path.join(session_directory, OUTPUT_DIR_NAME)
    os.makedirs(output_directory, exist_ok=True)

    # Register the session so download endpoints can find the files later
    with sessions_lock:
        active_sessions[session_id] = session_directory

    logger.info(
        "Processing session %s: %d files, %d bytes, footer='%s | %s | %s'",
        session_id, len(file_contents), total_size,
        footer_left[:30], footer_center[:30], footer_right[:30],
    )

    # --- Save uploaded files to disk ------------------------------------------

    saved_files: list[tuple[str, str]] = []  # (saved_path, original_filename)

    for uploaded_file, content in file_contents:
        original_name = uploaded_file.filename or "unnamed"
        # Sanitize the filename to prevent path traversal attacks
        safe_name = Path(original_name).name
        saved_path = os.path.join(session_directory, safe_name)

        with open(saved_path, "wb") as disk_file:
            disk_file.write(content)

        saved_files.append((saved_path, safe_name))

    # --- Process each file independently --------------------------------------

    successful_files: list[dict] = []
    processing_errors: list[dict] = []

    for saved_path, original_name in saved_files:
        try:
            output_path = process_single_file(
                saved_path=saved_path,
                original_name=original_name,
                footer_left=footer_left,
                footer_center=footer_center,
                footer_right=footer_right,
                output_directory=output_directory,
                temp_directory=session_directory,
            )
            file_size = os.path.getsize(output_path)
            successful_files.append({
                "name": Path(output_path).name,
                "size_bytes": file_size,
            })
        except Exception as error:
            # Log the full error but return a user-friendly message
            logger.error("Failed to process '%s': %s", original_name, error, exc_info=True)
            processing_errors.append({
                "filename": original_name,
                "message": str(error),
            })

    # --- Handle results -------------------------------------------------------

    if not successful_files:
        # ALL files failed — nothing to download
        raise HTTPException(
            status_code=500,
            detail={
                "message": "All files failed to process.",
                "errors": processing_errors,
            },
        )

    # Schedule cleanup of the session directory after TTL expires
    schedule_session_cleanup(session_id, session_directory)

    logger.info(
        "Session %s complete: %d succeeded, %d failed",
        session_id, len(successful_files), len(processing_errors),
    )

    return JSONResponse(content={
        "session_id": session_id,
        "files": successful_files,
        "errors": processing_errors,
    })


@app.get("/api/download/zip/{session_id}")
async def download_zip(session_id: str, background_tasks: BackgroundTasks) -> FileResponse:
    """
    Download all processed files from a session as a single ZIP archive.

    Args:
        session_id: The UUID returned by POST /api/process.

    Returns:
        FileResponse streaming the ZIP file.

    Raises:
        HTTPException 404: If the session ID is not found or has expired.
    """
    with sessions_lock:
        session_directory = active_sessions.get(session_id)

    if not session_directory or not os.path.isdir(session_directory):
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found or has expired.",
        )

    output_directory = os.path.join(session_directory, OUTPUT_DIR_NAME)

    if not os.path.isdir(output_directory):
        raise HTTPException(
            status_code=404,
            detail=f"No processed files found for session '{session_id}'.",
        )

    # Build the ZIP file in the session directory (not the output dir)
    zip_path = os.path.join(session_directory, "lazy_footers_output.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_archive:
        for filename in os.listdir(output_directory):
            file_path = os.path.join(output_directory, filename)
            if os.path.isfile(file_path):
                # arcname=filename puts files at the root of the ZIP (no nested dirs)
                zip_archive.write(file_path, arcname=filename)

    logger.info("Created ZIP for session %s: %s", session_id, zip_path)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename="lazy_footers_output.zip",
    )


@app.get("/api/download/file/{session_id}/{filename}")
async def download_individual_file(session_id: str, filename: str) -> FileResponse:
    """
    Download a single processed file from a session.

    Args:
        session_id: The UUID returned by POST /api/process.
        filename:   The name of the file to download (must match a processed output).

    Returns:
        FileResponse streaming the individual file.

    Raises:
        HTTPException 404: If the session or file is not found.
        HTTPException 400: If the filename contains path traversal characters.
    """
    # Security: prevent path traversal attacks by stripping directory components
    safe_filename = Path(filename).name
    if safe_filename != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename. Path traversal is not allowed.",
        )

    with sessions_lock:
        session_directory = active_sessions.get(session_id)

    if not session_directory or not os.path.isdir(session_directory):
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found or has expired.",
        )

    file_path = os.path.join(session_directory, OUTPUT_DIR_NAME, safe_filename)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File '{safe_filename}' not found in session '{session_id}'.",
        )

    # Determine media type based on extension
    extension = Path(safe_filename).suffix.lower()
    media_type_map = {
        ".pdf":  "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    media_type = media_type_map.get(extension, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=safe_filename,
    )


# ---------------------------------------------------------------------------
# Entry point (for running directly with `python main.py`)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    from config import API_HOST, API_PORT

    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
    )
