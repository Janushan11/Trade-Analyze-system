# INSTALLATION & SETUP GUIDE

## ✅ Quick Start (5 Steps)

### Step 1: Backend Setup (Terminal 1)
```bash
cd backend
npm install
# Create .env file with MONGO_URI and other configs
npm run dev
# Running on: http://localhost:5000
```

### Step 2: Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# Running on: http://localhost:5173
```

### Step 3: AI Engine Setup (Terminal 3)
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn src.main:app --reload
# Running on: http://localhost:8000
```

### Step 4: Database Setup
```bash
# Ensure MongoDB is running
mongod
# Connection: mongodb://localhost:27017/trade-analyze
```

### Step 5: Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **AI Engine**: http://localhost:8000

## 📋 Prerequisites

- **Node.js** 16+ (Check: `node -v`)
- **Python** 3.9+ (Check: `python --version`)
- **MongoDB** 4.0+ (Check: `mongod --version`)
- **npm** 8+ (Check: `npm -v`)
- **pip** 21+ (Check: `pip -v`)

## 🔧 Detailed Installation

### 1. Install Node.js and npm

**Windows/Mac:**
- Download from https://nodejs.org/
- Choose LTS version
- Follow installer

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Python

**Windows/Mac:**
- Download from https://www.python.org/
- Select 3.9 or higher
- Check "Add Python to PATH"

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install python3.9 python3-pip
```

### 3. Install MongoDB

**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Run installer
- Add to PATH
- Run: `mongod`

**Mac (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Or Use MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Add to backend/.env: `MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database`

### 4. Backend Installation

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
# Windows: notepad .env
# Mac/Linux: nano .env

# Start backend
npm run dev
```

**Backend .env template:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/trade-analyze
PYTHON_API_URL=http://localhost:8000
BINANCE_STREAM_URL=wss://stream.binance.com:9443/ws
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 5. Frontend Installation

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure API URLs (optional)
# Edit src/services/api.js if needed

# Start frontend
npm run dev
```

**Frontend will auto-proxy to backend (see vite.config.js)**

### 6. Python AI Engine Installation

```bash
# Navigate to AI engine
cd ai-engine

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start AI engine
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## 🚀 Running the Full Stack

### Option 1: Using 3 Terminal Windows

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Engine:**
```bash
cd ai-engine
source venv/bin/activate
python -m uvicorn src.main:app --reload
```

**Terminal 4 - MongoDB (if local):**
```bash
mongod
```

### Option 2: Using Docker Compose

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js in project root
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'backend/src/server.js',
      cwd: 'backend',
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'frontend',
      script: 'npm run dev',
      cwd: 'frontend'
    },
    {
      name: 'ai-engine',
      script: 'python -m uvicorn src.main:app --reload',
      cwd: 'ai-engine',
      interpreter: 'python'
    }
  ]
};
```

## ✔️ Verification Checklist

### Backend
- [ ] Port 5000 accessible
- [ ] API responds at http://localhost:5000/api/health
- [ ] MongoDB connected
- [ ] WebSocket running

### Frontend
- [ ] Port 5173 accessible
- [ ] Dashboard loads
- [ ] Can switch between pages
- [ ] Connects to backend

### AI Engine
- [ ] Port 8000 accessible
- [ ] Health check: http://localhost:8000/health
- [ ] Can accept POST requests
- [ ] All dependencies loaded

### Database
- [ ] MongoDB running
- [ ] Can connect to local instance
- [ ] Create test database

## 🧪 Testing Connection

### Test Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-05-15T10:30:00Z",
  "uptime": 123.456
}
```

### Test AI Engine
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-05-15T10:30:00Z",
  "model_loaded": false
}
```

### Test MongoDB
```bash
mongosh
> use trade-analyze
> db.signals.find()
```

## 🐛 Common Issues & Solutions

### Issue: npm command not found
**Solution:** Node.js not installed or not in PATH
```bash
# Check installation
node -v
npm -v

# If not found, reinstall Node.js with PATH option
```

### Issue: Python venv not activating
**Solution:** Wrong command for OS
```bash
# Windows (use backslash)
venv\Scripts\activate

# Mac/Linux (use forward slash)
source venv/bin/activate
```

### Issue: Port already in use
**Solution:** Kill existing process
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: MongoDB connection refused
**Solution:** MongoDB not running
```bash
# Check if running
ps aux | grep mongod

# Start MongoDB
mongod

# Or if using service
sudo systemctl start mongod
```

### Issue: pip packages not installing
**Solution:** Virtual environment not activated or permission issue
```bash
# Ensure venv is active
source venv/bin/activate  # or venv\Scripts\activate

# Try with user flag
pip install --user -r requirements.txt

# Or upgrade pip first
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: CORS errors in frontend
**Solution:** Backend CORS configuration
```
The backend already has CORS configured in src/server.js
Check that backend is running on port 5000
```

### Issue: WebSocket connection fails
**Solution:** Ensure backend and frontend are on same network
- Check backend WebSocket is initialized
- Frontend should connect to `http://localhost:5000`
- Firewall may be blocking connections

## 📊 Database Initialization

### Create Collections (MongoDB)

```javascript
// In MongoDB shell
use trade-analyze

// Create signals collection
db.createCollection("signals")

// Create predictions collection
db.createCollection("predictions")

// Create candles collection
db.createCollection("candles")

// Create indexes for performance
db.candles.createIndex({ symbol: 1, timestamp: 1 })
db.signals.createIndex({ symbol: 1, createdAt: -1 })
db.predictions.createIndex({ symbol: 1, timestamp: -1 })
```

## 🔄 Data Flow

```
Binance WebSocket
       ↓
Backend WebSocket Handler
       ↓
Save to MongoDB (Candles)
       ↓
Send to AI Engine (Analysis)
       ↓
Python Analysis (SMC, QM, ML)
       ↓
Return Predictions
       ↓
Save to MongoDB (Predictions)
       ↓
Emit to Frontend via Socket.io
       ↓
Update Chart & Signals
```

## 📈 Sample API Usage

### Get Latest Signals
```bash
curl http://localhost:5000/api/signals/latest
```

### Get Predictions for Symbol
```bash
curl "http://localhost:5000/api/predictions/BTCUSDT/history?days=7"
```

### Send Analysis Request to AI Engine
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "candles": [/* array of candle data */],
    "timeframe": "1m"
  }'
```

## 📚 Additional Resources

- [MongoDB Tutorial](https://docs.mongodb.com/manual/introduction/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [FastAPI Guide](https://fastapi.tiangolo.com/)
- [Socket.io Documentation](https://socket.io/docs/)

## ✨ Next Steps

1. **Start the applications** following the Quick Start
2. **Access the dashboard** at http://localhost:5173
3. **Select a trading pair** (BTCUSDT recommended)
4. **Monitor live data** and signals
5. **Review analytics** page for performance
6. **Customize settings** as needed

## 💡 Tips

- Monitor terminal outputs for errors
- Use browser DevTools to debug frontend
- Check MongoDB connection with `mongosh`
- Keep virtual environment activated in Python terminal
- Ensure all three services (backend, frontend, ai-engine) are running

---

**You're all set! Start trading analysis with AI! 🚀**
