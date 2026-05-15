const mongoose = require('mongoose');

const CandleSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  timeframe: {
    type: String,
    default: '1m'
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  openTime: Number,
  closeTime: Number,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  quoteVolume: Number,
  trades: Number,
  takerBuyBaseAssetVolume: Number,
  takerBuyQuoteAssetVolume: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for symbol and timestamp
CandleSchema.index({ symbol: 1, timestamp: 1 });

module.exports = mongoose.model('Candle', CandleSchema);
