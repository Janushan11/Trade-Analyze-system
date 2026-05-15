import numpy as np
import pandas as pd
from typing import List, Dict, Tuple

class LiquidityEngine:
    """
    Liquidity Pattern Detection Engine
    Detects: Wick Sweeps, Stop Hunts, Fake Breakouts
    """
    
    def __init__(self, lookback: int = 50):
        self.lookback = lookback
    
    def detect_wick_sweep(self, candles: List[Dict]) -> Dict:
        """
        Wick Sweep Detection
        - Price goes beyond previous level with a wick
        - Quickly reverses back (suggesting stops were hit)
        """
        if len(candles) < 5:
            return {"detected": False, "type": "NONE", "strength": 0.0, "reason": "Insufficient data"}
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        opens = df['open'].values
        
        current_candle = len(candles) - 1
        
        # Get recent swing levels
        prev_highs = np.max(highs[-10:-1])
        prev_lows = np.min(lows[-10:-1])
        
        # Current candle wick
        current_high_wick = highs[-1]
        current_low_wick = lows[-1]
        current_close = closes[-1]
        
        # Upper wick sweep: High extends above previous high, closes below it
        if current_high_wick > prev_highs and current_close < prev_highs:
            wick_size = current_high_wick - prev_highs
            reversal_strength = (prev_highs - current_close) / wick_size * 100 if wick_size > 0 else 0
            
            if reversal_strength > 30:  # Strong reversal
                return {
                    "detected": True,
                    "type": "UPPER_WICK_SWEEP",
                    "strength": min(reversal_strength, 100.0),
                    "level": prev_highs,
                    "wick_size": wick_size,
                    "reason": f"Upper wick sweep at {prev_highs:.8f}, closed {current_close:.8f}"
                }
        
        # Lower wick sweep: Low extends below previous low, closes above it
        if current_low_wick < prev_lows and current_close > prev_lows:
            wick_size = prev_lows - current_low_wick
            reversal_strength = (current_close - prev_lows) / wick_size * 100 if wick_size > 0 else 0
            
            if reversal_strength > 30:  # Strong reversal
                return {
                    "detected": True,
                    "type": "LOWER_WICK_SWEEP",
                    "strength": min(reversal_strength, 100.0),
                    "level": prev_lows,
                    "wick_size": wick_size,
                    "reason": f"Lower wick sweep at {prev_lows:.8f}, closed {current_close:.8f}"
                }
        
        return {"detected": False, "type": "NONE", "strength": 0.0, "reason": "No wick sweep detected"}
    
    def detect_stop_hunt(self, candles: List[Dict]) -> Dict:
        """
        Stop Hunt Detection
        - Price spikes to extreme level
        - Volume spike
        - Reverses sharply
        """
        if len(candles) < 8:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        volumes = df['volume'].values
        
        # Average volume
        avg_volume = np.mean(volumes[-10:-1])
        current_volume = volumes[-1]
        
        # Check for volume spike (indicator of stop hunt)
        volume_spike = current_volume > avg_volume * 1.5
        
        if not volume_spike:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        # Check for extreme price movement
        prev_range = np.max(highs[-5:-1]) - np.min(lows[-5:-1])
        
        # Upper stop hunt: High spike + volume + reversal down
        if highs[-1] > np.max(highs[-5:-1]) + prev_range * 0.3:
            if closes[-1] < highs[-1] * 0.98:  # Closed well below the spike
                reversal_pct = (highs[-1] - closes[-1]) / highs[-1] * 100
                return {
                    "detected": True,
                    "type": "UPPER_STOP_HUNT",
                    "strength": min(reversal_pct * 2, 100.0),
                    "volume_ratio": current_volume / avg_volume,
                    "reason": f"Stop hunt detected at {highs[-1]:.8f} with {current_volume/avg_volume:.1f}x volume"
                }
        
        # Lower stop hunt: Low spike + volume + reversal up
        if lows[-1] < np.min(lows[-5:-1]) - prev_range * 0.3:
            if closes[-1] > lows[-1] * 1.02:  # Closed well above the spike
                reversal_pct = (closes[-1] - lows[-1]) / lows[-1] * 100
                return {
                    "detected": True,
                    "type": "LOWER_STOP_HUNT",
                    "strength": min(reversal_pct * 2, 100.0),
                    "volume_ratio": current_volume / avg_volume,
                    "reason": f"Stop hunt detected at {lows[-1]:.8f} with {current_volume/avg_volume:.1f}x volume"
                }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def detect_fake_breakout(self, candles: List[Dict]) -> Dict:
        """
        Fake Breakout Detection
        - Price breaks key level
        - Closes back inside quickly
        - Often indicates manipulation
        """
        if len(candles) < 8:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        opens = df['open'].values
        
        # Find recent resistance/support
        highs_window = highs[-15:-1]
        lows_window = lows[-15:-1]
        
        resistance = np.max(highs_window)
        support = np.min(lows_window)
        
        current_high = highs[-1]
        current_low = lows[-1]
        current_close = closes[-1]
        current_open = opens[-1]
        
        # Fake breakout above resistance
        if current_high > resistance * 1.001 and current_close < resistance * 0.99:
            breakout_depth = (current_high - current_close) / current_high * 100
            if breakout_depth > 0.5:
                return {
                    "detected": True,
                    "type": "FAKE_BREAKOUT_UP",
                    "strength": min(breakout_depth * 2, 100.0),
                    "level": resistance,
                    "reason": f"Fake breakout above {resistance:.8f}, closed at {current_close:.8f}"
                }
        
        # Fake breakout below support
        if current_low < support * 0.999 and current_close > support * 1.01:
            breakout_depth = (current_close - current_low) / current_low * 100
            if breakout_depth > 0.5:
                return {
                    "detected": True,
                    "type": "FAKE_BREAKOUT_DOWN",
                    "strength": min(breakout_depth * 2, 100.0),
                    "level": support,
                    "reason": f"Fake breakout below {support:.8f}, closed at {current_close:.8f}"
                }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def get_liquidity_summary(self, candles: List[Dict]) -> Dict:
        """Get comprehensive liquidity analysis"""
        wick_sweep = self.detect_wick_sweep(candles)
        stop_hunt = self.detect_stop_hunt(candles)
        fake_breakout = self.detect_fake_breakout(candles)
        
        quality_score = 0.0
        if wick_sweep["detected"]:
            quality_score += wick_sweep["strength"] * 0.3
        if stop_hunt["detected"]:
            quality_score += stop_hunt["strength"] * 0.3
        if fake_breakout["detected"]:
            quality_score -= fake_breakout["strength"] * 0.5  # Negative for fake breakouts
        
        return {
            "wick_sweep": wick_sweep,
            "stop_hunt": stop_hunt,
            "fake_breakout": fake_breakout,
            "quality_score": max(quality_score, 0.0)
        }
