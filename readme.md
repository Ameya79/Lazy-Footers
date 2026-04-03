# Lazy Footers

Upload PDF or DOCX files, type a footer, and download them with the footer applied.  
Instant processing. No external software required. Works on mobile.

---

## How It Works

```
Upload files (PDF/DOCX) + footer text
        │
        ▼
┌─────────────────────────────────┐
│       FastAPI Server            │
│                                 │
│  For each file:                 │
│                                 │
│  PDF files:                     │
│  ┌─────────────────────────┐    │
│  │ PyMuPDF (fitz)          │    │
│  │ Stamp footer directly   │    │
│  │ onto every page         │    │
│  └──────────┬──────────────┘    │
│             ▼                   │
│  Output: footered PDF           │
│                                 │
│  DOCX files:                    │
│  ┌─────────────────────────┐    │
│  │ python-docx             │    │
│  │ Set footer on all       │    │
│  │ sections                │    │
│  └──────────┬──────────────┘    │
│             ▼                   │
│  Output: footered DOCX          │
└─────────────────────────────────┘
        │
        ▼
Download: ZIP of all files  OR  each file individually
```

---

## Tech Stack

| Layer     | Technology                 |
|-----------|----------------------------|
| Backend   | Python 3.11+, FastAPI      |
| PDF edit  | PyMuPDF (instant stamping) |
| DOCX edit | python-docx                |
| Frontend  | Next.js 14, TypeScript     |
| Styling   | Tailwind CSS               |

> **No LibreOffice required.** PDFs are edited directly with PyMuPDF — fast and accurate.

---

## Limits

- **Max files per request:** 10
- **Max combined size:** 50 MB
- **Accepted input:** `.pdf` and `.docx`
- **Output format:** Same as input (PDF → PDF, DOCX → DOCX)

---

## Project Structure

```
lazy-footers/
├── backend/
│   ├── config.py            # All constants (MAX_FILES, sizes, etc.)
│   ├── processor.py         # PDF stamping + DOCX footer editing
│   ├── main.py              # FastAPI routes & validation
│   ├── requirements.txt     # Pinned Python dependencies
│   └── .env.example         # Example environment variables
│
└── frontend/
    ├── app/
    │   ├── globals.css      # Tailwind + premium dark theme
    │   ├── layout.tsx       # Root layout, fonts, SEO
    │   └── page.tsx         # Main page — composes all components
    ├── components/
    │   ├── FileUploader.tsx  # Drag-drop + click-to-browse
    │   ├── FileList.tsx      # Shows selected files with remove
    │   ├── FooterInput.tsx   # Footer text input with char count
    │   ├── DownloadPanel.tsx # ZIP + individual file downloads
    │   └── StatusMessage.tsx # Processing status feedback
    ├── lib/
    │   ├── api.ts           # Backend API client
    │   └── constants.ts     # Mirrored backend constants
    ├── types/
    │   └── index.ts         # All TypeScript interfaces
    └── .env.local           # NEXT_PUBLIC_API_URL
```

---

## Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**

That's it. No LibreOffice or other external tools needed.

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | Status check |
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/process` | Upload files + footer text → process |
| `GET`  | `/api/download/zip/{session_id}` | Download all as ZIP |
| `GET`  | `/api/download/file/{session_id}/{filename}` | Download single file |

---

## License

MIT