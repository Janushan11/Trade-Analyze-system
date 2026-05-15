# Trade Analyze - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB running locally or connection string ready

### Step 1: Install Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```

### Step 2: Install Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Install AI Engine (Terminal 3)
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn src.main:app --reload
```

### Step 4: Open Browser
Navigate to: **http://localhost:5173**

## That's It! 🎉

Your trading analysis platform is now running with:
- ✅ Real-time Binance WebSocket data
- ✅ SMC pattern detection
- ✅ Quasimodo pattern recognition
- ✅ AI predictions
- ✅ Live charts
- ✅ Signal generation

## First Steps

1. **Wait 30 seconds** for initial data load
2. **Select a symbol** (BTCUSDT recommended)
3. **Watch the live chart** update
4. **View signals and predictions** in the analysis panel
5. **Check analytics** for prediction accuracy

## Troubleshooting

### Port Already in Use
Kill the process and try again:
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
Ensure MongoDB is running:
```bash
mongod
```

### Dependencies Not Installing
Try clearing cache:
```bash
npm cache clean --force
pip cache purge
```

## Next: Full Setup

See **SETUP.md** for complete installation guide with Docker, production deployment, and advanced configuration.
