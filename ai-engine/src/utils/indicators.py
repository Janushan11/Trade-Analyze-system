import numpy as np
import pandas as pd
from typing import List, Dict

class TechnicalIndicators:
    """Technical Indicators Calculation"""
    
    @staticmethod
    def calculate_ema(closes: np.ndarray, period: int = 20) -> np.ndarray:
        """Exponential Moving Average"""
        return pd.Series(closes).ewm(span=period, adjust=False).mean().values
    
    @staticmethod
    def calculate_rsi(closes: np.ndarray, period: int = 14) -> float:
        """Relative Strength Index"""
        deltas = np.diff(closes)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        rs = up / down if down != 0 else 0
        rsi = 100 - 100 / (1 + rs)
        return rsi
    
    @staticmethod
    def calculate_macd(closes: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict:
        """MACD (Moving Average Convergence Divergence)"""
        ema_fast = pd.Series(closes).ewm(span=fast, adjust=False).mean().values
        ema_slow = pd.Series(closes).ewm(span=slow, adjust=False).mean().values
        
        macd = ema_fast - ema_slow
        signal_line = pd.Series(macd).ewm(span=signal, adjust=False).mean().values
        histogram = macd - signal_line
        
        return {
            "macd": macd[-1],
            "signal": signal_line[-1],
            "histogram": histogram[-1]
        }
    
    @staticmethod
    def calculate_bollinger_bands(closes: np.ndarray, period: int = 20, std_dev: int = 2) -> Dict:
        """Bollinger Bands"""
        sma = pd.Series(closes).rolling(window=period).mean().values
        std = pd.Series(closes).rolling(window=period).std().values
        
        upper_band = sma[-1] + (std[-1] * std_dev)
        lower_band = sma[-1] - (std[-1] * std_dev)
        middle_band = sma[-1]
        
        return {
            "upper": upper_band,
            "middle": middle_band,
            "lower": lower_band
        }
    
    @staticmethod
    def calculate_atr(highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Average True Range"""
        tr = []
        for i in range(len(closes)):
            tr.append(max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]) if i > 0 else 0,
                abs(lows[i] - closes[i-1]) if i > 0 else 0
            ))
        
        atr = np.mean(tr[-period:])
        return atr
    
    @staticmethod
    def calculate_momentum(closes: np.ndarray, period: int = 10) -> float:
        """Price Momentum"""
        if len(closes) < period:
            return 0
        return closes[-1] - closes[-period]
    
    @staticmethod
    def calculate_stochastic(highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> Dict:
        """Stochastic Oscillator"""
        low_min = np.min(lows[-period:])
        high_max = np.max(highs[-period:])
        
        k_line = 100 * (closes[-1] - low_min) / (high_max - low_min) if (high_max - low_min) != 0 else 50
        
        return {
            "k": k_line,
            "position": "overbought" if k_line > 80 else "oversold" if k_line < 20 else "neutral"
        }
    
    @staticmethod
    def detect_volume_spike(volumes: np.ndarray, period: int = 20) -> bool:
        """Detect volume spike"""
        if len(volumes) < period:
            return False
        
        avg_volume = np.mean(volumes[-period:])
        current_volume = volumes[-1]
        
        return current_volume > avg_volume * 1.5
    
    @staticmethod
    def get_candle_structure(open_price: float, close_price: float, high: float, low: float) -> str:
        """Identify candle structure"""
        body = abs(close_price - open_price)
        upper_wick = high - max(open_price, close_price)
        lower_wick = min(open_price, close_price) - low
        total_range = high - low
        
        body_ratio = body / total_range if total_range != 0 else 0
        
        if body_ratio > 0.7:
            return "STRONG_BODY"
        elif upper_wick > body and upper_wick > lower_wick:
            return "UPPER_REJECTION"
        elif lower_wick > body and lower_wick > upper_wick:
            return "LOWER_REJECTION"
        elif upper_wick > 0 and lower_wick > 0 and body < 0.3 * total_range:
            return "DOJI"
        else:
            return "NORMAL"
