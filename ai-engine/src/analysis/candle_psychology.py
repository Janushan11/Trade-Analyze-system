import numpy as np
import pandas as pd
from typing import List, Dict

class CandlePsychologyEngine:
    """
    Candle Psychology Engine
    Detects: Engulfing, Pin Bars, Rejection Candles, Momentum Candles
    """
    
    def __init__(self):
        pass
    
    def detect_engulfing(self, candles: List[Dict]) -> Dict:
        """
        Engulfing Candle Detection
        Bullish: Current candle completely covers previous candle's range (larger body)
        Bearish: Current candle engulfs previous with larger bearish body
        """
        if len(candles) < 2:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        prev_candle = candles[-2]
        curr_candle = candles[-1]
        
        prev_high = prev_candle['high']
        prev_low = prev_candle['low']
        prev_open = prev_candle['open']
        prev_close = prev_candle['close']
        
        curr_open = curr_candle['open']
        curr_close = curr_candle['close']
        curr_high = curr_candle['high']
        curr_low = curr_candle['low']
        
        prev_body_high = max(prev_open, prev_close)
        prev_body_low = min(prev_open, prev_close)
        
        curr_body_high = max(curr_open, curr_close)
        curr_body_low = min(curr_open, curr_close)
        
        # Bullish engulfing: Current closes above previous high and opens below previous low
        if curr_open < prev_body_low and curr_close > prev_body_high:
            engulfing_size = (curr_close - curr_open) / curr_close * 100
            if engulfing_size > 0.5:
                return {
                    "detected": True,
                    "type": "BULLISH_ENGULFING",
                    "strength": min(engulfing_size * 0.5, 100.0),
                    "size": engulfing_size,
                    "reason": f"Bullish engulfing: {engulfing_size:.2f}% candle size"
                }
        
        # Bearish engulfing: Current closes below previous low and opens above previous high
        if curr_open > prev_body_high and curr_close < prev_body_low:
            engulfing_size = (curr_open - curr_close) / curr_open * 100
            if engulfing_size > 0.5:
                return {
                    "detected": True,
                    "type": "BEARISH_ENGULFING",
                    "strength": min(engulfing_size * 0.5, 100.0),
                    "size": engulfing_size,
                    "reason": f"Bearish engulfing: {engulfing_size:.2f}% candle size"
                }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def detect_pin_bar(self, candles: List[Dict]) -> Dict:
        """
        Pin Bar Detection (Rejection Wick)
        - Long wick on one side
        - Small body on opposite side
        - Indicates rejection of price at that level
        """
        if len(candles) < 1:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        candle = candles[-1]
        
        high = candle['high']
        low = candle['low']
        open_price = candle['open']
        close = candle['close']
        
        candle_range = high - low
        body = abs(close - open_price)
        upper_wick = high - max(open_price, close)
        lower_wick = min(open_price, close) - low
        
        # Pin bar requirements:
        # - Wick at least 2x the body
        # - Body is small (less than 30% of range)
        body_ratio = body / candle_range if candle_range > 0 else 0
        
        # Bullish pin bar: Long lower wick, small body at top
        if lower_wick > upper_wick * 2 and body_ratio < 0.3 and close > open_price:
            wick_ratio = lower_wick / candle_range if candle_range > 0 else 0
            return {
                "detected": True,
                "type": "BULLISH_PIN_BAR",
                "strength": min(wick_ratio * 50, 100.0),
                "wick_ratio": wick_ratio,
                "reason": f"Bullish rejection: {lower_wick:.8f} lower wick vs {upper_wick:.8f} upper"
            }
        
        # Bearish pin bar: Long upper wick, small body at bottom
        if upper_wick > lower_wick * 2 and body_ratio < 0.3 and close < open_price:
            wick_ratio = upper_wick / candle_range if candle_range > 0 else 0
            return {
                "detected": True,
                "type": "BEARISH_PIN_BAR",
                "strength": min(wick_ratio * 50, 100.0),
                "wick_ratio": wick_ratio,
                "reason": f"Bearish rejection: {upper_wick:.8f} upper wick vs {lower_wick:.8f} lower"
            }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def detect_rejection_candle(self, candles: List[Dict]) -> Dict:
        """
        Rejection Candle Detection
        - Strong body in one direction
        - Closes near extremes
        - Shows strong conviction
        """
        if len(candles) < 1:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        candle = candles[-1]
        
        high = candle['high']
        low = candle['low']
        open_price = candle['open']
        close = candle['close']
        volume = candle.get('volume', 0)
        
        candle_range = high - low
        body = abs(close - open_price)
        
        # Rejection candle: Body > 70% of range
        body_ratio = body / candle_range if candle_range > 0 else 0
        
        if body_ratio > 0.7:
            # Bullish rejection
            if close > open_price:
                close_ratio = (close - low) / candle_range if candle_range > 0 else 0
                if close_ratio > 0.8:  # Closed in upper 20% of range
                    return {
                        "detected": True,
                        "type": "BULLISH_REJECTION",
                        "strength": min(body_ratio * 60, 100.0),
                        "body_ratio": body_ratio,
                        "close_position": close_ratio,
                        "reason": f"Strong bullish rejection: {body_ratio*100:.1f}% body, closed at {close_ratio*100:.1f}%"
                    }
            
            # Bearish rejection
            if close < open_price:
                close_ratio = (high - close) / candle_range if candle_range > 0 else 0
                if close_ratio > 0.8:  # Closed in lower 20% of range
                    return {
                        "detected": True,
                        "type": "BEARISH_REJECTION",
                        "strength": min(body_ratio * 60, 100.0),
                        "body_ratio": body_ratio,
                        "close_position": close_ratio,
                        "reason": f"Strong bearish rejection: {body_ratio*100:.1f}% body, closed at {close_ratio*100:.1f}%"
                    }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def detect_momentum_candle(self, candles: List[Dict]) -> Dict:
        """
        Momentum Candle Detection
        - Large body (>1% of price)
        - Small wicks
        - Shows strong directional movement
        """
        if len(candles) < 1:
            return {"detected": False, "type": "NONE", "strength": 0.0}
        
        candle = candles[-1]
        
        high = candle['high']
        low = candle['low']
        open_price = candle['open']
        close = candle['close']
        
        candle_range = high - low
        body = abs(close - open_price)
        
        # Body size relative to price
        body_pct = (body / close) * 100 if close != 0 else 0
        
        # Momentum candle: Body > 0.8% and small wicks
        if body_pct > 0.8:
            upper_wick = high - max(open_price, close)
            lower_wick = min(open_price, close) - low
            wick_ratio = (upper_wick + lower_wick) / candle_range if candle_range > 0 else 0
            
            if wick_ratio < 0.2:  # Small wicks
                # Bullish momentum
                if close > open_price:
                    return {
                        "detected": True,
                        "type": "BULLISH_MOMENTUM",
                        "strength": min(body_pct * 10, 100.0),
                        "body_pct": body_pct,
                        "reason": f"Strong bullish momentum: {body_pct:.2f}% candle with minimal wicks"
                    }
                
                # Bearish momentum
                elif close < open_price:
                    return {
                        "detected": True,
                        "type": "BEARISH_MOMENTUM",
                        "strength": min(body_pct * 10, 100.0),
                        "body_pct": body_pct,
                        "reason": f"Strong bearish momentum: {body_pct:.2f}% candle with minimal wicks"
                    }
        
        return {"detected": False, "type": "NONE", "strength": 0.0}
    
    def get_candle_psychology(self, candles: List[Dict]) -> Dict:
        """Get comprehensive candle psychology analysis"""
        engulfing = self.detect_engulfing(candles)
        pin_bar = self.detect_pin_bar(candles)
        rejection = self.detect_rejection_candle(candles)
        momentum = self.detect_momentum_candle(candles)
        
        quality_score = 0.0
        patterns_found = []
        
        if engulfing["detected"]:
            quality_score += engulfing["strength"]
            patterns_found.append(engulfing["type"])
        
        if pin_bar["detected"]:
            quality_score += pin_bar["strength"]
            patterns_found.append(pin_bar["type"])
        
        if rejection["detected"]:
            quality_score += rejection["strength"]
            patterns_found.append(rejection["type"])
        
        if momentum["detected"]:
            quality_score += momentum["strength"]
            patterns_found.append(momentum["type"])
        
        return {
            "engulfing": engulfing,
            "pin_bar": pin_bar,
            "rejection": rejection,
            "momentum": momentum,
            "quality_score": min(quality_score, 100.0),
            "patterns_found": patterns_found
        }
