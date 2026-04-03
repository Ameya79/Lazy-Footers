@echo off
echo Starting Lazy Footers...
echo.

REM Start the backend in a new window
start "Lazy Footers - Backend" cmd /k "cd /d "%~dp0backend" && "%~dp0venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start the frontend in a new window
start "Lazy Footers - Frontend" cmd /k "cd /d "%~dp0frontend" && npx next dev --port 3000"

REM Wait for frontend to be ready then open browser
timeout /t 8 /nobreak >nul
start http://localhost:3000

echo.
echo Both servers are starting up!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close the two server windows to stop.
