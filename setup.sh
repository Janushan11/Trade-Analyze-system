#!/bin/bash

# Trade Analyze System - Automated Setup Script

echo "🚀 Trade Analyze - Full Stack Setup"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB or use MongoDB Atlas"
fi

echo "✅ Prerequisites check passed"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"
cd ..
echo ""

# Frontend Setup
echo "📦 Setting up Frontend..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..
echo ""

# AI Engine Setup
echo "🤖 Setting up AI Engine..."
cd ai-engine
python3 -m venv venv
source venv/bin/activate 2>/dev/null || venv\Scripts\activate.bat
pip install -r requirements.txt
echo "✅ AI Engine dependencies installed"
cd ..
echo ""

# Create .env if not exists
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your settings"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📍 Next Steps:"
echo "1. Edit backend/.env with your MongoDB URI"
echo "2. Open 3 terminals and run:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo "   Terminal 3: cd ai-engine && source venv/bin/activate && python -m uvicorn src.main:app --reload"
echo ""
echo "3. Open browser: http://localhost:5173"
echo ""
echo "Happy Trading! 📊"
