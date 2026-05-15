import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

class SMCAnalyzer:
    """Smart Money Concepts Pattern Detection"""
    
    def __init__(self, lookback: int = 50):
        self.lookback = lookback
    
    def detect_bos(self, candles: List[Dict]) -> Tuple[bool, float]:
        """Break of Structure - detect when price breaks previous swing high/low"""
        if len(candles) < 3:
            return False, 0.0
        
        df = pd.DataFrame(candles)
        closes = df['close'].values
        highs = df['high'].values
        lows = df['low'].values
        
        # Find recent swing high and low
        swing_high = np.max(highs[-self.lookback:])
        swing_low = np.min(lows[-self.lookback:])
        
        current_close = closes[-1]
        bos_strength = 0.0
        
        # BOS up: close breaks above swing high
        if current_close > swing_high:
            bos_strength = ((current_close - swing_high) / swing_high) * 100
            return True, min(bos_strength * 2, 100.0)
        
        # BOS down: close breaks below swing low
        elif current_close < swing_low:
            bos_strength = ((swing_low - current_close) / swing_low) * 100
            return True, min(bos_strength * 2, 100.0)
        
        return False, 0.0
    
    def detect_choch(self, candles: List[Dict]) -> Tuple[bool, str]:
        """Change of Character - detect shift in market structure"""
        if len(candles) < 10:
            return False, "NONE"
        
        df = pd.DataFrame(candles)
        closes = df['close'].values
        
        # Recent trend
        recent_trend = closes[-1] - closes[-5]
        
        # Check for character change
        if len(closes) > 10:
            earlier_trend = closes[-5] - closes[-10]
            
            # If signs are different, character has changed
            if (recent_trend > 0 and earlier_trend < 0):
                return True, "BULLISH"
            elif (recent_trend < 0 and earlier_trend > 0):
                return True, "BEARISH"
        
        return False, "NONE"
    
    def detect_liquidity_sweep(self, candles: List[Dict]) -> bool:
        """Liquidity Sweep - when price takes out stops/orders before reversing"""
        if len(candles) < 3:
            return False
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        
        # Look for wick that goes beyond previous extremes then closes back
        current_high = highs[-1]
        current_low = lows[-1]
        current_close = closes[-1]
        
        prev_high = np.max(highs[-5:-1])
        prev_low = np.min(lows[-5:-1])
        
        # Liquidity sweep: new extreme created then closed back inside
        if current_high > prev_high and current_close < prev_high:
            return True
        if current_low < prev_low and current_close > prev_low:
            return True
        
        return False
    
    def detect_order_block(self, candles: List[Dict]) -> Tuple[bool, Dict]:
        """Order Block - Strong rejection candle that can act as support/resistance"""
        if len(candles) < 3:
            return False, {}
        
        df = pd.DataFrame(candles)
        opens = df['open'].values
        closes = df['close'].values
        highs = df['high'].values
        lows = df['lows'].values
        volumes = df['volume'].values
        
        latest = len(df) - 1
        
        # Strong rejection candles have large bodies and small wicks
        body_size = abs(closes[latest] - opens[latest])
        total_range = highs[latest] - lows[latest]
        
        if total_range == 0:
            return False, {}
        
        body_ratio = body_size / total_range
        volume_spike = volumes[latest] / np.mean(volumes[-5:]) if len(volumes) > 5 else 1
        
        # Order block criteria: large body (>70% of range), volume spike
        if body_ratio > 0.7 and volume_spike > 1.5:
            ob_level = closes[latest]
            ob_type = "BULLISH" if closes[latest] > opens[latest] else "BEARISH"
            
            return True, {
                "level": ob_level,
                "type": ob_type,
                "strength": min((body_ratio * volume_spike) * 50, 100)
            }
        
        return False, {}
    
    def detect_fvg(self, candles: List[Dict]) -> Tuple[bool, Dict]:
        """Fair Value Gap - gap in price action that often gets filled"""
        if len(candles) < 3:
            return False, {}
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['lows'].values
        
        # FVG: gap between candles
        if highs[-3] < lows[-1]:  # Bullish FVG
            gap_size = lows[-1] - highs[-3]
            return True, {
                "type": "BULLISH",
                "top": lows[-1],
                "bottom": highs[-3],
                "size": gap_size
            }
        elif highs[-1] < lows[-3]:  # Bearish FVG
            gap_size = lows[-3] - highs[-1]
            return True, {
                "type": "BEARISH",
                "bottom": highs[-1],
                "top": lows[-3],
                "size": gap_size
            }
        
        return False, {}
    
    def detect_support_resistance(self, candles: List[Dict]) -> Tuple[float, float]:
        """Detect support and resistance zones"""
        if len(candles) < 10:
            return 0, 0
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['lows'].values
        
        resistance = np.max(highs[-self.lookback:])
        support = np.min(lows[-self.lookback:])
        
        return support, resistance
