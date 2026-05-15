import React, { useState } from 'react';
import './PatternManager.module.css';

/**
 * Pattern Manager Component
 * Allows users to save, edit, and view custom trading patterns
 */
const PatternManager = ({ symbol, onPatternSaved }) => {
  const [patterns, setPatterns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [formData, setFormData] = useState({
    patternName: '',
    description: '',
    direction: 'BUY',
    confidence: 70,
    tags: [],
    sessionType: 'LONDON',
    volatilityLevel: 'MEDIUM',
    marketCondition: 'TRENDING'
  });

  // Fetch patterns for symbol
  const loadPatterns = async () => {
    try {
      const response = await fetch(`/api/patterns/list/${symbol}`);
      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  };

  // Save pattern from user input
  const handleSavePattern = async (candleSequence, indicators, structure, liquidity) => {
    try {
      const response = await fetch('/api/patterns/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          ...formData,
          candleSequence,
          indicatorState: indicators,
          marketStructure: structure,
          liquidityAnalysis: liquidity
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPatterns([...patterns, data.pattern]);
        setShowForm(false);
        setFormData({
          patternName: '',
          description: '',
          direction: 'BUY',
          confidence: 70,
          tags: [],
          sessionType: 'LONDON',
          volatilityLevel: 'MEDIUM',
          marketCondition: 'TRENDING'
        });
        onPatternSaved?.(data.pattern);
      }
    } catch (error) {
      console.error('Failed to save pattern:', error);
    }
  };

  // Delete pattern
  const handleDeletePattern = async (patternId) => {
    try {
      const response = await fetch(`/api/patterns/${patternId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPatterns(patterns.filter(p => p._id !== patternId));
      }
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  };

  // View pattern details
  const handleViewPattern = (pattern) => {
    setSelectedPattern(selectedPattern?._id === pattern._id ? null : pattern);
  };

  return (
    <div className="pattern-manager">
      <div className="manager-header">
        <h2>📚 Custom Pattern Library</h2>
        <button className="btn-add" onClick={() => setShowForm(true)}>
          + Save New Pattern
        </button>
      </div>

      {/* Pattern Save Form */}
      {showForm && (
        <div className="pattern-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Pattern Name *</label>
              <input
                type="text"
                placeholder="e.g., Bullish Sweep Reversal"
                value={formData.patternName}
                onChange={(e) => setFormData({...formData, patternName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Direction *</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({...formData, direction: e.target.value})}
              >
                <option value="BUY">BUY ⬆️</option>
                <option value="SELL">SELL ⬇️</option>
              </select>
            </div>

            <div className="form-group">
              <label>Confidence Level</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.confidence}
                onChange={(e) => setFormData({...formData, confidence: parseInt(e.target.value)})}
              />
              <span className="confidence-value">{formData.confidence}%</span>
            </div>

            <div className="form-group">
              <label>Session Type</label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
              >
                <option value="LONDON">London Open</option>
                <option value="NEWYORK">New York Open</option>
                <option value="TOKYO">Tokyo Session</option>
                <option value="SYDNEY">Sydney Session</option>
              </select>
            </div>

            <div className="form-group">
              <label>Volatility Level</label>
              <select
                value={formData.volatilityLevel}
                onChange={(e) => setFormData({...formData, volatilityLevel: e.target.value})}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Market Condition</label>
              <select
                value={formData.marketCondition}
                onChange={(e) => setFormData({...formData, marketCondition: e.target.value})}
              >
                <option value="RANGING">Ranging</option>
                <option value="TRENDING">Trending</option>
                <option value="BREAKOUT">Breakout</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description & Notes</label>
            <textarea
              placeholder="Describe what makes this setup unique..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={() => handleSavePattern({}, {}, {}, {})}>
              Save Pattern
            </button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Patterns List */}
      <div className="patterns-list">
        <div className="patterns-header">
          <span>Total Saved: {patterns.length}</span>
          <button onClick={loadPatterns} className="btn-refresh">🔄 Refresh</button>
        </div>

        {patterns.length === 0 ? (
          <div className="empty-state">
            <p>No patterns saved yet. Mark a successful setup to create your first pattern!</p>
          </div>
        ) : (
          <div className="patterns-grid">
            {patterns.map(pattern => (
              <div key={pattern._id} className={`pattern-card ${pattern.direction.toLowerCase()}`}>
                <div className="card-header">
                  <div className="pattern-title">
                    <span className="direction-badge">{pattern.direction}</span>
                    <h3>{pattern.patternName}</h3>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleViewPattern(pattern)} className="btn-view">👁️</button>
                    <button onClick={() => handleDeletePattern(pattern._id)} className="btn-delete">🗑️</button>
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat">
                    <span className="label">Confidence</span>
                    <span className="value">{pattern.confidence}%</span>
                  </div>
                  <div className="stat">
                    <span className="label">Win Rate</span>
                    <span className="value">{pattern.performanceScore?.winRate?.toFixed(1)}%</span>
                  </div>
                  <div className="stat">
                    <span className="label">Matches</span>
                    <span className="value">{pattern.matchCount || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Saved</span>
                    <span className="value">{new Date(pattern.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="card-tags">
                  {pattern.tags?.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                {/* Pattern Details View */}
                {selectedPattern?._id === pattern._id && (
                  <div className="pattern-details">
                    <div className="details-section">
                      <h4>Pattern Description</h4>
                      <p>{pattern.description}</p>
                    </div>

                    <div className="details-section">
                      <h4>Market Context</h4>
                      <ul>
                        <li>Session: <strong>{pattern.sessionType}</strong></li>
                        <li>Volatility: <strong>{pattern.volatilityLevel}</strong></li>
                        <li>Market Condition: <strong>{pattern.marketCondition}</strong></li>
                        <li>Candles in Sequence: <strong>{pattern.candleSequence?.length || 0}</strong></li>
                      </ul>
                    </div>

                    <div className="details-section">
                      <h4>Performance</h4>
                      <div className="performance-chart">
                        <div className="perf-stat">
                          <span>Total Trades</span>
                          <span className="value">{pattern.performanceScore?.totalTrades || 0}</span>
                        </div>
                        <div className="perf-stat">
                          <span>Wins</span>
                          <span className="value success">{pattern.performanceScore?.winningTrades || 0}</span>
                        </div>
                        <div className="perf-stat">
                          <span>Losses</span>
                          <span className="value error">{pattern.performanceScore?.losingTrades || 0}</span>
                        </div>
                        <div className="perf-stat">
                          <span>Profit Factor</span>
                          <span className="value">{pattern.performanceScore?.profitFactor?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternManager;
