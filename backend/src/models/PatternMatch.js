// Backend model for tracking pattern matches detected in live market
const mongoose = require('mongoose');

const PatternMatchSchema = new mongoose.Schema({
  // References
  savedPatternId: mongoose.Schema.Types.ObjectId,
  savedPatternName: String,
  
  // Match details
  symbol: String,
  matchTime: Date,
  similarityScore: Number,    // 0-100 (how similar to saved pattern)
  
  // Component scores
  componentScores: {
    candleSequence: Number,   // How similar are candle structures
    trendAlignment: Number,   // Does trend match?
    structureMatch: Number,   // Does structure match?
    liquidityMatch: Number,   // Do liquidity conditions match?
    indicatorMatch: Number    // Do indicators match?
  },
  
  // Live data at match time
  liveCandles: [{
    timestamp: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }],
  
  // Alert details
  entryDirection: String,     // BUY or SELL
  entryPrice: Number,
  confidenceLevel: String,    // LOW, MEDIUM, HIGH
  alertSent: Boolean,
  alertTime: Date,
  
  // Result (if traded)
  tradeTaken: Boolean,
  tradeResult: String,        // WIN, LOSS, PARTIAL
  tradeProfit: Number,
  
  // Meta
  createdAt: { type: Date, default: Date.now },
  reviewedByUser: Boolean,
  userFeedback: String
});

PatternMatchSchema.index({ savedPatternId: 1, matchTime: -1 });
PatternMatchSchema.index({ symbol: 1, matchTime: -1 });
PatternMatchSchema.index({ similarityScore: -1 });

module.exports = mongoose.model('PatternMatch', PatternMatchSchema);
