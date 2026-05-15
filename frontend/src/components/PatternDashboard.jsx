/**
 * Pattern Dashboard Component
 * Main component integrating pattern marking, management, and live matching
 */

import React, { useState, useEffect, useRef } from 'react';
import PatternMarker from './PatternMarker';
import PatternManager from './PatternManager';
import LivePatternMatcher from './LivePatternMatcher';
import PatternSocketService from '../services/patternSocketService';
import './PatternDashboard.module.css';

const PatternDashboard = ({ symbol, chartRef, candleData, indicators, socket }) => {
  const [activeTab, setActiveTab] = useState('marking'); // marking, library, matching
  const [patternSocketService, setPatternSocketService] = useState(null);
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [stats, setStats] = useState({
    totalPatterns: 0,
    totalMatches: 0,
    lastMatchTime: null,
    winRate: 0
  });

  /**
   * Initialize pattern socket service on component mount
   */
  useEffect(() => {
    const initializePatternSocket = async () => {
      try {
        const service = new PatternSocketService();
        await service.connect();
        
        service.on('pattern-match', handlePatternMatch);
        service.on('pattern-check-results', handleCheckResults);
        service.on('error', handleSocketError);

        setPatternSocketService(service);
        setConnectionStatus('connected');

        // Subscribe to current symbol
        service.subscribeToSymbol(symbol);

        return () => {
          service.unsubscribeFromSymbol(symbol);
          service.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize pattern socket:', error);
        setConnectionStatus('error');
      }
    };

    const cleanup = initializePatternSocket();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [symbol]);

  /**
   * Handle pattern match event from WebSocket
   */
  const handlePatternMatch = (data) => {
    if (data.alert_triggered) {
      setLiveMatches(prev => {
        const updated = [data.top_match, ...prev.slice(0, 9)];
        return updated;
      });

      // Play alert sound and show notification
      playAlertSound();
    }
  };

  /**
   * Handle pattern check results
   */
  const handleCheckResults = (data) => {
    if (data.topMatch) {
      setStats(prev => ({
        ...prev,
        lastMatchTime: new Date(),
        totalMatches: prev.totalMatches + 1
      }));
    }
  };

  /**
   * Handle socket errors
   */
  const handleSocketError = (error) => {
    console.error('Socket error:', error);
    setConnectionStatus('error');
  };

  /**
   * Play alert sound
   */
  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const frequency = 800;
      const duration = 0.5;

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
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  /**
   * Handle pattern save
   */
  const handlePatternSaved = (pattern) => {
    setSavedPatterns(prev => [...prev, pattern]);
    setStats(prev => ({
      ...prev,
      totalPatterns: prev.totalPatterns + 1
    }));

    // Switch to library tab
    setActiveTab('library');

    // Subscribe to pattern updates
    if (patternSocketService) {
      patternSocketService.subscribeToSymbol(symbol);
    }
  };

  /**
   * Request manual pattern check
   */
  const handleManualCheck = () => {
    if (patternSocketService && candleData.length > 0) {
      patternSocketService.checkPatterns(symbol, candleData.slice(-50));
      setActiveTab('matching');
    }
  };

  return (
    <div className="pattern-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>🎯 Pattern Memory System</h1>
        
        <div className="header-info">
          <div className="connection-status">
            <span className={`status-dot ${connectionStatus}`}></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? '✓ Connected' : connectionStatus === 'error' ? '✗ Error' : '○ Connecting...'}
            </span>
          </div>

          <div className="dashboard-stats">
            <div className="stat-item">
              <span className="stat-label">Patterns</span>
              <span className="stat-value">{stats.totalPatterns}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Matches</span>
              <span className="stat-value">{stats.totalMatches}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Match</span>
              <span className="stat-value">
                {stats.lastMatchTime ? stats.lastMatchTime.toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>

          <button className="btn-check-now" onClick={handleManualCheck}>
            🔍 Check Now
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'marking' ? 'active' : ''}`}
          onClick={() => setActiveTab('marking')}
        >
          📍 Mark Pattern
        </button>
        <button 
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 Library ({stats.totalPatterns})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'matching' ? 'active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          🎯 Live Matching ({liveMatches.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Pattern Marking Tab */}
        {activeTab === 'marking' && (
          <div className="tab-pane">
            <PatternMarker
              chartRef={chartRef}
              candleData={candleData}
              indicators={indicators}
              onPatternMarked={handlePatternSaved}
            />
            <div className="marking-instructions">
              <h3>📖 How to Mark Patterns</h3>
              <ol>
                <li>Click <strong>"Mark New Pattern"</strong> to start marking</li>
                <li>Click on your <strong>entry point</strong> on the chart</li>
                <li>Click on your <strong>exit point</strong> on the chart</li>
                <li>Fill in the <strong>pattern details</strong> (name, session, etc.)</li>
                <li>Click <strong>"Save Pattern"</strong> to add to your library</li>
              </ol>
              <p className="instruction-note">
                💡 The system will automatically capture 20-50 surrounding candles to preserve market context.
              </p>
            </div>
          </div>
        )}

        {/* Pattern Library Tab */}
        {activeTab === 'library' && (
          <div className="tab-pane">
            <PatternManager
              symbol={symbol}
              onPatternSaved={handlePatternSaved}
            />
          </div>
        )}

        {/* Live Pattern Matching Tab */}
        {activeTab === 'matching' && (
          <div className="tab-pane">
            <LivePatternMatcher
              symbol={symbol}
              liveData={candleData}
              socket={patternSocketService}
            />
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="dashboard-footer">
        <div className="footer-stat">
          <span>Symbol:</span> <strong>{symbol}</strong>
        </div>
        <div className="footer-stat">
          <span>Current Price:</span> <strong>{candleData[candleData.length - 1]?.close.toFixed(8) || 'N/A'}</strong>
        </div>
        <div className="footer-stat">
          <span>Candles Loaded:</span> <strong>{candleData.length}</strong>
        </div>
        <div className="footer-stat">
          <span>Active Subscriptions:</span> <strong>{patternSocketService?.getSubscribedSymbols().join(', ') || 'None'}</strong>
        </div>
      </div>
    </div>
  );
};

export default PatternDashboard;
