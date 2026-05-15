const express = require('express');
const router = express.Router();
const Signal = require('../models/Signal');

// Get latest signals
router.get('/latest', async (req, res) => {
  try {
    const { symbol, limit = 10 } = req.query;
    
    const query = symbol ? { symbol: symbol.toUpperCase() } : {};
    
    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get signals by symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    const signals = await Signal.find({ symbol: symbol.toUpperCase() })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create signal (internal use)
router.post('/', async (req, res) => {
  try {
    const signal = new Signal(req.body);
    await signal.save();
    res.status(201).json(signal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
