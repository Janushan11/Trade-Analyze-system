#!/bin/bash
# 🎯 Pattern Memory System - QUICK START GUIDE
# 
# This file contains all the essential setup commands to get the
# Pattern Memory System running in your Trade-Analyze-system project

# ════════════════════════════════════════════════════════════════
# STEP 1: PREREQUISITES
# ════════════════════════════════════════════════════════════════
# Ensure you have these installed and running:
#   ✓ Node.js (v16+)
#   ✓ Python (v3.9+)
#   ✓ MongoDB (local or cloud)
#   ✓ npm / pip package managers

# ════════════════════════════════════════════════════════════════
# STEP 2: BACKEND SETUP
# ════════════════════════════════════════════════════════════════

# 2.1 Navigate to backend directory
cd backend

# 2.2 Install dependencies (if not already installed)
npm install socket.io mongoose

# 2.3 Update your server.js file
# Add these lines after Express app initialization:

# ────── IN server.js ──────
# const PatternWebSocketService = require('./src/services/patternWebSocketService');
# const patternRoutes = require('./src/routes/patterns');
# const SavedPattern = require('./src/models/SavedPattern');
# const PatternMatch = require('./src/models/PatternMatch');
# 
# // Initialize pattern system
# const patternService = new PatternWebSocketService(io, SavedPattern, PatternMatch);
# patternService.initializeHandlers();
# 
# // Register routes
# app.use('/api/patterns', patternRoutes);
# ────────────────────────────

# 2.4 Verify backend is running
npm start
# Expected output: "✓ Pattern Memory System initialized"
# Server running on port 3001
# Pattern sessions active: 0

# ════════════════════════════════════════════════════════════════
# STEP 3: AI ENGINE SETUP
# ════════════════════════════════════════════════════════════════

# 3.1 Navigate to AI engine directory (in separate terminal)
cd ai-engine

# 3.2 Create Python virtual environment
python -m venv venv

# 3.3 Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# 3.4 Install dependencies
pip install fastapi uvicorn pandas numpy scikit-learn

# 3.5 Update main.py to include pattern routes
# Add this after other imports:
# from src.routes import pattern_routes
# app.include_router(pattern_routes.router)

# 3.6 Start AI engine
uvicorn src.main:app --reload --port 8001
# Expected output: "Uvicorn running on http://127.0.0.1:8001"

# ════════════════════════════════════════════════════════════════
# STEP 4: FRONTEND SETUP
# ════════════════════════════════════════════════════════════════

# 4.1 Navigate to frontend directory (in separate terminal)
cd frontend

# 4.2 Install Socket.io client
npm install socket.io-client

# 4.3 Import PatternDashboard in your main app
# In your main App.jsx or component:
# import PatternDashboard from './components/PatternDashboard';
# 
# Then use it:
# <PatternDashboard
#   symbol="BTCUSDT"
#   chartRef={chartRef}
#   candleData={candleData}
#   indicators={indicators}
# />

# 4.4 Start frontend dev server
npm run dev
# Expected output: "Local: http://localhost:5173"

# ════════════════════════════════════════════════════════════════
# STEP 5: TEST THE SYSTEM
# ════════════════════════════════════════════════════════════════

# 5.1 Open http://localhost:5173 in browser
# 5.2 Navigate to Pattern Dashboard
# 5.3 Click "Mark New Pattern" tab
# 5.4 Click "Mark New Pattern" button
# 5.5 Click entry point on chart
# 5.6 Click exit point on chart
# 5.7 Fill in pattern details
# 5.8 Click "Save Pattern"
# 5.9 Switch to "Library" tab - should see saved pattern
# 5.10 Switch to "Live Matching" tab
# 5.11 Should see connection status as "Connected ✓"
# 5.12 Click "🔍 Check Now" button
# 5.13 Verify WebSocket connection working

# ════════════════════════════════════════════════════════════════
# COMMON ISSUES & FIXES
# ════════════════════════════════════════════════════════════════

# Issue: "Cannot find module 'socket.io-client'"
# Fix: npm install socket.io-client

# Issue: "Backend API not responding"
# Fix: Verify server.js includes pattern routes and WebSocket service
# Check: http://localhost:3001/api/patterns (should return patterns array)

# Issue: "AI Engine not responding"
# Fix: Verify FastAPI running on port 8001
# Check: http://localhost:8001/docs (FastAPI Swagger docs)

# Issue: "WebSocket connection refused"
# Fix: Ensure backend WebSocket service initialized
# Check: Browser console should show Socket.io debug messages

# Issue: "MongoDB connection error"
# Fix: Verify MongoDB is running and connection string is correct
# Check: Logs should show connection success

# Issue: "Patterns not matching"
# Fix: 
#   1. Lower similarity thresholds in patternWebSocketService.js
#   2. Verify indicator calculations are correct
#   3. Check AI engine response time
#   4. Manually test pattern comparison via /api/patterns/:id/match

# ════════════════════════════════════════════════════════════════
# PERFORMANCE OPTIMIZATION
# ════════════════════════════════════════════════════════════════

# Add database indexes for faster queries:
# mongodb://localhost:27017
# db.savedPatterns.createIndex({ symbol: 1, createdAt: -1 })
# db.savedPatterns.createIndex({ userId: 1 })
# db.patternMatches.createIndex({ savedPatternId: 1, matchedAt: -1 })

# ════════════════════════════════════════════════════════════════
# FILE CHECKLIST
# ════════════════════════════════════════════════════════════════

echo "Pattern System File Checklist"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Backend Models:"
echo "  [ ] backend/src/models/SavedPattern.js"
echo "  [ ] backend/src/models/PatternMatch.js"
echo ""
echo "Backend Routes:"
echo "  [ ] backend/src/routes/patterns.js"
echo ""
echo "Backend Services:"
echo "  [ ] backend/src/services/patternWebSocketService.js"
echo "  [ ] backend/src/config/patternSystemConfig.js"
echo ""
echo "AI Engine:"
echo "  [ ] ai-engine/src/analysis/pattern_engine.py"
echo "  [ ] ai-engine/src/routes/pattern_routes.py"
echo ""
echo "Frontend Components:"
echo "  [ ] frontend/src/components/PatternMarker.jsx"
echo "  [ ] frontend/src/components/PatternMarker.module.css"
echo "  [ ] frontend/src/components/PatternManager.jsx"
echo "  [ ] frontend/src/components/PatternManager.module.css"
echo "  [ ] frontend/src/components/LivePatternMatcher.jsx"
echo "  [ ] frontend/src/components/LivePatternMatcher.module.css"
echo "  [ ] frontend/src/components/PatternDashboard.jsx"
echo "  [ ] frontend/src/components/PatternDashboard.module.css"
echo ""
echo "Frontend Services:"
echo "  [ ] frontend/src/services/patternSocketService.js"
echo ""
echo "Frontend Examples:"
echo "  [ ] frontend/src/examples/PatternIntegrationExample.jsx"
echo ""
echo "Documentation:"
echo "  [ ] PATTERN_SYSTEM_GUIDE.md"
echo "  [ ] IMPLEMENTATION_SUMMARY.md"
echo ""
echo "════════════════════════════════════════════════════════════════"

# ════════════════════════════════════════════════════════════════
# DEPLOYMENT COMMANDS
# ════════════════════════════════════════════════════════════════

# Production Build Frontend:
# cd frontend
# npm run build
# This creates dist/ folder for production deployment

# Production Backend:
# Set NODE_ENV=production
# npm start

# Production AI Engine:
# pip install gunicorn
# gunicorn -w 4 -b 0.0.0.0:8001 src.main:app

# ════════════════════════════════════════════════════════════════
# NEXT STEPS
# ════════════════════════════════════════════════════════════════

# 1. ✅ Copy all 18 files to your project
# 2. ✅ Update server.js with pattern system initialization
# 3. ✅ Install dependencies (npm, pip)
# 4. ✅ Start all three services (backend, AI engine, frontend)
# 5. ✅ Test pattern marking workflow
# 6. ✅ Test real-time alerts
# 7. ✅ Monitor WebSocket connection in browser dev tools
# 8. ✅ Optimize similarity thresholds based on your patterns
# 9. ✅ Add database indexes for performance
# 10. ✅ Deploy to production

# ════════════════════════════════════════════════════════════════
# SUPPORT & DOCUMENTATION
# ════════════════════════════════════════════════════════════════

# 📖 Full documentation: PATTERN_SYSTEM_GUIDE.md
# 📊 Implementation summary: IMPLEMENTATION_SUMMARY.md
# 💡 Integration example: PatternIntegrationExample.jsx
# 🎯 Component usage: See JSDoc in each component file

echo ""
echo "✅ Quick Start Guide Complete!"
echo ""
echo "For detailed documentation, see:"
echo "  - PATTERN_SYSTEM_GUIDE.md"
echo "  - IMPLEMENTATION_SUMMARY.md"
echo ""
echo "Questions? Check the troubleshooting section in the guide."
echo ""
