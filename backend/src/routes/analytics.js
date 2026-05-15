const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');
const Signal = require('../models/Signal');
const Candle = require('../models/Candle');

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'EURUSDT'];
    
    const overview = await Promise.all(
      symbols.map(async (symbol) => {
        const latestCandle = await Candle.findOne({ symbol })
          .sort({ timestamp: -1 });
        
        const latestSignal = await Signal.findOne({ symbol })
          .sort({ createdAt: -1 });

        const latestPrediction = await Prediction.findOne({ symbol })
          .sort({ timestamp: -1 });

        return {
          symbol,
          price: latestCandle?.close || 0,
          signal: latestSignal?.type || 'HOLD',
          confidence: latestSignal?.confidence || 0,
          prediction: latestPrediction?.upProbability || 0
        };
      })
    );

    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const predictions = await Prediction.find({
      timestamp: { $gte: startDate }
    });

    const total = predictions.length;
    const correct = predictions.filter(p => p.result === 'CORRECT').length;
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;

    const avgConfidence = predictions.length > 0
      ? (predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length).toFixed(2)
      : 0;

    res.json({
      totalPredictions: total,
      correctPredictions: correct,
      accuracy: `${accuracy}%`,
      averageConfidence: avgConfidence,
      timeframe: `Last ${days} days`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
