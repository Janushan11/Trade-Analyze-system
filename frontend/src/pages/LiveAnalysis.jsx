import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import io from 'socket.io-client';
import styles from './LiveAnalysis.module.css';

export default function LiveAnalysis() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [currentCandle, setCurrentCandle] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize chart
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: '#0a0e27' },
          textColor: '#e0e0e0'
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: true
        }
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ff41',
        downColor: '#ff3333',
        borderUpColor: '#00ff41',
        borderDownColor: '#ff3333',
        wickUpColor: '#00ff41',
        wickDownColor: '#ff3333'
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: 400
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe', { symbol, timeframe: '1m' });
    });

    socket.on('candle-update', (candle) => {
      if (candle.symbol === symbol && candleSeriesRef.current) {
        const time = Math.floor(candle.timestamp.getTime() / 1000);
        const candleData = {
          time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        };

        candleSeriesRef.current.update(candleData);
        setCurrentCandle(candle);
      }
    });

    socket.on('analysis-result', (result) => {
      if (result.symbol === symbol) {
        setAnalysis(result);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.emit('unsubscribe', { symbol });
      socket.disconnect();
    };
  }, [symbol]);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  return (
    <div className={styles.container}>
      <h1>Live Analysis - {symbol}</h1>
      
      <div className={styles.controls}>
        <select value={symbol} onChange={handleSymbolChange} className={styles.select}>
          <option>BTCUSDT</option>
          <option>ETHUSDT</option>
          <option>EURUSDT</option>
          <option>BNBUSDT</option>
          <option>ADAUSDT</option>
        </select>
        
        <div className={`${styles.status} ${connected ? styles.connected : styles.disconnected}`}>
          {connected ? '● Connected' : '● Disconnected'}
        </div>
      </div>

      <div className={styles.chartContainer} ref={chartContainerRef}></div>

      <div className={styles.analysisPanel}>
        <div className={styles.panelSection}>
          <h3>Current Candle</h3>
          {currentCandle ? (
            <div className={styles.candleData}>
              <div className={styles.dataRow}>
                <span>Open:</span>
                <strong>${currentCandle.open?.toFixed(2)}</strong>
              </div>
              <div className={styles.dataRow}>
                <span>High:</span>
                <strong>${currentCandle.high?.toFixed(2)}</strong>
              </div>
              <div className={styles.dataRow}>
                <span>Low:</span>
                <strong>${currentCandle.low?.toFixed(2)}</strong>
              </div>
              <div className={styles.dataRow}>
                <span>Close:</span>
                <strong>${currentCandle.close?.toFixed(2)}</strong>
              </div>
              <div className={styles.dataRow}>
                <span>Volume:</span>
                <strong>{currentCandle.volume?.toFixed(2)}</strong>
              </div>
            </div>
          ) : (
            <p className={styles.placeholder}>Waiting for data...</p>
          )}
        </div>

        <div className={styles.panelSection}>
          <h3>AI Analysis</h3>
          {analysis ? (
            <div className={styles.analysisData}>
              <div className={styles.probability}>
                <div className={styles.probItem}>
                  <span>UP Probability</span>
                  <div className={styles.probBar}>
                    <div 
                      className={`${styles.probFill} ${styles.up}`}
                      style={{ width: `${analysis.upProbability || 0}%` }}
                    ></div>
                  </div>
                  <strong>{analysis.upProbability || 0}%</strong>
                </div>
                <div className={styles.probItem}>
                  <span>DOWN Probability</span>
                  <div className={styles.probBar}>
                    <div 
                      className={`${styles.probFill} ${styles.down}`}
                      style={{ width: `${analysis.downProbability || 0}%` }}
                    ></div>
                  </div>
                  <strong>{analysis.downProbability || 0}%</strong>
                </div>
              </div>

              <div className={styles.dataRow}>
                <span>Trend:</span>
                <strong className={analysis.trend === 'UP' ? styles.up : styles.down}>
                  {analysis.trend}
                </strong>
              </div>
              <div className={styles.dataRow}>
                <span>Confidence:</span>
                <strong>{analysis.confidence?.toFixed(1)}%</strong>
              </div>
            </div>
          ) : (
            <p className={styles.placeholder}>Analyzing...</p>
          )}
        </div>
      </div>

      <div className={styles.disclaimer}>
        <p>⚠️ This analysis is for educational purposes only. Not investment advice.</p>
      </div>
    </div>
  );
}
