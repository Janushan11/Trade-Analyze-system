import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveAnalysis from './pages/LiveAnalysis';
import Analytics from './pages/Analytics';
import TradeHistory from './pages/TradeHistory';
import Settings from './pages/Settings';
import styles from './App.module.css';

function App() {
  const [activeNav, setActiveNav] = useState('dashboard');

  return (
    <Router>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <h1>Trade Analyze</h1>
            <p>AI Trading Platform</p>
          </div>
          
          <nav className={styles.nav}>
            <Link 
              to="/" 
              className={`${styles.navItem} ${activeNav === 'dashboard' ? styles.active : ''}`}
              onClick={() => setActiveNav('dashboard')}
            >
              📊 Dashboard
            </Link>
            <Link 
              to="/live" 
              className={`${styles.navItem} ${activeNav === 'live' ? styles.active : ''}`}
              onClick={() => setActiveNav('live')}
            >
              📈 Live Analysis
            </Link>
            <Link 
              to="/analytics" 
              className={`${styles.navItem} ${activeNav === 'analytics' ? styles.active : ''}`}
              onClick={() => setActiveNav('analytics')}
            >
              📉 Analytics
            </Link>
            <Link 
              to="/history" 
              className={`${styles.navItem} ${activeNav === 'history' ? styles.active : ''}`}
              onClick={() => setActiveNav('history')}
            >
              📋 Trade History
            </Link>
            <Link 
              to="/settings" 
              className={`${styles.navItem} ${activeNav === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveNav('settings')}
            >
              ⚙️ Settings
            </Link>
          </nav>

          <div className={styles.disclaimer}>
            <p>⚠️ Educational/Analysis Only</p>
            <p>Not investment advice. Risk disclosure applies.</p>
          </div>
        </aside>

        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveAnalysis />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<TradeHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
