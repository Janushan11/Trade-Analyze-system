import numpy as np
import pandas as pd
from typing import List, Dict, Tuple

class QuasimodroAnalyzer:
    """Quasimodo (QM) Pattern Detection"""
    
    def __init__(self):
        pass
    
    def detect_qm_pattern(self, candles: List[Dict]) -> Tuple[str, float, Dict]:
        """
        Detect Quasimodo patterns
        QM = M or W pattern at higher level of detail
        Bullish QM: M pattern (up-down-up) that fails to reach previous high
        Bearish QM: W pattern (down-up-down) that fails to reach previous low
        """
        if len(candles) < 10:
            return "NONE", 0.0, {}
        
        df = pd.DataFrame(candles)
        closes = df['close'].values
        highs = df['high'].values
        lows = df['lows'].values
        
        # Simplified QM detection using swings
        bullish_qm, bullish_strength = self._detect_bullish_qm(closes, highs, lows)
        bearish_qm, bearish_strength = self._detect_bearish_qm(closes, highs, lows)
        
        if bullish_qm and bullish_strength > bearish_strength:
            return "BULLISH", bullish_strength, {
                "pattern": "M-shape",
                "potential": "REVERSAL_UP"
            }
        elif bearish_qm and bearish_strength > bullish_strength:
            return "BEARISH", bearish_strength, {
                "pattern": "W-shape",
                "potential": "REVERSAL_DOWN"
            }
        
        return "NONE", 0.0, {}
    
    def _detect_bullish_qm(self, closes, highs, lows) -> Tuple[bool, float]:
        """Detect bullish QM pattern (M-shape with failure at previous high)"""
        if len(closes) < 10:
            return False, 0.0
        
        # Look for: low -> high -> low(but higher than first low) -> potential high
        # where the potential high doesn't exceed the middle high
        
        # Find recent swing points
        recent_lows = []
        recent_highs = []
        
        for i in range(len(closes) - 10, len(closes)):
            if i > 0 and i < len(closes) - 1:
                if closes[i] < closes[i-1] and closes[i] < closes[i+1]:
                    recent_lows.append((i, closes[i]))
                elif closes[i] > closes[i-1] and closes[i] > closes[i+1]:
                    recent_highs.append((i, closes[i]))
        
        if len(recent_lows) >= 2 and len(recent_highs) >= 1:
            # Check M pattern
            low1 = min([l[1] for l in recent_lows[:len(recent_lows)//2]])
            high = max([h[1] for h in recent_highs])
            low2 = min([l[1] for l in recent_lows[len(recent_lows)//2:]])
            
            if low2 > low1 and closes[-1] < high:
                strength = ((low2 - low1) / low1) * 100
                return True, min(strength * 1.5, 100)
        
        return False, 0.0
    
    def _detect_bearish_qm(self, closes, highs, lows) -> Tuple[bool, float]:
        """Detect bearish QM pattern (W-shape with failure at previous low)"""
        if len(closes) < 10:
            return False, 0.0
        
        # Look for: high -> low -> high(but lower than first high) -> potential low
        # where the potential low doesn't go below the middle low
        
        recent_lows = []
        recent_highs = []
        
        for i in range(len(closes) - 10, len(closes)):
            if i > 0 and i < len(closes) - 1:
                if closes[i] < closes[i-1] and closes[i] < closes[i+1]:
                    recent_lows.append((i, closes[i]))
                elif closes[i] > closes[i-1] and closes[i] > closes[i+1]:
                    recent_highs.append((i, closes[i]))
        
        if len(recent_highs) >= 2 and len(recent_lows) >= 1:
            # Check W pattern
            high1 = max([h[1] for h in recent_highs[:len(recent_highs)//2]])
            low = min([l[1] for l in recent_lows])
            high2 = max([h[1] for h in recent_highs[len(recent_highs)//2:]])
            
            if high2 < high1 and closes[-1] > low:
                strength = ((high1 - high2) / high1) * 100
                return True, min(strength * 1.5, 100)
        
        return False, 0.0
    
    def get_entry_zone(self, qm_type: str, candles: List[Dict]) -> Dict:
        """Get optimal entry zone based on QM type"""
        if not candles:
            return {}
        
        df = pd.DataFrame(candles)
        closes = df['close'].values
        highs = df['high'].values
        lows = df['lows'].values
        
        current_price = closes[-1]
        
        if qm_type == "BULLISH":
            support = np.min(lows[-10:])
            return {
                "entry_min": support,
                "entry_max": current_price,
                "entry_ideal": support + (current_price - support) * 0.3,
                "type": "LONG"
            }
        elif qm_type == "BEARISH":
            resistance = np.max(highs[-10:])
            return {
                "entry_min": current_price,
                "entry_max": resistance,
                "entry_ideal": resistance - (resistance - current_price) * 0.3,
                "type": "SHORT"
            }
        
        return {}
    
    def get_stop_loss(self, qm_type: str, candles: List[Dict]) -> float:
        """Get stop loss level based on QM pattern"""
        if not candles:
            return 0
        
        df = pd.DataFrame(candles)
        lows = df['lows'].values
        highs = df['high'].values
        
        if qm_type == "BULLISH":
            return np.min(lows[-10:]) * 0.99  # 1% below support
        elif qm_type == "BEARISH":
            return np.max(highs[-10:]) * 1.01  # 1% above resistance
        
        return 0
    
    def get_take_profit(self, qm_type: str, candles: List[Dict]) -> float:
        """Get take profit level based on QM pattern"""
        if not candles:
            return 0
        
        df = pd.DataFrame(candles)
        closes = df['close'].values
        highs = df['high'].values
        lows = df['lows'].values
        
        current_price = closes[-1]
        atr = np.mean([highs[i] - lows[i] for i in range(-10, 0)]) if len(highs) > 10 else 0
        
        if qm_type == "BULLISH":
            return current_price + atr * 2
        elif qm_type == "BEARISH":
            return current_price - atr * 2
        
        return current_price
