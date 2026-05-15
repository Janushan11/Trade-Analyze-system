// Backend API routes for pattern management
const express = require('express');
const router = express.Router();
const SavedPattern = require('../models/SavedPattern');
const PatternMatch = require('../models/PatternMatch');

/**
 * POST /patterns/save
 * Save a new trading pattern from user input
 */
router.post('/save', async (req, res) => {
  try {
    const {
      symbol,
      patternName,
      description,
      direction,
      confidence,
      candleSequence,
      entryCandle,
      exitCandle,
      indicatorState,
      marketStructure,
      liquidityAnalysis,
      sessionType,
      volatilityLevel,
      marketCondition,
      tags,
      screenshot
    } = req.body;

    // Validate required fields
    if (!symbol || !patternName || !direction || !candleSequence) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPattern = new SavedPattern({
      symbol,
      patternName,
      description,
      direction,
      confidence: confidence || 70,
      candleSequence,
      entryCandle,
      exitCandle,
      indicatorState,
      marketStructure,
      liquidityAnalysis,
      sessionType,
      volatilityLevel,
      marketCondition,
      tags: tags || [],
      screenshot
    });

    await newPattern.save();

    res.json({
      success: true,
      message: 'Pattern saved successfully',
      patternId: newPattern._id,
      pattern: newPattern
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /patterns/list
 * Get all saved patterns for a symbol
 */
router.get('/list/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const patterns = await SavedPattern.find({ symbol })
      .sort({ matchCount: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: patterns.length,
      patterns
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /patterns/:id
 * Get a single pattern by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const pattern = await SavedPattern.findById(req.params.id);
    
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json({
      success: true,
      pattern
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /patterns/:id
 * Update a saved pattern
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = new Date();

    const pattern = await SavedPattern.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json({
      success: true,
      message: 'Pattern updated',
      pattern
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /patterns/:id
 * Delete a saved pattern
 */
router.delete('/:id', async (req, res) => {
  try {
    const pattern = await SavedPattern.findByIdAndDelete(req.params.id);

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json({
      success: true,
      message: 'Pattern deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /patterns/update-score
 * Update pattern's performance score when trade completes
 */
router.post('/update-score/:id', async (req, res) => {
  try {
    const { tradeResult, profit } = req.body;
    
    const pattern = await SavedPattern.findById(req.params.id);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    // Update performance metrics
    pattern.performanceScore.totalTrades += 1;
    
    if (tradeResult === 'WIN') {
      pattern.performanceScore.winningTrades += 1;
    } else if (tradeResult === 'LOSS') {
      pattern.performanceScore.losingTrades += 1;
    }

    // Calculate win rate
    pattern.performanceScore.winRate = 
      (pattern.performanceScore.winningTrades / pattern.performanceScore.totalTrades) * 100;

    // Calculate profit factor (simple: wins / losses)
    if (pattern.performanceScore.losingTrades > 0) {
      pattern.performanceScore.profitFactor = 
        pattern.performanceScore.winningTrades / pattern.performanceScore.losingTrades;
    }

    pattern.lastMatched = new Date();
    await pattern.save();

    res.json({
      success: true,
      message: 'Pattern score updated',
      performanceScore: pattern.performanceScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /patterns/matches/:symbol
 * Get all matches for a symbol
 */
router.get('/matches/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = req.query.limit || 50;

    const matches = await PatternMatch.find({ symbol })
      .sort({ matchTime: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /patterns/log-match
 * Log a detected pattern match
 */
router.post('/log-match', async (req, res) => {
  try {
    const matchData = req.body;

    const newMatch = new PatternMatch(matchData);
    await newMatch.save();

    // Update pattern's match count
    if (matchData.savedPatternId) {
      await SavedPattern.findByIdAndUpdate(
        matchData.savedPatternId,
        { $inc: { matchCount: 1 }, lastMatched: new Date() }
      );
    }

    res.json({
      success: true,
      message: 'Match logged',
      matchId: newMatch._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
