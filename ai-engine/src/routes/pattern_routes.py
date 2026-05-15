from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from datetime import datetime

from src.analysis.pattern_engine import PatternMatcher, CandleData

app = FastAPI(title="Pattern Memory & Matching Engine", version="1.0.0")

# Initialize pattern matcher
pattern_matcher = PatternMatcher()

# Pydantic models for requests/responses
class CandleRequest(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class IndicatorState(BaseModel):
    ema_20: float
    ema_50: float
    ema_200: float
    rsi: float
    macd: Dict
    atr: float
    volume_spike: bool

class MarketStructure(BaseModel):
    trend: str
    trend_strength: float
    structure: str
    bos: bool
    choch: bool
    liquidity_sweep: bool

class LiquidityAnalysis(BaseModel):
    wick_sweep: bool
    stop_hunt: bool
    order_block_level: float

class PatternMatchRequest(BaseModel):
    symbol: str
    live_candles: List[CandleRequest]
    indicators: IndicatorState
    structure: MarketStructure
    liquidity: LiquidityAnalysis
    stored_patterns: List[Dict]

class PatternMatchResponse(BaseModel):
    symbol: str
    timestamp: str
    match_count: int
    matches: List[Dict]
    top_match: Optional[Dict]
    alert_triggered: bool

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "service": "Pattern Memory & Matching Engine",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/match", response_model=PatternMatchResponse)
async def match_patterns(request: PatternMatchRequest):
    """
    Match live market conditions against stored patterns
    Return similarity scores and alerts
    """
    try:
        if len(request.live_candles) < 5:
            raise HTTPException(status_code=400, detail="Need at least 5 candles")
        
        # Convert to dict format for comparator
        live_candles = [candle.dict() for candle in request.live_candles]
        indicators = request.indicators.dict()
        structure = request.structure.dict()
        liquidity = request.liquidity.dict()
        
        # Run pattern matching
        matches = pattern_matcher.match_live_market(
            live_candles=live_candles,
            live_indicators=indicators,
            live_structure=structure,
            live_liquidity=liquidity,
            stored_patterns=request.stored_patterns
        )
        
        # Determine if alert should be triggered
        alert_triggered = False
        top_match = None
        
        if matches:
            top_match = matches[0]
            # Trigger alert if top match is HIGH or MEDIUM confidence
            if top_match['alert_level'] in ['HIGH', 'MEDIUM']:
                alert_triggered = True
        
        return PatternMatchResponse(
            symbol=request.symbol,
            timestamp=datetime.now().isoformat(),
            match_count=len(matches),
            matches=matches,
            top_match=top_match,
            alert_triggered=alert_triggered
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-pattern")
async def analyze_pattern(request: Dict):
    """
    Analyze a new pattern the user wants to save
    Return analysis of the pattern structure
    """
    try:
        candles = request.get('candles', [])
        if not candles or len(candles) < 5:
            return {"error": "Need at least 5 candles"}
        
        # Analyze candle sequence
        candle_analysis = _analyze_candles(candles)
        
        # Extract patterns
        patterns_found = _identify_patterns(candles)
        
        return {
            "candle_analysis": candle_analysis,
            "patterns_found": patterns_found,
            "recommendation": _get_recommendation(candle_analysis, patterns_found)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _analyze_candles(candles: List[Dict]) -> Dict:
    """Analyze candle sequence structure"""
    analysis = {
        "total_candles": len(candles),
        "average_body_size": np.mean([c.get('body_size', 50) for c in candles]),
        "average_wick_ratio": np.mean([
            (c.get('upper_wick', 0) + c.get('lower_wick', 0)) / (c['high'] - c['low'])
            for c in candles if (c['high'] - c['low']) > 0
        ]),
        "directions": [c.get('direction', 'DOJI') for c in candles[-5:]],
        "trend": _determine_trend(candles),
        "volatility": _calculate_volatility(candles)
    }
    return analysis

def _identify_patterns(candles: List[Dict]) -> List[str]:
    """Identify common patterns in candle sequence"""
    patterns = []
    
    if not candles or len(candles) < 2:
        return patterns
    
    # Check for engulfing
    for i in range(len(candles) - 1):
        curr = candles[i]
        next_candle = candles[i + 1]
        
        curr_low = min(curr.get('open'), curr.get('close'))
        curr_high = max(curr.get('open'), curr.get('close'))
        next_low = min(next_candle.get('open'), next_candle.get('close'))
        next_high = max(next_candle.get('open'), next_candle.get('close'))
        
        if next_low < curr_low and next_high > curr_high:
            patterns.append("ENGULFING")
            break
    
    # Check for rejection wicks
    for candle in candles[-3:]:
        upper_wick = candle.get('upper_wick', 0)
        lower_wick = candle.get('lower_wick', 0)
        body = abs(candle.get('close') - candle.get('open'))
        
        if upper_wick > body * 2 or lower_wick > body * 2:
            patterns.append("PIN_BAR")
            break
    
    # Check for momentum
    for candle in candles[-3:]:
        body_size = candle.get('body_size', 50)
        if body_size > 70:
            patterns.append("MOMENTUM")
            break
    
    return patterns

def _determine_trend(candles: List[Dict]) -> str:
    """Determine trend from candle sequence"""
    if not candles:
        return "NEUTRAL"
    
    closes = [c.get('close', 0) for c in candles]
    if len(closes) < 2:
        return "NEUTRAL"
    
    if closes[-1] > closes[0]:
        return "UP"
    elif closes[-1] < closes[0]:
        return "DOWN"
    else:
        return "NEUTRAL"

def _calculate_volatility(candles: List[Dict]) -> str:
    """Calculate volatility from candle ranges"""
    if not candles:
        return "NORMAL"
    
    ranges = [(c.get('high') - c.get('low')) for c in candles if c.get('high') and c.get('low')]
    if not ranges:
        return "NORMAL"
    
    avg_range = np.mean(ranges)
    current_range = ranges[-1] if ranges else avg_range
    
    if current_range > avg_range * 1.5:
        return "HIGH"
    elif current_range < avg_range * 0.7:
        return "LOW"
    else:
        return "NORMAL"

def _get_recommendation(analysis: Dict, patterns: List[str]) -> str:
    """Get recommendation for saving pattern"""
    if not patterns:
        return "Pattern has few distinctive features. Add more candles or more structure."
    
    if len(patterns) >= 2:
        return "Good pattern with multiple confirmations. Recommended to save!"
    
    return "Pattern found. Consider if it matches your trading style."
