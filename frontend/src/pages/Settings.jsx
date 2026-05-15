import React, { useState } from 'react';
import styles from './Settings.module.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    symbols: ['BTCUSDT', 'ETHUSDT', 'EURUSDT'],
    notificationsEnabled: true,
    soundAlerts: false,
    confidenceThreshold: 70,
    riskLevel: 'MEDIUM'
  });

  const handleSymbolToggle = (symbol) => {
    setSettings(prev => ({
      ...prev,
      symbols: prev.symbols.includes(symbol)
        ? prev.symbols.filter(s => s !== symbol)
        : [...prev.symbols, symbol]
    }));
  };

  const handleSave = () => {
    localStorage.setItem('tradeAnalyzeSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <div className={styles.container}>
      <h1>Settings</h1>

      <div className={styles.section}>
        <h2>Trading Symbols</h2>
        <div className={styles.symbolGrid}>
          {['BTCUSDT', 'ETHUSDT', 'EURUSDT', 'BNBUSDT', 'ADAUSDT'].map(symbol => (
            <label key={symbol} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.symbols.includes(symbol)}
                onChange={() => handleSymbolToggle(symbol)}
              />
              <span>{symbol}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Notifications</h2>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
          />
          <span>Enable notifications</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={settings.soundAlerts}
            onChange={(e) => setSettings({...settings, soundAlerts: e.target.checked})}
          />
          <span>Sound alerts</span>
        </label>
      </div>

      <div className={styles.section}>
        <h2>Analysis Settings</h2>
        <div className={styles.setting}>
          <label>Confidence Threshold (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.confidenceThreshold}
            onChange={(e) => setSettings({...settings, confidenceThreshold: parseInt(e.target.value)})}
            className={styles.slider}
          />
          <span>{settings.confidenceThreshold}%</span>
        </div>

        <div className={styles.setting}>
          <label>Risk Level</label>
          <select 
            value={settings.riskLevel}
            onChange={(e) => setSettings({...settings, riskLevel: e.target.value})}
          >
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <button onClick={handleSave} className={styles.saveBtn}>
          Save Settings
        </button>
      </div>

      <div className={styles.info}>
        <h3>About</h3>
        <p>Trade Analyze v1.0.0</p>
        <p>AI-powered live trading analysis platform</p>
        <p className={styles.disclaimer}>
          ⚠️ For educational and analysis purposes only. Not investment advice.
        </p>
      </div>
    </div>
  );
}
