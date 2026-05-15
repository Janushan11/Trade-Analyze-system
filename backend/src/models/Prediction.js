const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  upProbability: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  downProbability: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  trend: {
    type: String,
    enum: ['UP', 'DOWN', 'NEUTRAL']
  },
  trendStrength: Number,
  indicators: {
    ema: Number,
    rsi: Number,
    macd: {
      value: Number,
      signal: Number,
      histogram: Number
    },
    candleStructure: String,
    volumeSpike: Boolean,
    volatility: Number
  },
  accuracy: Number,
  result: {
    type: String,
    enum: ['CORRECT', 'INCORRECT', 'PENDING']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', PredictionSchema);
