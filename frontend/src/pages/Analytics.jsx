import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Analytics.module.css';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, predRes] = await Promise.all([
          axios.get(`/api/predictions/${selectedSymbol}/stats`),
          axios.get(`/api/predictions/${selectedSymbol}/history?days=7`)
        ]);
        
        setStats(statsRes.data);
        setPredictions(predRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchData();
  }, [selectedSymbol]);

  return (
    <div className={styles.container}>
      <h1>Analytics & Performance</h1>

      <div className={styles.controls}>
        <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
          <option>BTCUSDT</option>
          <option>ETHUSDT</option>
          <option>EURUSDT</option>
        </select>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.card}>
            <h3>Total Predictions</h3>
            <p className={styles.value}>{stats.total}</p>
          </div>
          <div className={styles.card}>
            <h3>Correct Predictions</h3>
            <p className={`${styles.value} ${styles.success}`}>{stats.correct}</p>
          </div>
          <div className={styles.card}>
            <h3>Incorrect Predictions</h3>
            <p className={`${styles.value} ${styles.error}`}>{stats.incorrect}</p>
          </div>
          <div className={styles.card}>
            <h3>Win Rate</h3>
            <p className={`${styles.value} ${styles.success}`}>{stats.accuracy}</p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2>Recent Predictions ({selectedSymbol})</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>UP%</th>
                <th>DOWN%</th>
                <th>Confidence</th>
                <th>Trend</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred, idx) => (
                <tr key={idx}>
                  <td>{new Date(pred.timestamp).toLocaleString()}</td>
                  <td className={styles.up}>{pred.upProbability}%</td>
                  <td className={styles.down}>{pred.downProbability}%</td>
                  <td>{pred.confidence?.toFixed(1)}%</td>
                  <td className={pred.trend === 'UP' ? styles.up : styles.down}>
                    {pred.trend}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[pred.result?.toLowerCase() || 'pending']}`}>
                      {pred.result || 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
