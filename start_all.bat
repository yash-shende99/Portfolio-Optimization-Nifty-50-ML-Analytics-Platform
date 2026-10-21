@echo off
echo ========================================================
echo  Nifty 50 AI Portfolio Optimization Platform Launcher
echo ========================================================

echo Starting FastAPI Backend on port 8001...
start "Portfolio ML Backend" cmd /k ".\venv\Scripts\activate.bat && python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload"

echo Starting Next.js Frontend on port 3001...
start "Portfolio ML Frontend" cmd /k "cd frontend && npm run dev -- -p 3001"

echo.
echo ========================================================
echo Services are launching:
echo - Web App (Frontend): http://localhost:3001
echo - Backend API:        http://localhost:8001
echo - Swagger API Docs:   http://localhost:8001/docs
echo ========================================================
