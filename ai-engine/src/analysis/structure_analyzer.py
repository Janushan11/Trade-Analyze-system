import numpy as np
import pandas as pd
from typing import List, Dict, Tuple

class StructureAnalyzer:
    """
    Structure Pattern Detection Engine
    Detects: HH, HL, LH, LL patterns
    """
    
    def __init__(self, lookback: int = 50):
        self.lookback = lookback
    
    def detect_structure_patterns(self, candles: List[Dict]) -> Dict:
        """
        Detect structure patterns: HH, HL, LH, LL
        HH = Higher High (bullish)
        HL = Higher Low (bullish continuation)
        LH = Lower High (bearish)
        LL = Lower Low (bearish continuation)
        """
        if len(candles) < 5:
            return {"pattern": "NONE", "strength": 0.0, "type": "NONE"}
        
        df = pd.DataFrame(candles)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        
        # Find swing points
        recent_swings = self._find_swings(highs, lows)
        
        if len(recent_swings) < 4:
            return {"pattern": "NONE", "strength": 0.0, "type": "NONE"}
        
        # Get last 4 swings
        last_4 = recent_swings[-4:]
        
        # Identify the pattern
        pattern_type, strength = self._identify_pattern(last_4, highs, lows, closes)
        
        return {
            "pattern": pattern_type,
            "strength": strength,
            "type": "STRUCTURE",
            "swings": [{"index": s["index"], "value": s["value"], "type": s["type"]} for s in last_4]
        }
    
    def _find_swings(self, highs: np.ndarray, lows: np.ndarray, min_lookback: int = 3) -> List[Dict]:
        """Find swing highs and lows"""
        swings = []
        
        for i in range(min_lookback, len(highs) - min_lookback):
            # Swing high
            if highs[i] > np.max(highs[i-min_lookback:i]) and highs[i] > np.max(highs[i+1:i+min_lookback+1]):
                swings.append({
                    "index": i,
                    "value": highs[i],
                    "type": "HIGH"
                })
            
            # Swing low
            if lows[i] < np.min(lows[i-min_lookback:i]) and lows[i] < np.min(lows[i+1:i+min_lookback+1]):
                swings.append({
                    "index": i,
                    "value": lows[i],
                    "type": "LOW"
                })
        
        # Remove duplicates (keep the most extreme)
        cleaned_swings = []
        for swing in swings:
            if not cleaned_swings or swing["index"] != cleaned_swings[-1]["index"]:
                cleaned_swings.append(swing)
        
        return cleaned_swings
    
    def _identify_pattern(self, swings: List[Dict], highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Tuple[str, float]:
        """Identify HH, HL, LH, LL pattern"""
        if len(swings) < 4:
            return "NONE", 0.0
        
        s1, s2, s3, s4 = swings[-4], swings[-3], swings[-2], swings[-1]
        
        # Get trend direction (uptrend or downtrend)
        trend_strength = closes[-1] - closes[-20] if len(closes) >= 20 else 0
        
        # HH = Higher High (last high > previous high) - Bullish continuation
        if s1["type"] == "HIGH" and s3["type"] == "HIGH" and s3["value"] > s1["value"]:
            strength = self._calculate_strength(s1["value"], s3["value"])
            return "HH", strength
        
        # HL = Higher Low (last low > previous low) - Bullish continuation
        if s1["type"] == "LOW" and s3["type"] == "LOW" and s3["value"] > s1["value"]:
            strength = self._calculate_strength(s1["value"], s3["value"])
            return "HL", strength
        
        # LH = Lower High (last high < previous high) - Bearish reversal
        if s1["type"] == "HIGH" and s3["type"] == "HIGH" and s3["value"] < s1["value"]:
            strength = self._calculate_strength(s3["value"], s1["value"])
            return "LH", strength
        
        # LL = Lower Low (last low < previous low) - Bearish continuation
        if s1["type"] == "LOW" and s3["type"] == "LOW" and s3["value"] < s1["value"]:
            strength = self._calculate_strength(s3["value"], s1["value"])
            return "LL", strength
        
        return "NONE", 0.0
    
    def _calculate_strength(self, previous_level: float, current_level: float) -> float:
        """Calculate pattern strength based on percentage change"""
        if previous_level == 0:
            return 0.0
        pct_change = abs((current_level - previous_level) / previous_level) * 100
        return min(pct_change * 0.5, 100.0)
    
    def is_bullish_structure(self, structure: Dict) -> bool:
        """Check if structure is bullish"""
        return structure["pattern"] in ["HH", "HL"]
    
    def is_bearish_structure(self, structure: Dict) -> bool:
        """Check if structure is bearish"""
        return structure["pattern"] in ["LH", "LL"]
