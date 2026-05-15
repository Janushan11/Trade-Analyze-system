import React, { useState, useEffect } from 'react';
import './LivePatternMatcher.module.css';

/**
 * Live Pattern Matcher Component
 * Displays real-time pattern matching results and alerts
 */
const LivePatternMatcher = ({ symbol, liveData, socket }) => {
  const [matches, setMatches] = useState([]);
  const [topMatch, setTopMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  // Listen for pattern match events from backend
  useEffect(() => {
    if (!socket) return;

    socket.on('pattern-match', (data) => {
      if (data.symbol === symbol) {
        setMatches(data.matches || []);
        setTopMatch(data.top_match);
        setLastCheckTime(new Date());

        // Add to alert history if HIGH confidence
        if (data.alert_triggered) {
          addAlert({
            timestamp: new Date(),
            pattern: data.top_match?.pattern_name,
            similarity: data.top_match?.similarity,
            direction: data.top_match?.direction,
            confidence: data.top_match?.alert_level
          });
        }
      }
    });

    return () => {
      socket.off('pattern-match');
    };
  }, [socket, symbol]);

  const addAlert = (alert) => {
    setAlertHistory([alert, ...alertHistory.slice(0, 9)]); // Keep last 10
    
    // Show visual and audio notification
    showNotification(alert);
  };

  const showNotification = (alert) => {
    // Visual notification
    const notification = document.createElement('div');
    notification.className = `pattern-notification ${alert.confidence.toLowerCase()}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="alert-level">🔔 ${alert.confidence} ALERT</span>
          <span class="close" onclick="this.parentElement.parentElement.remove()">✕</span>
        </div>
        <div class="notification-body">
          <p><strong>${alert.pattern}</strong></p>
          <p>Similarity: <strong>${alert.similarity.toFixed(1)}%</strong></p>
          <p>Direction: <strong>${alert.direction}</strong></p>
          <p>${new Date(alert.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);

    // Audio notification
    playAlertSound(alert.confidence);
  };

  const playAlertSound = (level) => {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequency = level === 'HIGH' ? 800 : level === 'MEDIUM' ? 600 : 400;
    const duration = level === 'HIGH' ? 0.5 : 0.3;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  return (
    <div className="live-pattern-matcher">
      <div className="matcher-header">
        <h2>🎯 Live Pattern Matching</h2>
        <div className="status-indicator">
          <span className={`status ${matches.length > 0 ? 'active' : 'idle'}`}></span>
          <span>{matches.length > 0 ? 'Patterns Detected' : 'Monitoring...'}</span>
        </div>
      </div>

      {/* Top Match - Big Alert */}
      {topMatch && (
        <div className={`top-match-card ${topMatch.alert_level.toLowerCase()}`}>
          <div className="match-alert-header">
            <span className="alert-badge">🚨 {topMatch.alert_level} CONFIDENCE</span>
            <span className="similarity-score">{topMatch.similarity.toFixed(1)}% Match</span>
          </div>

          <div className="match-content">
            <div className="match-left">
              <h3>{topMatch.pattern_name}</h3>
              <p className="match-description">
                Your stored "{topMatch.pattern_name}" pattern is occurring again!
              </p>

              <div className="match-direction">
                <span className={`direction-indicator ${topMatch.direction.toLowerCase()}`}>
                  {topMatch.direction === 'BUY' ? '📈 BUY' : '📉 SELL'}
                </span>
                <span className="confidence-pct">{topMatch.confidence}% confidence</span>
              </div>
            </div>

            <div className="match-right">
              <div className="component-breakdown">
                <h4>Pattern Components</h4>
                <div className="components">
                  <Component 
                    name="Candle Structure"
                    score={topMatch.component_scores?.candle_sequence}
                    matched={topMatch.matches?.candle_sequence}
                  />
                  <Component 
                    name="Trend Alignment"
                    score={topMatch.component_scores?.trend_alignment}
                    matched={topMatch.matches?.trend_aligned}
                  />
                  <Component 
                    name="Market Structure"
                    score={topMatch.component_scores?.structure_match}
                    matched={topMatch.matches?.structure_similar}
                  />
                  <Component 
                    name="Liquidity Context"
                    score={topMatch.component_scores?.liquidity_match}
                    matched={topMatch.matches?.liquidity_context}
                  />
                  <Component 
                    name="Indicators"
                    score={topMatch.component_scores?.indicator_match}
                    matched={topMatch.matches?.indicators_aligned}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="match-actions">
            <button className="btn-take-trade">Take Trade ✓</button>
            <button className="btn-wait">Wait for More Confirmation</button>
            <button className="btn-dismiss">Dismiss</button>
          </div>
        </div>
      )}

      {/* All Matches List */}
      <div className="matches-section">
        <h3>📋 All Pattern Matches ({matches.length})</h3>
        
        {matches.length === 0 ? (
          <div className="empty-state">
            <p>No pattern matches found. System is monitoring for your saved patterns...</p>
          </div>
        ) : (
          <div className="matches-list">
            {matches.map((match, idx) => (
              <MatchCard key={idx} match={match} />
            ))}
          </div>
        )}
      </div>

      {/* Alert History */}
      <div className="alert-history">
        <h3>⏱️ Recent Alerts</h3>
        {alertHistory.length === 0 ? (
          <p className="no-history">No alerts yet</p>
        ) : (
          <div className="history-list">
            {alertHistory.map((alert, idx) => (
              <div key={idx} className={`history-item ${alert.confidence.toLowerCase()}`}>
                <span className="time">{alert.timestamp.toLocaleTimeString()}</span>
                <span className="pattern">{alert.pattern}</span>
                <span className="similarity">{alert.similarity.toFixed(1)}%</span>
                <span className={`direction ${alert.direction.toLowerCase()}`}>
                  {alert.direction}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Component Breakdown Card
 */
const Component = ({ name, score, matched }) => (
  <div className={`component-item ${matched ? 'matched' : 'unmatched'}`}>
    <div className="component-name">{name}</div>
    <div className="component-score">
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score || 0}%` }}></div>
      </div>
      <span className="score-text">{score?.toFixed(0)}%</span>
    </div>
    {matched && <span className="check-mark">✓</span>}
  </div>
);

/**
 * Individual Match Card
 */
const MatchCard = ({ match }) => (
  <div className={`match-card ${match.alert_level.toLowerCase()}`}>
    <div className="match-header">
      <h4>{match.pattern_name}</h4>
      <div className="match-stats">
        <span className="similarity">{match.similarity.toFixed(1)}%</span>
        <span className={`level ${match.alert_level.toLowerCase()}`}>
          {match.alert_level}
        </span>
      </div>
    </div>

    <div className="match-mini-bars">
      <div className="mini-bar" title="Candle Sequence">
        <div style={{ width: `${match.component_scores.candle_sequence}%` }}></div>
      </div>
      <div className="mini-bar" title="Trend">
        <div style={{ width: `${match.component_scores.trend_alignment}%` }}></div>
      </div>
      <div className="mini-bar" title="Structure">
        <div style={{ width: `${match.component_scores.structure_match}%` }}></div>
      </div>
      <div className="mini-bar" title="Liquidity">
        <div style={{ width: `${match.component_scores.liquidity_match}%` }}></div>
      </div>
      <div className="mini-bar" title="Indicators">
        <div style={{ width: `${match.component_scores.indicator_match}%` }}></div>
      </div>
    </div>
  </div>
);

export default LivePatternMatcher;
