const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');

// Get latest predictions
router.get('/latest', async (req, res) => {
  try {
    const { symbol, limit = 10 } = req.query;
    
    const query = symbol ? { symbol: symbol.toUpperCase() } : {};
    
    const predictions = await Prediction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prediction history for symbol
router.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const predictions = await Prediction.find({
      symbol: symbol.toUpperCase(),
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prediction stats
router.get('/:symbol/stats', async (req, res) => {
  try {
    const { symbol } = req.params;

    const total = await Prediction.countDocuments({ symbol: symbol.toUpperCase() });
    const correct = await Prediction.countDocuments({ symbol: symbol.toUpperCase(), result: 'CORRECT' });
    const incorrect = await Prediction.countDocuments({ symbol: symbol.toUpperCase(), result: 'INCORRECT' });

    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;
    const winRatio = incorrect > 0 ? (correct / incorrect).toFixed(2) : correct > 0 ? 'N/A' : 0;

    res.json({
      total,
      correct,
      incorrect,
      accuracy: `${accuracy}%`,
      winRatio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
