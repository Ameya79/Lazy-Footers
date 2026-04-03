# Antigravity Starting Prompt — Mass Footer Changer

Paste everything below this line into Antigravity as your starting prompt.

---

## PROMPT START

Build a full-stack web application called **Mass Footer Changer**.

The app lets a user upload up to 10 PDF or DOCX files (50 MB total limit), type a footer text, choose a per-file output format (PDF or DOCX), and receive a ZIP download with all files updated.

---

## ABSOLUTE CODE QUALITY RULES

Follow these throughout the entire codebase. Do not skip any of them.

1. **Every file must start with a module-level docstring** explaining what that file is responsible for and what it does NOT do.

2. **Every function must have a docstring** that describes: what it does, what each parameter means, what it returns, and what exceptions it can raise.

3. **Every non-obvious line of code must have an inline comment** explaining WHY, not just what. For example: don't write `# loop through files` — write `# process each file independently so one failure doesn't block others`.

4. **No magic numbers or strings** — every constant (file limits, allowed extensions, port numbers, max sizes) must be defined in a `config.py` (backend) or `constants.ts` (frontend) file with a comment explaining what each one controls.

5. **Keep files small and single-responsibility.** Never put routing logic and file manipulation logic in the same file. Never put API call logic and UI rendering logic in the same component.

6. **Name things clearly.** No single-letter variables outside of loops. `savedFilePath` not `sp`. `outputFormat` not `fmt`.

7. **Handle all errors explicitly** — never silently swallow exceptions. Every try/catch must log the error and either re-raise or return a meaningful error to the caller.

8. **TypeScript on the frontend** — use proper types everywhere. No `any`. Define interfaces for all API request/response shapes.

---

## TECH STACK

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **PDF → DOCX:** pdf2docx
- **DOCX editing:** python-docx
- **DOCX → PDF:** LibreOffice (called via subprocess, headless mode)
- **ZIP creation:** Python built-in zipfile module
- **Server runner:** uvicorn

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **No extra UI component libraries** — keep it simple and readable

---

## PROJECT STRUCTURE TO CREATE

```
mass-footer-changer/
│
├── backend/
│   ├── main.py              # FastAPI app, route definitions only
│   ├── processor.py         # All file manipulation logic (pdf2docx, python-docx, LibreOffice)
│   ├── config.py            # All constants: MAX_FILES, MAX_TOTAL_SIZE_MB, ALLOWED_EXTENSIONS, etc.
│   ├── requirements.txt     # Pinned Python dependencies
│   └── .env.example         # Example environment variables with comments
│
└── frontend/
    ├── app/
    │   ├── page.tsx          # Main page — composes the UI components
    │   └── layout.tsx        # Root layout with page title and font
    ├── components/
    │   ├── FileUploader.tsx  # Drag-and-drop file picker, enforces limits
    │   ├── FileList.tsx      # Lists uploaded files with per-file PDF/DOCX toggle
    │   ├── FooterInput.tsx   # Controlled text input for footer text
    │   └── StatusMessage.tsx # Shows success, error, or partial-error states
    ├── lib/
    │   ├── api.ts            # processFiles() — the only function that calls the backend
    │   └── constants.ts      # MAX_FILES, MAX_TOTAL_SIZE_MB mirrored from backend
    ├── types/
    │   └── index.ts          # All shared TypeScript interfaces and types
    └── package.json
```

---

## BACKEND SPECIFICATION

### `config.py`

Define these constants with inline comments explaining each one:

```python
MAX_FILES = 10                          # Maximum number of files allowed per request
MAX_TOTAL_SIZE_MB = 50                  # Maximum combined size of all uploaded files in megabytes
MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"} # Only these file types are supported
TEMP_DIR_PREFIX = "footer_changer_"    # Prefix for temporary working directories
```

### `processor.py`

Write these functions in this order, each fully documented:

**`get_libreoffice_path() -> str`**
Returns the correct path to the LibreOffice executable based on the operating system.
- On macOS, check the standard app bundle path first
- On Linux/Windows, return `"libreoffice"` (assumes it's in PATH)
- Log a warning if the macOS path does not exist

**`pdf_to_docx(pdf_path: str, docx_path: str) -> None`**
Converts a text-based PDF to a Word document using pdf2docx.
- Always call `cv.close()` in a finally block
- Raises `RuntimeError` with a clear message if conversion fails
- Documented limitation: scanned/image PDFs are not supported

**`set_footer(docx_path: str, text: str) -> None`**
Sets the footer text on ALL sections of a Word document.
- Loops through every section (handles multi-section documents)
- Sets `footer.is_linked_to_previous = False` with a comment explaining why
- Clears all existing runs before writing new text
- Handles the edge case where a footer has no paragraphs
- Saves the file in place

**`docx_to_pdf(docx_path: str, out_dir: str) -> str`**
Converts a Word document to PDF using LibreOffice headless mode.
- Calls LibreOffice via subprocess with `check=True` and `capture_output=True`
- Comment must explain why we pass a list (not a string) to subprocess (security)
- Returns the full path of the generated PDF
- Raises `subprocess.CalledProcessError` with a clear message if LibreOffice fails

**`process_single_file(saved_path, original_name, footer_text, want_format, out_dir, tmp_dir) -> str`**
Orchestrates the full pipeline for one file:
1. Detect file type from extension
2. If PDF, convert to DOCX
3. Edit the footer
4. Export to wanted format
5. Return the output file path
- Raises `ValueError` for unsupported file types

### `main.py`

Write a clean FastAPI app with these routes:

**`GET /`**
Returns `{"status": "ok", "message": "Mass Footer Changer API is running"}`

**`GET /api/health`**
Returns `{"status": "healthy"}`

**`POST /api/process`**

Parameters:
- `files: List[UploadFile]` — the uploaded files
- `footer_text: str` — the footer text (Form field)
- `output_formats: str` — JSON string mapping filename → `"pdf"` or `"docx"` (Form field)

Validation to perform before processing:
1. File count must not exceed `MAX_FILES` → raise HTTP 400 with clear message
2. Total size of all files must not exceed `MAX_TOTAL_SIZE_BYTES` → raise HTTP 400
3. Each file extension must be in `ALLOWED_EXTENSIONS` → raise HTTP 400
4. `output_formats` must be valid JSON → raise HTTP 422

Processing:
- Save all uploaded files to a `tempfile.mkdtemp()` directory
- Process each file in a try/except — one file failing must NOT stop the others
- Collect both successes (output paths) and failures (filename + error message)
- If ALL files failed, raise HTTP 500
- If SOME files failed, still return the ZIP but include `X-Errors` response header (JSON list of error strings)
- Bundle all successful outputs into a ZIP using `zipfile.ZIP_DEFLATED` compression
- Return `FileResponse` with `media_type="application/zip"`
- Always clean up the temp directory (use `BackgroundTasks` for this so cleanup happens after the response is sent)

Add CORS middleware allowing all origins (needed for local Next.js dev).

---

## FRONTEND SPECIFICATION

### `types/index.ts`

Define these interfaces:

```typescript
// Represents one file the user has selected, plus the user's format choice
interface SelectedFile {
  file: File;
  outputFormat: "pdf" | "docx";
}

// The shape of a partial error returned in the X-Errors response header
interface ProcessingError {
  filename: string;
  message: string;
}

// The result of calling processFiles()
interface ProcessResult {
  zipBlob: Blob;
  errors: ProcessingError[]; // empty if all files succeeded
}
```

### `lib/constants.ts`

```typescript
// Must match the values in backend/config.py
export const MAX_FILES = 10;
export const MAX_TOTAL_SIZE_MB = 50;
export const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
```

### `lib/api.ts`

Write one exported function:

```typescript
export async function processFiles(
  files: File[],
  footerText: string,
  outputFormats: Record<string, "pdf" | "docx">
): Promise<ProcessResult>
```

- Builds a `FormData` object
- Uses `fetch` to POST to `process/api/process` (read URL from `NEXT_PUBLIC_API_URL` env var)
- Reads the `X-Errors` response header to extract partial errors
- Returns the ZIP as a `Blob`
- Throws a descriptive `Error` on HTTP errors

### `components/FileUploader.tsx`

- Supports both click-to-browse and drag-and-drop
- Validates immediately on selection:
  - Shows error if more than `MAX_FILES` files are selected
  - Shows error if combined size exceeds `MAX_TOTAL_SIZE_BYTES`
  - Shows error if any file has an unsupported extension
- Calls `onFilesChange(files)` prop with the valid selected files

### `components/FileList.tsx`

- Receives `files: SelectedFile[]` and `onFormatChange(filename, format)` prop
- Renders each file as a row: filename, file size (human readable), and a toggle between PDF / DOCX output
- Shows the total combined size at the bottom

### `components/FooterInput.tsx`

- Controlled text input
- Shows character count
- Shows placeholder text: `e.g. Confidential — Acme Corp 2025`

### `components/StatusMessage.tsx`

- Receives a `status` prop: `"idle" | "uploading" | "processing" | "done" | "error"`
- Receives optional `errors: ProcessingError[]` for partial failures
- For `"done"` with errors: show "X of Y files processed successfully" + list the failed files with their error messages
- For `"error"`: show the full error message

### `app/page.tsx`

Main page component that:
1. Holds state: `selectedFiles`, `footerText`, `status`, `result`
2. Renders `FileUploader` → `FileList` → `FooterInput` → Submit button → `StatusMessage`
3. On submit: calls `processFiles()` from `lib/api.ts`, triggers a browser download of the ZIP blob
4. The submit button is disabled if: no files selected, footer text is empty, or status is `"uploading"` / `"processing"`

---

## THINGS TO EXPLICITLY NOT DO

- Do not use `any` type in TypeScript
- Do not put file processing logic inside `main.py` route handlers
- Do not hardcode numbers — use the constants from `config.py` / `constants.ts`
- Do not silently catch exceptions
- Do not install a UI component library — plain Tailwind is enough
- Do not use `shell=True` in subprocess calls (security risk — use a list)
- Do not forget to close pdf2docx Converter objects
- Do not forget `BackgroundTasks` for temp directory cleanup

---

## REQUIREMENTS FILES

### `backend/requirements.txt`

```
fastapi==0.111.0
uvicorn==0.29.0
python-multipart==0.0.9
python-docx==1.1.2
pdf2docx==0.5.8
```

### `frontend/package.json` dependencies

```json
{
  "next": "14.2.3",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5",
  "tailwindcss": "^3",
  "autoprefixer": "^10",
  "postcss": "^8"
}
```

---

## SETUP INSTRUCTIONS TO INCLUDE IN OUTPUT

After writing all the code, output these setup instructions clearly:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**LibreOffice (must be installed separately — not a pip package):**
- Windows/Mac: https://www.libreoffice.org/download/
- Linux: `sudo apt-get install libreoffice`

---

## PROMPT END