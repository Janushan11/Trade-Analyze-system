import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class CandleData:
    """Individual candle data"""
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    
    @property
    def body_size(self) -> float:
        """Body size as % of range"""
        range_size = self.high - self.low
        body = abs(self.close - self.open)
        return (body / range_size * 100) if range_size > 0 else 50
    
    @property
    def upper_wick(self) -> float:
        """Upper wick size"""
        return self.high - max(self.open, self.close)
    
    @property
    def lower_wick(self) -> float:
        """Lower wick size"""
        return min(self.open, self.close) - self.low
    
    @property
    def direction(self) -> str:
        """UP, DOWN, or DOJI"""
        if abs(self.close - self.open) < (self.high - self.low) * 0.1:
            return "DOJI"
        return "UP" if self.close > self.open else "DOWN"


class PatternComparator:
    """
    Compare live candles against stored patterns
    Uses multi-dimensional similarity scoring
    """
    
    def __init__(self):
        self.weights = {
            'candle_sequence': 0.35,    # Shape similarity most important
            'trend_alignment': 0.25,    # Trend must align
            'structure_match': 0.15,    # Market structure matters
            'liquidity_match': 0.15,    # Liquidity context
            'indicator_match': 0.10     # Indicator state confirmation
        }
    
    def compare_patterns(self, 
                        stored_candles: List[Dict],
                        live_candles: List[Dict],
                        stored_indicators: Dict,
                        live_indicators: Dict,
                        stored_structure: Dict,
                        live_structure: Dict,
                        stored_liquidity: Dict,
                        live_liquidity: Dict) -> Dict:
        """
        Compare live market against stored pattern
        Returns detailed similarity breakdown
        """
        
        # Calculate component scores
        candle_score = self._score_candle_sequence(stored_candles, live_candles)
        trend_score = self._score_trend_alignment(stored_structure, live_structure)
        structure_score = self._score_structure_match(stored_structure, live_structure)
        liquidity_score = self._score_liquidity_match(stored_liquidity, live_liquidity)
        indicator_score = self._score_indicator_match(stored_indicators, live_indicators)
        
        # Calculate weighted overall score
        overall_score = (
            candle_score * self.weights['candle_sequence'] +
            trend_score * self.weights['trend_alignment'] +
            structure_score * self.weights['structure_match'] +
            liquidity_score * self.weights['liquidity_match'] +
            indicator_score * self.weights['indicator_match']
        )
        
        return {
            'overall_similarity': overall_score,
            'component_scores': {
                'candle_sequence': candle_score,
                'trend_alignment': trend_score,
                'structure_match': structure_score,
                'liquidity_match': liquidity_score,
                'indicator_match': indicator_score
            },
            'matches': {
                'candle_sequence': candle_score > 75,
                'trend_aligned': trend_score > 70,
                'structure_similar': structure_score > 65,
                'liquidity_context': liquidity_score > 60,
                'indicators_aligned': indicator_score > 60
            }
        }
    
    def _score_candle_sequence(self, stored: List[Dict], live: List[Dict]) -> float:
        """
        Score similarity of candle sequences
        Compare shapes, bodies, wicks, directions
        """
        if not stored or not live or len(live) < 5:
            return 0.0
        
        # Use last 5-10 candles for comparison
        comparison_length = min(5, len(stored), len(live))
        stored_recent = stored[-comparison_length:]
        live_recent = live[-comparison_length:]
        
        scores = []
        
        for i in range(comparison_length):
            stored_candle = stored_recent[i]
            live_candle = live_recent[i]
            
            # Direction match (most important)
            direction_match = 100 if stored_candle.get('direction') == live_candle.get('direction') else 40
            
            # Body size similarity (normalized)
            stored_body = stored_candle.get('body_size', 50)
            live_body = live_candle.get('body_size', 50)
            body_diff = abs(stored_body - live_body)
            body_score = max(0, 100 - body_diff)
            
            # Wick ratio similarity
            stored_upper_wick = stored_candle.get('upper_wick', 0)
            live_upper_wick = live_candle.get('upper_wick', 0)
            wick_score = self._compare_values(stored_upper_wick, live_upper_wick)
            
            # Combined score for this candle
            candle_score = (direction_match * 0.5 + body_score * 0.3 + wick_score * 0.2)
            scores.append(candle_score)
        
        return np.mean(scores) if scores else 0.0
    
    def _score_trend_alignment(self, stored_structure: Dict, live_structure: Dict) -> float:
        """Score if trend direction matches"""
        stored_trend = stored_structure.get('trend', 'NEUTRAL')
        live_trend = live_structure.get('trend', 'NEUTRAL')
        
        if stored_trend == live_trend:
            # Bonus for matching trend strength
            stored_strength = stored_structure.get('trend_strength', 50)
            live_strength = live_structure.get('trend_strength', 50)
            strength_diff = abs(stored_strength - live_strength)
            strength_score = max(0, 100 - strength_diff)
            return 90 + (strength_score * 0.1)  # 90-100
        
        # Different trends = lower score
        if stored_trend == 'NEUTRAL' or live_trend == 'NEUTRAL':
            return 50  # Neutral trend allows some flexibility
        
        return 20  # Opposite trends = very low score
    
    def _score_structure_match(self, stored_structure: Dict, live_structure: Dict) -> float:
        """Score market structure similarity"""
        scores = []
        
        # Pattern match (HH, HL, LH, LL)
        stored_pattern = stored_structure.get('structure', 'NONE')
        live_pattern = live_structure.get('structure', 'NONE')
        
        if stored_pattern == live_pattern:
            scores.append(100)
        else:
            # Same category (bullish: HH/HL, bearish: LH/LL)
            stored_bullish = stored_pattern in ['HH', 'HL']
            live_bullish = live_pattern in ['HH', 'HL']
            scores.append(70 if stored_bullish == live_bullish else 30)
        
        # BOS/CHOCH match
        stored_bos = stored_structure.get('bos', False)
        live_bos = live_structure.get('bos', False)
        scores.append(100 if stored_bos == live_bos else 60)
        
        stored_choch = stored_structure.get('choch', False)
        live_choch = live_structure.get('choch', False)
        scores.append(100 if stored_choch == live_choch else 60)
        
        # Level proximity (support/resistance)
        stored_support = stored_structure.get('nearest_support', 0)
        live_support = live_structure.get('nearest_support', 0)
        support_score = self._compare_price_levels(stored_support, live_support)
        scores.append(support_score)
        
        return np.mean(scores) if scores else 0.0
    
    def _score_liquidity_match(self, stored_liquidity: Dict, live_liquidity: Dict) -> float:
        """Score liquidity context similarity"""
        scores = []
        
        # Wick sweep match
        stored_sweep = stored_liquidity.get('wick_sweep', False)
        live_sweep = live_liquidity.get('wick_sweep', False)
        scores.append(100 if stored_sweep == live_sweep else 50)
        
        # Stop hunt match
        stored_hunt = stored_liquidity.get('stop_hunt', False)
        live_hunt = live_liquidity.get('stop_hunt', False)
        scores.append(100 if stored_hunt == live_hunt else 50)
        
        # Order block match
        stored_ob = stored_liquidity.get('order_block_level', 0)
        live_ob = live_liquidity.get('order_block_level', 0)
        ob_score = self._compare_price_levels(stored_ob, live_ob) if stored_ob and live_ob else 70
        scores.append(ob_score)
        
        return np.mean(scores) if scores else 0.0
    
    def _score_indicator_match(self, stored_indicators: Dict, live_indicators: Dict) -> float:
        """Score technical indicator alignment"""
        scores = []
        
        # EMA alignment
        stored_ema20 = stored_indicators.get('ema_20', 0)
        stored_ema50 = stored_indicators.get('ema_50', 0)
        live_ema20 = live_indicators.get('ema_20', 0)
        live_ema50 = live_indicators.get('ema_50', 0)
        
        # Check if EMA relationship is same
        stored_ema_bullish = stored_ema20 > stored_ema50
        live_ema_bullish = live_ema20 > live_ema50
        scores.append(100 if stored_ema_bullish == live_ema_bullish else 50)
        
        # RSI zone match
        stored_rsi = stored_indicators.get('rsi', 50)
        live_rsi = live_indicators.get('rsi', 50)
        rsi_score = self._compare_values(stored_rsi, live_rsi, max_diff=15)
        scores.append(rsi_score)
        
        # MACD direction match
        stored_macd_hist = stored_indicators.get('macd', {}).get('histogram', 0)
        live_macd_hist = live_indicators.get('macd', {}).get('histogram', 0)
        stored_macd_positive = stored_macd_hist > 0
        live_macd_positive = live_macd_hist > 0
        scores.append(100 if stored_macd_positive == live_macd_positive else 50)
        
        # Volume spike match
        stored_volume = stored_indicators.get('volume_spike', False)
        live_volume = live_indicators.get('volume_spike', False)
        scores.append(100 if stored_volume == live_volume else 60)
        
        return np.mean(scores) if scores else 0.0
    
    def _compare_values(self, val1: float, val2: float, max_diff: float = 10) -> float:
        """
        Compare two values and return similarity score
        Lower difference = higher score
        """
        diff = abs(val1 - val2)
        if diff <= max_diff:
            return 100 - (diff / max_diff * 25)  # 75-100
        return max(0, 100 - (diff / max_diff * 100))
    
    def _compare_price_levels(self, level1: float, level2: float, tolerance: float = 0.02) -> float:
        """
        Compare price levels (support/resistance)
        Tolerance is % difference
        """
        if level1 == 0 or level2 == 0:
            return 70
        
        pct_diff = abs(level1 - level2) / level1 * 100
        if pct_diff <= tolerance * 100:
            return 100
        elif pct_diff <= tolerance * 200:
            return 80
        elif pct_diff <= tolerance * 500:
            return 60
        else:
            return 40


class PatternMatcher:
    """
    Live pattern matching engine
    Continuously compares live market against stored patterns
    """
    
    def __init__(self):
        self.comparator = PatternComparator()
        self.minimum_similarity = 65  # % threshold for alert
    
    def match_live_market(self,
                         live_candles: List[Dict],
                         live_indicators: Dict,
                         live_structure: Dict,
                         live_liquidity: Dict,
                         stored_patterns: List[Dict]) -> List[Dict]:
        """
        Compare live market against all stored patterns
        Return sorted list of matches
        """
        matches = []
        
        for pattern in stored_patterns:
            similarity_result = self.comparator.compare_patterns(
                stored_candles=pattern.get('candle_sequence', []),
                live_candles=live_candles,
                stored_indicators=pattern.get('indicator_state', {}),
                live_indicators=live_indicators,
                stored_structure=pattern.get('market_structure', {}),
                live_structure=live_structure,
                stored_liquidity=pattern.get('liquidity_analysis', {}),
                live_liquidity=live_liquidity
            )
            
            overall_sim = similarity_result['overall_similarity']
            
            # Only include matches above threshold
            if overall_sim >= self.minimum_similarity:
                matches.append({
                    'pattern_id': pattern.get('_id'),
                    'pattern_name': pattern.get('pattern_name'),
                    'direction': pattern.get('direction'),
                    'confidence': pattern.get('confidence'),
                    'performance_score': pattern.get('performance_score', {}),
                    'similarity': overall_sim,
                    'component_scores': similarity_result['component_scores'],
                    'matches': similarity_result['matches'],
                    'alert_level': self._get_alert_level(overall_sim)
                })
        
        # Sort by similarity (highest first)
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        return matches
    
    def _get_alert_level(self, similarity: float) -> str:
        """Determine alert level based on similarity"""
        if similarity >= 85:
            return "HIGH"
        elif similarity >= 75:
            return "MEDIUM"
        else:
            return "LOW"
