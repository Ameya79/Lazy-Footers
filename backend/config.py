"""
Configuration constants for the Lazy Footers backend.

This file is the SINGLE SOURCE OF TRUTH for all tunable limits and settings.
Every constant has an inline comment explaining what it controls.

This file does NOT contain any logic, classes, or functions — only constants.
"""

# ---------------------------------------------------------------------------
# Upload limits
# ---------------------------------------------------------------------------

MAX_FILES = 10
"""Maximum number of files a user can upload in a single request."""

MAX_TOTAL_SIZE_MB = 50
"""Maximum combined size of all uploaded files, expressed in megabytes."""

MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024
"""Same limit converted to bytes so we can compare directly against file sizes."""

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
"""Only these file extensions are accepted. Anything else is rejected at upload."""

# ---------------------------------------------------------------------------
# Temp / session storage
# ---------------------------------------------------------------------------

TEMP_DIR_PREFIX = "lazy_footers_"
"""Prefix added to every temporary working directory created by the server."""

SESSION_TTL_MINUTES = 30
"""Minutes before a session's processed files are automatically deleted.
Keeps disk usage bounded even if users never download their results."""

OUTPUT_DIR_NAME = "output"
"""Name of the subdirectory inside each session folder where outputs are stored."""

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

API_HOST = "0.0.0.0"
"""Host address the uvicorn server binds to. 0.0.0.0 allows external connections."""

API_PORT = 8000
"""Port the uvicorn server listens on."""
