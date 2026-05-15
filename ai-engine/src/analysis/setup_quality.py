import numpy as np
import pandas as pd
from typing import List, Dict

class SetupQualityEvaluator:
    """
    Setup Quality Evaluator
    Evaluates trading setup quality instead of predicting next candle
    Focus: FEWER but HIGHER QUALITY trades
    """
    
    def __init__(self):
        pass
    
    def evaluate_setup_quality(self, 
                              candles: List[Dict],
                              structure: Dict,
                              liquidity: Dict,
                              candle_psychology: Dict,
                              indicators: Dict,
                              trend: Dict) -> Dict:
        """
        Comprehensive setup quality evaluation
        Returns quality score and detailed reasoning
        """
        
        quality_components = {
            "trend_alignment": self._evaluate_trend_alignment(trend, structure),
            "pattern_confirmation": self._evaluate_pattern_confirmation(structure, candle_psychology),
            "liquidity_quality": self._evaluate_liquidity_quality(liquidity),
            "candle_strength": self._evaluate_candle_strength(candle_psychology),
            "technical_setup": self._evaluate_technical_setup(indicators, candles),
            "risk_reward": self._evaluate_risk_reward(candles),
        }
        
        # Calculate overall quality score
        weights = {
            "trend_alignment": 0.25,
            "pattern_confirmation": 0.25,
            "liquidity_quality": 0.15,
            "candle_strength": 0.15,
            "technical_setup": 0.15,
            "risk_reward": 0.05,
        }
        
        overall_score = sum(
            quality_components[key]["score"] * weights[key] 
            for key in quality_components
        )
        
        # Quality threshold: Only trade if > 60 (fewer, better trades)
        entry_quality = "HIGH" if overall_score > 70 else "MEDIUM" if overall_score > 50 else "LOW"
        should_trade = overall_score > 60  # Only enter on HIGH quality
        
        return {
            "overall_score": min(overall_score, 100.0),
            "entry_quality": entry_quality,
            "should_trade": should_trade,
            "components": quality_components,
            "reasoning": self._generate_reasoning(quality_components, structure, candle_psychology),
            "probability": self._calculate_probability(quality_components),
            "risk_level": self._assess_risk_level(quality_components)
        }
    
    def _evaluate_trend_alignment(self, trend: Dict, structure: Dict) -> Dict:
        """Evaluate if setup aligns with current trend"""
        score = 0.0
        reasons = []
        
        trend_direction = trend.get("trend", "NEUTRAL")
        trend_strength = trend.get("strength", 0)
        structure_pattern = structure.get("pattern", "NONE")
        
        # Trend strength factor
        score += min(trend_strength, 100) * 0.6
        
        # Structure alignment
        if trend_direction == "UP" and structure_pattern in ["HH", "HL"]:
            score += 40
            reasons.append("Structure aligned with uptrend (HH/HL)")
        elif trend_direction == "DOWN" and structure_pattern in ["LH", "LL"]:
            score += 40
            reasons.append("Structure aligned with downtrend (LH/LL)")
        elif structure_pattern != "NONE":
            score += 20
            reasons.append(f"Structure present ({structure_pattern})")
        
        return {"score": min(score, 100.0), "reasons": reasons}
    
    def _evaluate_pattern_confirmation(self, structure: Dict, candle_psychology: Dict) -> Dict:
        """Evaluate if pattern confirmation is present"""
        score = 0.0
        reasons = []
        
        # Structure strength
        structure_strength = structure.get("strength", 0)
        score += structure_strength * 0.5
        
        # Candle pattern confirmation
        patterns_found = candle_psychology.get("patterns_found", [])
        candle_psychology_score = candle_psychology.get("quality_score", 0)
        
        if len(patterns_found) > 0:
            score += candle_psychology_score * 0.5
            reasons.append(f"Candle patterns confirmed: {', '.join(patterns_found)}")
        else:
            reasons.append("No candle pattern confirmation yet")
        
        return {"score": min(score, 100.0), "reasons": reasons}
    
    def _evaluate_liquidity_quality(self, liquidity: Dict) -> Dict:
        """Evaluate liquidity setup quality"""
        score = 0.0
        reasons = []
        
        wick_sweep = liquidity.get("wick_sweep", {})
        stop_hunt = liquidity.get("stop_hunt", {})
        fake_breakout = liquidity.get("fake_breakout", {})
        
        # Positive liquidity signals
        if wick_sweep.get("detected"):
            score += wick_sweep.get("strength", 0) * 0.6
            reasons.append(f"Wick sweep confirmed ({wick_sweep['type']})")
        
        if stop_hunt.get("detected"):
            score += stop_hunt.get("strength", 0) * 0.7
            reasons.append(f"Stop hunt detected ({stop_hunt['type']})")
        
        # Negative liquidity signals (fake breakouts reduce score)
        if fake_breakout.get("detected"):
            score -= fake_breakout.get("strength", 0) * 0.8
            reasons.append(f"Fake breakout detected - CAUTION ({fake_breakout['type']})")
        
        return {"score": max(min(score, 100.0), 0.0), "reasons": reasons}
    
    def _evaluate_candle_strength(self, candle_psychology: Dict) -> Dict:
        """Evaluate current candle strength"""
        score = 0.0
        reasons = []
        
        momentum = candle_psychology.get("momentum", {})
        rejection = candle_psychology.get("rejection", {})
        engulfing = candle_psychology.get("engulfing", {})
        
        if momentum.get("detected"):
            score += momentum.get("strength", 0)
            reasons.append(f"Strong momentum candle ({momentum['type']})")
        
        if rejection.get("detected"):
            score += rejection.get("strength", 0)
            reasons.append(f"Strong rejection candle ({rejection['type']})")
        
        if engulfing.get("detected"):
            score += engulfing.get("strength", 0)
            reasons.append(f"Engulfing pattern ({engulfing['type']})")
        
        if not reasons:
            reasons.append("Candle strength: Neutral")
        
        return {"score": min(score, 100.0), "reasons": reasons}
    
    def _evaluate_technical_setup(self, indicators: Dict, candles: List[Dict]) -> Dict:
        """Evaluate technical indicator alignment"""
        score = 0.0
        reasons = []
        
        # EMA alignment
        ema_20 = indicators.get("ema_20", 0)
        ema_50 = indicators.get("ema_50", 0)
        ema_200 = indicators.get("ema_200", 0)
        close = candles[-1]["close"] if candles else 0
        
        bullish_ema_alignment = close > ema_20 > ema_50 > ema_200
        bearish_ema_alignment = close < ema_20 < ema_50 < ema_200
        
        if bullish_ema_alignment:
            score += 30
            reasons.append("EMA aligned (20 > 50 > 200)")
        elif bearish_ema_alignment:
            score += 30
            reasons.append("EMA aligned bearish (20 < 50 < 200)")
        else:
            score += 10
            reasons.append("EMA not fully aligned")
        
        # RSI
        rsi = indicators.get("rsi", 50)
        if 30 < rsi < 70:
            score += 20
            reasons.append(f"RSI neutral zone ({rsi:.0f})")
        elif rsi > 70 or rsi < 30:
            score += 10
            reasons.append(f"RSI extreme ({rsi:.0f}) - potential reversal")
        
        # Volume
        volume_spike = indicators.get("volume_spike", False)
        if volume_spike:
            score += 15
            reasons.append("Volume spike confirmed")
        
        # ATR (volatility)
        atr = indicators.get("atr", 0)
        if atr > 0:
            score += 10
            reasons.append(f"ATR: {atr:.8f} (for position sizing)")
        
        # MACD
        macd_histogram = indicators.get("macd_histogram", 0)
        if macd_histogram > 0:
            score += 5
            reasons.append("MACD histogram positive")
        elif macd_histogram < 0:
            score += 5
            reasons.append("MACD histogram negative")
        
        return {"score": min(score, 100.0), "reasons": reasons}
    
    def _evaluate_risk_reward(self, candles: List[Dict]) -> Dict:
        """Evaluate risk/reward ratio"""
        score = 50.0  # Neutral baseline
        reasons = []
        
        if len(candles) < 2:
            return {"score": score, "reasons": ["Insufficient data for R:R calculation"]}
        
        current_price = candles[-1]["close"]
        recent_low = min([c["low"] for c in candles[-10:]])
        recent_high = max([c["high"] for c in candles[-10:]])
        
        risk_distance = current_price - recent_low
        reward_potential = recent_high - current_price
        
        if risk_distance > 0 and reward_potential > 0:
            risk_reward_ratio = reward_potential / risk_distance
            
            if risk_reward_ratio >= 2.0:
                score += 30
                reasons.append(f"Excellent R:R ratio ({risk_reward_ratio:.2f}:1)")
            elif risk_reward_ratio >= 1.5:
                score += 20
                reasons.append(f"Good R:R ratio ({risk_reward_ratio:.2f}:1)")
            elif risk_reward_ratio >= 1.0:
                score += 10
                reasons.append(f"Fair R:R ratio ({risk_reward_ratio:.2f}:1)")
            else:
                score -= 10
                reasons.append(f"Poor R:R ratio ({risk_reward_ratio:.2f}:1)")
        
        return {"score": score, "reasons": reasons}
    
    def _generate_reasoning(self, components: Dict, structure: Dict, candle_psychology: Dict) -> List[str]:
        """Generate detailed reasoning for the quality score"""
        reasons = []
        
        for component_name, component_data in components.items():
            if component_data.get("reasons"):
                reasons.extend(component_data["reasons"])
        
        # Add specific pattern info
        if structure.get("pattern") != "NONE":
            reasons.insert(0, f"Structure: {structure['pattern']} (strength: {structure['strength']:.1f})")
        
        return reasons
    
    def _calculate_probability(self, components: Dict) -> float:
        """Calculate success probability based on components"""
        trend_score = components.get("trend_alignment", {}).get("score", 0) / 100
        pattern_score = components.get("pattern_confirmation", {}).get("score", 0) / 100
        technical_score = components.get("technical_setup", {}).get("score", 0) / 100
        
        # Average of key components
        probability = (trend_score * 0.4 + pattern_score * 0.4 + technical_score * 0.2) * 100
        
        # Cap probability at 75% (realistic for 1M trading)
        return min(probability, 75.0)
    
    def _assess_risk_level(self, components: Dict) -> str:
        """Assess overall risk level"""
        liquidity_score = components.get("liquidity_quality", {}).get("score", 50)
        candle_score = components.get("candle_strength", {}).get("score", 50)
        risk_reward_score = components.get("risk_reward", {}).get("score", 50)
        
        avg_score = (liquidity_score + candle_score + risk_reward_score) / 3
        
        if avg_score > 70:
            return "LOW"
        elif avg_score > 50:
            return "MEDIUM"
        else:
            return "HIGH"
