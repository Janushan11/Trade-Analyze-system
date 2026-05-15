const mongoose = require('mongoose');

const SignalSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL', 'HOLD'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  upProbability: {
    type: Number,
    min: 0,
    max: 100
  },
  downProbability: {
    type: Number,
    min: 0,
    max: 100
  },
  patterns: {
    bos: Boolean,
    choch: Boolean,
    liquiditySweep: Boolean,
    orderBlock: Boolean,
    fvg: Boolean,
    qm: {
      type: String,
      enum: ['BULLISH', 'BEARISH', 'NONE']
    }
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH']
  },
  trend: {
    direction: {
      type: String,
      enum: ['UP', 'DOWN', 'NEUTRAL']
    },
    strength: Number
  },
  entryPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  timeframe: {
    type: String,
    default: '1m'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 3600 }
  }
});

module.exports = mongoose.model('Signal', SignalSchema);
