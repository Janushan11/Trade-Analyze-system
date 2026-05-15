import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [overview, setOverview] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, statsRes] = await Promise.all([
          axios.get('/api/analytics/overview'),
          axios.get('/api/analytics/dashboard')
        ]);
        
        setOverview(overviewRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        {stats && (
          <>
            <div className={styles.statCard}>
              <h3>Total Predictions</h3>
              <p className={styles.value}>{stats.totalPredictions}</p>
              <span className={styles.label}>All time</span>
            </div>
            <div className={styles.statCard}>
              <h3>Accuracy</h3>
              <p className={`${styles.value} ${styles.success}`}>{stats.accuracy}</p>
              <span className={styles.label}>{stats.correctPredictions} correct</span>
            </div>
            <div className={styles.statCard}>
              <h3>Avg Confidence</h3>
              <p className={styles.value}>{stats.averageConfidence}%</p>
              <span className={styles.label}>Confidence score</span>
            </div>
            <div className={styles.statCard}>
              <h3>Period</h3>
              <p className={styles.value}>7D</p>
              <span className={styles.label}>{stats.timeframe}</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.section}>
        <h2>Market Overview</h2>
        <div className={styles.marketGrid}>
          {overview.map((market) => (
            <div key={market.symbol} className={styles.marketCard}>
              <div className={styles.cardHeader}>
                <h3>{market.symbol}</h3>
                <span className={`${styles.signal} ${styles[market.signal.toLowerCase()]}`}>
                  {market.signal}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.price}>${market.price?.toFixed(2)}</div>
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span>Confidence</span>
                    <strong>{market.confidence}%</strong>
                  </div>
                  <div className={styles.metric}>
                    <span>Up Probability</span>
                    <strong>{market.prediction}%</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Recent Signals</h2>
        <div className={styles.info}>
          <p>💡 Real-time signals will appear here when connected to live data</p>
        </div>
      </div>
    </div>
  );
}
