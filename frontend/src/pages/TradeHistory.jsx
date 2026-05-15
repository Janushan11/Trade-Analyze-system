import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TradeHistory.module.css';

export default function TradeHistory() {
  const [signals, setSignals] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await axios.get('/api/signals/latest?limit=50');
        setSignals(res.data);
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };

    fetchSignals();
  }, []);

  const filteredSignals = selectedSymbol 
    ? signals.filter(s => s.symbol === selectedSymbol)
    : signals;

  return (
    <div className={styles.container}>
      <h1>Trade History</h1>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Filter by symbol (e.g., BTCUSDT)"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
          className={styles.input}
        />
      </div>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Type</th>
              <th>Confidence</th>
              <th>Price</th>
              <th>Patterns</th>
              <th>Risk Level</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredSignals.map((signal, idx) => (
              <tr key={idx}>
                <td className={styles.symbol}>{signal.symbol}</td>
                <td>
                  <span className={`${styles.type} ${styles[signal.type?.toLowerCase()]}`}>
                    {signal.type}
                  </span>
                </td>
                <td>{signal.confidence}%</td>
                <td>${signal.entryPrice?.toFixed(2) || 'N/A'}</td>
                <td>
                  <div className={styles.patterns}>
                    {signal.patterns?.qm && <span className={styles.tag}>{signal.patterns.qm}</span>}
                    {signal.patterns?.bos && <span className={styles.tag}>BOS</span>}
                    {signal.patterns?.fvg && <span className={styles.tag}>FVG</span>}
                  </div>
                </td>
                <td>
                  <span className={`${styles.risk} ${styles[signal.riskLevel?.toLowerCase()]}`}>
                    {signal.riskLevel}
                  </span>
                </td>
                <td className={styles.time}>
                  {new Date(signal.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSignals.length === 0 && (
        <div className={styles.empty}>
          <p>No signals found</p>
        </div>
      )}
    </div>
  );
}
