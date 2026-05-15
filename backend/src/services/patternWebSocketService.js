/**
 * Pattern Matching WebSocket Service (Backend)
 * Streams real-time pattern matches from the AI engine to connected clients
 */

const axios = require('axios');

class PatternWebSocketService {
  constructor(io, PatternModel, PatternMatchModel) {
    this.io = io;
    this.PatternModel = PatternModel;
    this.PatternMatchModel = PatternMatchModel;
    this.matchThresholds = {
      HIGH: 80,
      MEDIUM: 60,
      LOW: 40
    };
    this.activeSessions = new Map();
  }

  /**
   * Initialize WebSocket handlers
   */
  initializeHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[PatternSocket] Client connected: ${socket.id}`);

      // Client subscribes to pattern matching for a symbol
      socket.on('subscribe-pattern-updates', (data) => {
        this.handleSubscription(socket, data);
      });

      // Client manually requests pattern check
      socket.on('check-patterns', (data) => {
        this.handleManualCheck(socket, data);
      });

      // Client unsubscribes
      socket.on('unsubscribe-pattern-updates', (data) => {
        this.handleUnsubscription(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  /**
   * Handle client subscription to pattern updates
   */
  handleSubscription(socket, data) {
    const { symbol } = data;
    
    if (!symbol) {
      socket.emit('error', { message: 'Symbol required' });
      return;
    }

    const sessionKey = `${socket.id}-${symbol}`;
    
    this.activeSessions.set(sessionKey, {
      socketId: socket.id,
      symbol,
      subscribedAt: new Date(),
      lastCheckTime: null
    });

    socket.join(`pattern-updates-${symbol}`);
    socket.emit('subscription-confirmed', { symbol });

    console.log(`[PatternSocket] Client ${socket.id} subscribed to ${symbol} pattern updates`);
  }

  /**
   * Handle manual pattern check request
   */
  async handleManualCheck(socket, data) {
    const { symbol, liveCandles } = data;

    try {
      const matches = await this.checkPatterns(symbol, liveCandles);
      
      // Emit results back to requesting client
      socket.emit('pattern-check-results', {
        symbol,
        matches: matches.all,
        topMatch: matches.top,
        alertTriggered: matches.alert,
        timestamp: new Date()
      });

      // Broadcast high-confidence matches to all subscribers
      if (matches.alert) {
        this.io.to(`pattern-updates-${symbol}`).emit('pattern-match', {
          symbol,
          matches: matches.all,
          top_match: matches.top,
          alert_triggered: true
        });
      }
    } catch (error) {
      console.error('[PatternSocket] Error during pattern check:', error);
      socket.emit('error', { message: 'Pattern check failed' });
    }
  }

  /**
   * Handle client unsubscription
   */
  handleUnsubscription(socket, data) {
    const { symbol } = data;
    const sessionKey = `${socket.id}-${symbol}`;
    
    this.activeSessions.delete(sessionKey);
    socket.leave(`pattern-updates-${symbol}`);

    console.log(`[PatternSocket] Client ${socket.id} unsubscribed from ${symbol} pattern updates`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(socket) {
    // Clean up all sessions for this socket
    for (const [sessionKey, session] of this.activeSessions.entries()) {
      if (session.socketId === socket.id) {
        this.activeSessions.delete(sessionKey);
      }
    }

    console.log(`[PatternSocket] Client disconnected: ${socket.id}`);
  }

  /**
   * Main pattern checking logic
   * Compares live candles against all stored patterns
   */
  async checkPatterns(symbol, liveCandles) {
    try {
      // Fetch all patterns for this symbol
      const patterns = await this.PatternModel.find({ symbol });

      if (patterns.length === 0) {
        return { all: [], top: null, alert: false };
      }

      const matches = [];

      // Check each pattern against live candles
      for (const pattern of patterns) {
        const match = await this.comparePattern(pattern, liveCandles);

        if (match.similarity >= this.matchThresholds.LOW) {
          matches.push(match);
        }
      }

      // Sort by similarity score (highest first)
      matches.sort((a, b) => b.similarity - a.similarity);

      // Determine alert level for top match
      const topMatch = matches.length > 0 ? matches[0] : null;
      const alertTriggered = topMatch && topMatch.similarity >= this.matchThresholds.MEDIUM;

      // Log the match if high confidence
      if (alertTriggered && topMatch) {
        await this.logPatternMatch(topMatch, liveCandles);
      }

      return {
        all: matches,
        top: topMatch,
        alert: alertTriggered
      };
    } catch (error) {
      console.error('[PatternSocket] Error checking patterns:', error);
      throw error;
    }
  }

  /**
   * Compare single pattern against live candles
   */
  async comparePattern(pattern, liveCandles) {
    try {
      // Call AI engine for similarity scoring
      const response = await axios.post('http://localhost:8001/api/pattern/compare', {
        stored_pattern_id: pattern._id.toString(),
        live_candles: liveCandles
      });

      const { similarity_score, component_scores, match_details } = response.data;

      // Determine alert level
      const alertLevel = similarity_score >= this.matchThresholds.HIGH 
        ? 'HIGH'
        : similarity_score >= this.matchThresholds.MEDIUM
        ? 'MEDIUM'
        : 'LOW';

      return {
        pattern_id: pattern._id,
        pattern_name: pattern.patternName || pattern.name,
        direction: pattern.direction,
        similarity: similarity_score,
        confidence: pattern.confidence,
        alert_level: alertLevel,
        component_scores: {
          candle_sequence: component_scores?.candle_shape || 0,
          trend_alignment: component_scores?.trend_match || 0,
          structure_match: component_scores?.structure_match || 0,
          liquidity_match: component_scores?.liquidity_match || 0,
          indicator_match: component_scores?.indicator_match || 0
        },
        matches: {
          candle_sequence: match_details?.candle_aligned,
          trend_aligned: match_details?.trend_aligned,
          structure_similar: match_details?.structure_aligned,
          liquidity_context: match_details?.liquidity_match,
          indicators_aligned: match_details?.indicators_aligned
        }
      };
    } catch (error) {
      console.error('[PatternSocket] Error comparing pattern:', error);
      return null;
    }
  }

  /**
   * Log pattern match to database
   */
  async logPatternMatch(match, liveCandles) {
    try {
      const patternMatch = new this.PatternMatchModel({
        savedPatternId: match.pattern_id,
        symbol: (liveCandles[0]?.symbol || 'UNKNOWN'),
        matchedAt: new Date(),
        similarity: match.similarity,
        confidence: match.confidence,
        alertLevel: match.alert_level,
        matchDetails: {
          candleShapeSimilarity: match.component_scores.candle_sequence,
          indicatorAlignment: match.component_scores.indicator_match,
          structureMatch: match.component_scores.structure_match,
          trendAlignment: match.component_scores.trend_alignment,
          liquidityMatch: match.component_scores.liquidity_match
        },
        liveCandles: liveCandles.slice(-20), // Store last 20 candles for reference
        alertSent: true
      });

      await patternMatch.save();

      // Update pattern's match count and last matched time
      await this.PatternModel.findByIdAndUpdate(
        match.pattern_id,
        {
          $inc: { matchCount: 1 },
          lastMatched: new Date()
        }
      );

      console.log(`[PatternSocket] Pattern match logged: ${match.pattern_name} (${match.similarity}%)`);
    } catch (error) {
      console.error('[PatternSocket] Error logging pattern match:', error);
    }
  }

  /**
   * Broadcast pattern check results to specific room
   */
  broadcastPatternResults(symbol, results) {
    this.io.to(`pattern-updates-${symbol}`).emit('pattern-check-results', {
      symbol,
      matches: results.all,
      topMatch: results.top,
      alertTriggered: results.alert,
      timestamp: new Date()
    });
  }

  /**
   * Get active session count
   */
  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  /**
   * Get active sessions for a symbol
   */
  getActiveSessionsBySymbol(symbol) {
    const sessions = [];
    for (const [, session] of this.activeSessions.entries()) {
      if (session.symbol === symbol) {
        sessions.push(session);
      }
    }
    return sessions;
  }
}

module.exports = PatternWebSocketService;
