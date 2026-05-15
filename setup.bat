@echo off
REM Trade Analyze System - Automated Setup Script for Windows

echo.
echo 🚀 Trade Analyze - Full Stack Setup
echo ====================================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python 3 not found. Please install Python 3.9+
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Backend Setup
echo 📦 Setting up Backend...
cd backend
call npm install
echo ✅ Backend dependencies installed
cd ..
echo.

REM Frontend Setup
echo 📦 Setting up Frontend...
cd frontend
call npm install
echo ✅ Frontend dependencies installed
cd ..
echo.

REM AI Engine Setup
echo 🤖 Setting up AI Engine...
cd ai-engine
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✅ AI Engine dependencies installed
cd ..
echo.

REM Create .env if not exists
if not exist backend\.env (
    echo Creating backend\.env...
    copy backend\.env.example backend\.env
    echo ⚠️  Please edit backend\.env with your settings
)

echo.
echo ✅ Setup Complete!
echo.
echo 📍 Next Steps:
echo 1. Edit backend\.env with your MongoDB URI
echo 2. Open 3 command prompts and run:
echo    Prompt 1: cd backend ^& npm run dev
echo    Prompt 2: cd frontend ^& npm run dev
echo    Prompt 3: cd ai-engine ^& venv\Scripts\activate ^& python -m uvicorn src.main:app --reload
echo.
echo 3. Open browser: http://localhost:5173
echo.
echo Happy Trading! 📊
echo.
pause
