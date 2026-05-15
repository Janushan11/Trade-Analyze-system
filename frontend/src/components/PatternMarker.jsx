import React, { useState, useCallback } from 'react';
import './PatternMarker.module.css';

/**
 * Pattern Marker Component
 * Allows users to mark successful trading setups on chart
 * and save them as reusable patterns for future matching
 */
const PatternMarker = ({ chartRef, candleData, indicators, onPatternMarked }) => {
  const [isMarking, setIsMarking] = useState(false);
  const [markerMode, setMarkerMode] = useState('entry'); // entry or exit
  const [selectedCandles, setSelectedCandles] = useState([]);
  const [markerInfo, setMarkerInfo] = useState({
    entryIndex: null,
    exitIndex: null,
    entryPrice: null,
    exitPrice: null,
    profitLoss: 0,
    profitPercent: 0,
    trade_direction: 'BUY'
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternDetails, setPatternDetails] = useState({
    name: '',
    description: '',
    tradingSession: 'LONDON',
    marketCondition: 'TRENDING',
    volatility: 'MEDIUM',
    confidence: 75,
    tags: []
  });

  /**
   * Handle chart click to mark candles
   */
  const handleChartClick = useCallback((event) => {
    if (!isMarking || !chartRef?.current) return;

    try {
      // Get click position relative to chart
      const rect = chartRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;

      // Calculate which candle was clicked based on chart position
      const chartWidth = rect.width;
      const candleIndex = Math.floor((clickX / chartWidth) * candleData.length);

      if (candleIndex >= 0 && candleIndex < candleData.length) {
        if (markerMode === 'entry') {
          markEntryPoint(candleIndex);
        } else {
          markExitPoint(candleIndex);
        }
      }
    } catch (error) {
      console.error('Error marking candle:', error);
    }
  }, [isMarking, markerMode, candleData, chartRef]);

  /**
   * Mark entry point on chart
   */
  const markEntryPoint = (candleIndex) => {
    const candle = candleData[candleIndex];
    
    setMarkerInfo(prev => ({
      ...prev,
      entryIndex: candleIndex,
      entryPrice: candle.close,
      trade_direction: 'BUY' // Will be updated based on direction
    }));

    // Capture surrounding candles (20 before entry for context)
    const contextStart = Math.max(0, candleIndex - 20);
    const contextCandles = candleData.slice(contextStart, candleIndex + 1);
    setSelectedCandles(contextCandles);

    setMarkerMode('exit');
    showMarkerVisual(candleIndex, 'entry');
  };

  /**
   * Mark exit point on chart
   */
  const markExitPoint = (candleIndex) => {
    const candle = candleData[candleIndex];

    if (candleIndex <= markerInfo.entryIndex) {
      alert('Exit point must be after entry point');
      return;
    }

    const entryPrice = markerInfo.entryPrice;
    const exitPrice = candle.close;
    const profitLoss = exitPrice - entryPrice;
    const profitPercent = (profitLoss / entryPrice) * 100;

    setMarkerInfo(prev => ({
      ...prev,
      exitIndex: candleIndex,
      exitPrice,
      profitLoss: parseFloat(profitLoss.toFixed(8)),
      profitPercent: parseFloat(profitPercent.toFixed(2)),
      trade_direction: profitLoss > 0 ? 'BUY' : 'SELL'
    }));

    // Capture full pattern including exit
    const contextStart = Math.max(0, markerInfo.entryIndex - 20);
    const contextEnd = Math.min(candleData.length - 1, candleIndex + 5);
    const patternCandles = candleData.slice(contextStart, contextEnd + 1);
    setSelectedCandles(patternCandles);

    showMarkerVisual(candleIndex, 'exit');
    setIsMarking(false);
    setShowSaveDialog(true);
  };

  /**
   * Show visual marker on chart
   */
  const showMarkerVisual = (candleIndex, type) => {
    if (!chartRef?.current) return;

    const marker = document.createElement('div');
    marker.className = `chart-marker marker-${type}`;
    marker.innerHTML = type === 'entry' ? '📍 ENTRY' : '🎯 EXIT';
    marker.style.position = 'absolute';
    marker.style.pointerEvents = 'none';

    const chartRect = chartRef.current.getBoundingClientRect();
    const candleWidth = chartRect.width / candleData.length;
    const xPos = (candleIndex * candleWidth) + (candleWidth / 2);

    marker.style.left = `${xPos}px`;
    marker.style.top = type === 'entry' ? '10px' : '50px';

    chartRef.current.appendChild(marker);

    // Remove after animation
    setTimeout(() => marker.remove(), 3000);
  };

  /**
   * Save pattern to backend
   */
  const handleSavePattern = async () => {
    if (!patternDetails.name.trim()) {
      alert('Please enter a pattern name');
      return;
    }

    try {
      // Extract indicator state at entry and exit
      const indicatorState = {
        entry: {
          ema20: indicators?.ema20?.[markerInfo.entryIndex],
          ema50: indicators?.ema50?.[markerInfo.entryIndex],
          rsi: indicators?.rsi?.[markerInfo.entryIndex],
          macd: indicators?.macd?.[markerInfo.entryIndex],
          signal: indicators?.signal?.[markerInfo.entryIndex],
          histogram: indicators?.histogram?.[markerInfo.entryIndex],
        },
        exit: {
          ema20: indicators?.ema20?.[markerInfo.exitIndex],
          ema50: indicators?.ema50?.[markerInfo.exitIndex],
          rsi: indicators?.rsi?.[markerInfo.exitIndex],
          macd: indicators?.macd?.[markerInfo.exitIndex],
          signal: indicators?.signal?.[markerInfo.exitIndex],
          histogram: indicators?.histogram?.[markerInfo.exitIndex],
        }
      };

      const patternPayload = {
        patternName: patternDetails.name,
        description: patternDetails.description,
        direction: markerInfo.trade_direction,
        confidence: patternDetails.confidence,
        candleSequence: selectedCandles.map(c => ({
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        })),
        indicatorState,
        marketContext: {
          session: patternDetails.tradingSession,
          marketCondition: patternDetails.marketCondition,
          volatility: patternDetails.volatility,
          trendDirection: markerInfo.trade_direction,
        },
        entryPrice: markerInfo.entryPrice,
        exitPrice: markerInfo.exitPrice,
        profitLoss: markerInfo.profitLoss,
        profitPercent: markerInfo.profitPercent,
        tags: patternDetails.tags,
        sessionType: patternDetails.tradingSession,
        volatilityLevel: patternDetails.volatility,
        marketCondition: patternDetails.marketCondition
      };

      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patternPayload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show success message
        showSuccessNotification(patternDetails.name);

        // Callback to parent
        onPatternMarked?.(data.pattern);

        // Reset form
        resetMarker();
      } else {
        alert('Failed to save pattern');
      }
    } catch (error) {
      console.error('Error saving pattern:', error);
      alert('Error saving pattern: ' + error.message);
    }
  };

  /**
   * Reset marker to initial state
   */
  const resetMarker = () => {
    setIsMarking(false);
    setMarkerMode('entry');
    setSelectedCandles([]);
    setMarkerInfo({
      entryIndex: null,
      exitIndex: null,
      entryPrice: null,
      exitPrice: null,
      profitLoss: 0,
      profitPercent: 0,
      trade_direction: 'BUY'
    });
    setShowSaveDialog(false);
    setPatternDetails({
      name: '',
      description: '',
      tradingSession: 'LONDON',
      marketCondition: 'TRENDING',
      volatility: 'MEDIUM',
      confidence: 75,
      tags: []
    });
  };

  /**
   * Show success notification
   */
  const showSuccessNotification = (patternName) => {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-icon">✅</div>
      <div class="notification-message">
        <p class="title">Pattern Saved!</p>
        <p class="subtitle">"${patternName}" has been added to your pattern library</p>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  };

  return (
    <div className="pattern-marker">
      {/* Marker Controls */}
      <div className="marker-controls">
        <h3>📍 Pattern Marker</h3>
        
        {!isMarking ? (
          <button 
            className="btn-start-marking"
            onClick={() => setIsMarking(true)}
          >
            ➕ Mark New Pattern
          </button>
        ) : (
          <div className="marking-status">
            <div className="status-info">
              <span className={`status-step ${markerInfo.entryIndex !== null ? 'completed' : ''}`}>
                1️⃣ Click Entry Point
              </span>
              <span className={`status-step ${markerInfo.exitIndex !== null ? 'completed' : ''}`}>
                2️⃣ Click Exit Point
              </span>
            </div>
            
            {markerInfo.entryIndex !== null && (
              <div className="entry-info">
                <p>Entry at candle #{markerInfo.entryIndex} • Price: {markerInfo.entryPrice?.toFixed(8)}</p>
                {markerInfo.exitIndex !== null && (
                  <div className="exit-info">
                    <p>Exit at candle #{markerInfo.exitIndex} • Price: {markerInfo.exitPrice?.toFixed(8)}</p>
                    <div className={`result ${markerInfo.profitLoss > 0 ? 'profit' : 'loss'}`}>
                      <span className="pnl">{markerInfo.profitLoss > 0 ? '+' : ''}{markerInfo.profitLoss.toFixed(8)}</span>
                      <span className="pnl-percent">({markerInfo.profitPercent > 0 ? '+' : ''}{markerInfo.profitPercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              className="btn-cancel-marking"
              onClick={() => resetMarker()}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Save Pattern Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={e => e.stopPropagation()}>
            <h3>📚 Save Pattern to Library</h3>

            <div className="dialog-grid">
              <div className="form-group">
                <label>Pattern Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Bullish Sweep Reversal"
                  value={patternDetails.name}
                  onChange={(e) => setPatternDetails({...patternDetails, name: e.target.value})}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Trading Session</label>
                <select
                  value={patternDetails.tradingSession}
                  onChange={(e) => setPatternDetails({...patternDetails, tradingSession: e.target.value})}
                >
                  <option value="LONDON">London Open</option>
                  <option value="NEWYORK">New York Open</option>
                  <option value="TOKYO">Tokyo Session</option>
                  <option value="SYDNEY">Sydney Session</option>
                </select>
              </div>

              <div className="form-group">
                <label>Market Condition</label>
                <select
                  value={patternDetails.marketCondition}
                  onChange={(e) => setPatternDetails({...patternDetails, marketCondition: e.target.value})}
                >
                  <option value="RANGING">Ranging</option>
                  <option value="TRENDING">Trending</option>
                  <option value="BREAKOUT">Breakout</option>
                </select>
              </div>

              <div className="form-group">
                <label>Volatility Level</label>
                <select
                  value={patternDetails.volatility}
                  onChange={(e) => setPatternDetails({...patternDetails, volatility: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Your Confidence ({patternDetails.confidence}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patternDetails.confidence}
                  onChange={(e) => setPatternDetails({...patternDetails, confidence: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description & Trade Setup Notes</label>
              <textarea
                placeholder="Describe what made this setup successful..."
                value={patternDetails.description}
                onChange={(e) => setPatternDetails({...patternDetails, description: e.target.value})}
                rows="4"
              />
            </div>

            <div className="trade-results">
              <div className="result-stat">
                <span className="label">Entry Price</span>
                <span className="value">{markerInfo.entryPrice?.toFixed(8)}</span>
              </div>
              <div className="result-stat">
                <span className="label">Exit Price</span>
                <span className="value">{markerInfo.exitPrice?.toFixed(8)}</span>
              </div>
              <div className={`result-stat ${markerInfo.profitLoss > 0 ? 'profit' : 'loss'}`}>
                <span className="label">P&L</span>
                <span className="value">{markerInfo.profitLoss > 0 ? '+' : ''}{markerInfo.profitLoss.toFixed(8)}</span>
              </div>
              <div className={`result-stat ${markerInfo.profitPercent > 0 ? 'profit' : 'loss'}`}>
                <span className="label">Return %</span>
                <span className="value">{markerInfo.profitPercent > 0 ? '+' : ''}{markerInfo.profitPercent.toFixed(2)}%</span>
              </div>
            </div>

            <div className="dialog-actions">
              <button className="btn-save-pattern" onClick={handleSavePattern}>
                ✅ Save Pattern
              </button>
              <button 
                className="btn-cancel-dialog"
                onClick={() => {
                  setShowSaveDialog(false);
                  resetMarker();
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternMarker;
