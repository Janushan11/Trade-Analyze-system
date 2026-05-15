// Backend model for storing successful trading patterns
const mongoose = require('mongoose');

// Individual candle in a pattern sequence
const CandleSchema = new mongoose.Schema({
  index: Number,
  timestamp: Date,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  bodySize: Number,           // % of candle range
  upperWick: Number,          // wick size
  lowerWick: Number,          // wick size
  direction: String,          // UP, DOWN, DOJI
  type: String,               // MOMENTUM, REJECTION, PIN_BAR, ENGULFING, etc.
  engulfs: Boolean,
  isEngulfed: Boolean
});

// Indicator state at pattern time
const IndicatorStateSchema = new mongoose.Schema({
  ema20: Number,
  ema50: Number,
  ema200: Number,
  rsi: Number,
  macd: {
    value: Number,
    signal: Number,
    histogram: Number
  },
  atr: Number,
  volumeSpike: Boolean,
  volumeAverage: Number
});

// Market structure during pattern
const MarketStructureSchema = new mongoose.Schema({
  trend: String,              // UP, DOWN, NEUTRAL
  trendStrength: Number,      // 0-100
  structure: String,          // HH, HL, LH, LL
  structureLevel: Number,
  nearestSupport: Number,
  nearestResistance: Number,
  bos: Boolean,               // Break of Structure
  choch: Boolean,             // Change of Character
  liquiditySweep: Boolean,
  fakeBreakout: Boolean
});

// Liquidity analysis during pattern
const LiquidityAnalysisSchema = new mongoose.Schema({
  wickSweep: Boolean,
  wickSweepType: String,      // UPPER, LOWER
  stopHunt: Boolean,
  stopHuntType: String,
  orderBlockLevel: Number,
  orderBlockType: String,     // BULLISH, BEARISH
  fairValueGap: Boolean
});

// Complete pattern definition
const SavedPatternSchema = new mongoose.Schema({
  // Basic info
  symbol: String,             // BTCUSDT, ETHUSDT, etc.
  patternName: String,        // "Bullish Sweep Reversal", "Bearish CHOCH", etc.
  description: String,        // User's notes about the setup
  direction: String,          // BUY or SELL
  confidence: Number,         // Initial confidence (0-100)
  
  // Pattern data
  candleSequence: [CandleSchema],     // 20-50 candles forming the pattern
  entryCandle: Number,                // Index of entry candle
  exitCandle: Number,                 // Index of exit candle (if trade completed)
  
  // States
  indicatorState: IndicatorStateSchema,
  marketStructure: MarketStructureSchema,
  liquidityAnalysis: LiquidityAnalysisSchema,
  
  // Context
  sessionType: String,        // LONDON, NEWYORK, TOKYO, SYDNEY
  timeOfDay: String,          // ASIAN, LONDON, NEWYORK
  volatilityLevel: String,    // LOW, MEDIUM, HIGH
  marketCondition: String,    // RANGING, TRENDING, BREAKOUT
  
  // Performance tracking
  performanceScore: {
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    losingTrades: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    profitFactor: { type: Number, default: 0 }
  },
  
  // Meta
  screenshot: String,         // Base64 encoded screenshot
  tags: [String],            // "sweep", "reversal", "breakout", etc.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastMatched: Date,
  matchCount: { type: Number, default: 0 }
});

// Index for faster queries
SavedPatternSchema.index({ symbol: 1, createdAt: -1 });
SavedPatternSchema.index({ tags: 1 });
SavedPatternSchema.index({ matchCount: -1 });

module.exports = mongoose.model('SavedPattern', SavedPatternSchema);
