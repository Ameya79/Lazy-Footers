"""
================================================================================
INTERVIEW CHEAT SHEET: LAZY FOOTERS TOTAL ARCHITECTURE (MINI VERSION)
================================================================================

Q: What does the ENTIRE Lazy Footers codebase do?
A: It is a Full-Stack Web Application.
   1. The FRONTEND (React/Next.js) is the "face" the user sees. It collects files.
   2. The API (FastAPI - this file!) is the "waiter/manager". It takes files from the frontend.
   3. The PROCESSOR (Python Logic) is the "kitchen/chef". It physically alters the PDFs and MS Word documents.

Where is what in the REAL project?
- frontend/app/page.tsx      -> The website UI buttons and drag-and-drop zone.
- backend/main.py            -> The FastAPI gateway (like this file) that handles internet traffic.
- backend/processor.py       -> The hardcore logic that actually reads/writes PDFs and DOCX files.
- start.bat                  -> A script that turns both servers on simultaneously.

Q: What is "Testing an API"?
A: An API has no buttons to click. To test it, you pretend to be the frontend. 
   You send "Requests" (data) to specific URLs and check if the "Responses" (results) are 
   exactly what you expected. If I send 5 PDFs and a footer string to the "/process" URL, 
   does it crash? Or does it hand me back 5 new PDFs? That is API testing!
   (FastAPI provides the "/docs" page to let you test this easily).
"""

from fastapi import FastAPI, UploadFile, Form
import time

app = FastAPI(title="Mini Lazy Footers")


# ==============================================================================
# SECTION 1: THE BUSINESS LOGIC (In the real app, this is backend/processor.py)
# ==============================================================================
# We normally separate the heavy lifting from the internet routing.
# This function knows NOTHING about HTTP, browsers, or endpoints. It just does math/files.

def process_file_logic(filename: str, footer_text: str) -> dict:
    """Mock processor: Pretends to take 1 second to staple a footer to a file."""
    time.sleep(1) # Pretending to do hard work...
    return {
        "original_name": filename,
        "new_name": f"MODIFIED_{filename}",
        "footer_applied": footer_text,
        "status": "Success!"
    }


# ==============================================================================
# SECTION 2: THE API GATEWAY (In the real app, this is backend/main.py)
# ==============================================================================
# This is the internet gateway. It catches data from the React frontend, 
# hands it to the Business Logic (processor.py), and sends the result back.

@app.post("/api/process")
async def process_files_endpoint(
    # The frontend promises to send an uploaded file and some text in a form
    file: UploadFile,
    footer_text: str = Form(...) 
):
    """
    Q: What does this Endpoint do?
    A: It catches the POST request from the Next.js frontend.
    """
    
    # 1. Catch the data from the internet
    filename = file.filename
    print(f"Server received {filename} and wants to add footer: {footer_text}")

    # 2. Hand it to the "Kitchen" (The Business logic)
    result = process_file_logic(filename, footer_text)

    # 3. Serve the result back to the user's browser as JSON
    return {
        "message": "File processing complete!",
        "data": result
    }

# ==============================================================================
# HOW TO TEST THIS API YOURSELF!
# ==============================================================================
# 1. Run this server:
#    ..\venv\Scripts\python.exe -m uvicorn mini_lazy_footers:app --reload --port 8001
# 2. Open your browser to: http://localhost:8001/docs
# 3. Click "POST /api/process" -> Click "Try it out" 
# 4. Upload a random file, type some text, and hit Execute.
#    You just "Tested the API" manually!
