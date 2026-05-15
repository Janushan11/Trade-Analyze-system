/**
 * Server Initialization - Pattern System Setup
 * 
 * This file demonstrates how to integrate the Pattern Memory System
 * into your Express.js server with WebSocket support
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const PatternWebSocketService = require('./services/patternWebSocketService');
const patternRoutes = require('./routes/patterns');
const SavedPattern = require('./models/SavedPattern');
const PatternMatch = require('./models/PatternMatch');

/**
 * Initialize Pattern System in your main server file
 */
function initializePatternSystem(app, server, io) {
  // 1. Initialize WebSocket Service for real-time pattern matching
  const patternWebSocketService = new PatternWebSocketService(io, SavedPattern, PatternMatch);
  
  // 2. Setup WebSocket handlers
  patternWebSocketService.initializeHandlers();

  // 3. Register pattern API routes
  app.use('/api/patterns', patternRoutes);

  // 4. Optional: Add pattern system health check endpoint
  app.get('/api/health/patterns', (req, res) => {
    const status = patternWebSocketService.getActiveSessionCount();
    res.json({
      status: 'healthy',
      activePatternSessions: status,
      timestamp: new Date()
    });
  });

  console.log('✅ Pattern Memory System initialized');
  console.log('   - WebSocket handlers ready');
  console.log('   - Pattern API routes registered');
  console.log('   - Real-time pattern matching active');

  return patternWebSocketService;
}

/**
 * Example usage in your server.js:
 * 
 * const express = require('express');
 * const http = require('http');
 * const socketIo = require('socket.io');
 * const initializePatternSystem = require('./config/patternSystemConfig');
 * 
 * const app = express();
 * const server = http.createServer(app);
 * const io = socketIo(server, {
 *   cors: { origin: '*' }
 * });
 * 
 * // Initialize pattern system
 * const patternService = initializePatternSystem(app, server, io);
 * 
 * // Start server
 * server.listen(3001, () => {
 *   console.log('Server running on port 3001');
 *   console.log(`Pattern sessions active: ${patternService.getActiveSessionCount()}`);
 * });
 */

module.exports = initializePatternSystem;
