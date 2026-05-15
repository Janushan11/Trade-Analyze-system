from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from datetime import datetime
import asyncio

# Import custom modules
from src.analysis.smc_analyzer import SMCAnalyzer
from src.analysis.structure_analyzer import StructureAnalyzer
from src.analysis.liquidity_engine import LiquidityEngine
from src.analysis.candle_psychology import CandlePsychologyEngine
from src.analysis.setup_quality import SetupQualityEvaluator
from src.patterns.quasimodo import QuasimodroAnalyzer
from src.utils.indicators import TechnicalIndicators
from src.models.trading_model import TradingModel

app = FastAPI(title="Trade Analyze AI Engine - Smart Setup Quality Focus", version="2.0.0")

# Initialize analyzers and evaluators
smc = SMCAnalyzer()
structure = StructureAnalyzer()
liquidity = LiquidityEngine()
candle_psych = CandlePsychologyEngine()
setup_quality = SetupQualityEvaluator()
qm = QuasimodroAnalyzer()
ti = TechnicalIndicators()
model = TradingModel()

# Try to load pre-trained model
model.load()

class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    openTime: Optional[int] = None
    closeTime: Optional[int] = None

class AnalysisRequest(BaseModel):
    symbol: str
    candles: List[Candle]
    timeframe: str = "1m"

class AnalysisResponse(BaseModel):
    symbol: str
    timestamp: str
    entry_quality: str  # HIGH, MEDIUM, LOW
    should_trade: bool  # Only True if HIGH quality (>60)
    setup_probability: float  # Probability of success (0-75%)
    confidence: float  # Setup confidence (0-100%)
    trend: str
    trendStrength: float
    structure: Dict
    liquidity: Dict
    candle_psychology: Dict
    indicators: Dict
    reasoning: List[str]
    risk_level: str  # LOW, MEDIUM, HIGH
    quality_components: Dict

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model.model is not None
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_candles(request: AnalysisRequest):
    """
    Analyze candles for SETUP QUALITY (not next candle prediction)
    Focus: High-quality setups only, fewer but better trades
    Threshold: Only trade if entry_quality = HIGH (>60 score)
    """
    try:
        if len(request.candles) < 10:
            raise HTTPException(status_code=400, detail="Need at least 10 candles")
        
        # Convert request to dict format
        candles_data = []
        for c in request.candles:
            candles_data.append({
                "timestamp": c.timestamp,
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
                "openTime": c.openTime,
                "closeTime": c.closeTime
            })
        
        # Extract arrays for calculations
        closes = np.array([c['close'] for c in candles_data])
        highs = np.array([c['high'] for c in candles_data])
        lows = np.array([c['low'] for c in candles_data])
        volumes = np.array([c['volume'] for c in candles_data])
        
        # ===== STEP 1: STRUCTURE ANALYSIS =====
        structure_result = structure.detect_structure_patterns(candles_data)
        
        # ===== STEP 2: LIQUIDITY ANALYSIS =====
        liquidity_result = liquidity.get_liquidity_summary(candles_data)
        
        # ===== STEP 3: CANDLE PSYCHOLOGY =====
        candle_psychology_result = candle_psych.get_candle_psychology(candles_data)
        
        # ===== STEP 4: INDICATOR CALCULATIONS (Must-Haves) =====
        ema_20 = ti.calculate_ema(closes, 20)[-1]
        ema_50 = ti.calculate_ema(closes, 50)[-1]
        ema_200 = ti.calculate_ema(closes, 200)[-1]
        rsi = ti.calculate_rsi(closes, 14)
        macd = ti.calculate_macd(closes)
        atr = ti.calculate_atr(highs, lows, closes)
        volume_spike = ti.detect_volume_spike(volumes)
        
        # Optional but useful
        bb = ti.calculate_bollinger_bands(closes)
        momentum = ti.calculate_momentum(closes)
        stochastic = ti.calculate_stochastic(highs, lows, closes)
        
        # ===== STEP 5: TREND DETERMINATION =====
        if ema_20 > ema_50 > ema_200:
            trend = "UP"
            trend_strength = min((ema_20 - ema_200) / ema_200 * 100, 100)
        elif ema_20 < ema_50 < ema_200:
            trend = "DOWN"
            trend_strength = min((ema_200 - ema_20) / ema_200 * 100, 100)
        else:
            trend = "NEUTRAL"
            trend_strength = 50
        
        # ===== STEP 6: SETUP QUALITY EVALUATION =====
        indicators = {
            "ema_20": ema_20,
            "ema_50": ema_50,
            "ema_200": ema_200,
            "rsi": rsi,
            "macd_histogram": macd["histogram"],
            "atr": atr,
            "volume_spike": volume_spike
        }
        
        trend_info = {
            "trend": trend,
            "strength": trend_strength
        }
        
        # CORE EVALUATION: Setup Quality (not prediction)
        quality_evaluation = setup_quality.evaluate_setup_quality(
            candles=candles_data,
            structure=structure_result,
            liquidity=liquidity_result,
            candle_psychology=candle_psychology_result,
            indicators=indicators,
            trend=trend_info
        )
        
        # ===== STEP 7: RESPONSE FORMATTING =====
        return AnalysisResponse(
            symbol=request.symbol,
            timestamp=datetime.now().isoformat(),
            entry_quality=quality_evaluation["entry_quality"],
            should_trade=quality_evaluation["should_trade"],
            setup_probability=quality_evaluation["probability"],
            confidence=quality_evaluation["overall_score"],
            trend=trend,
            trendStrength=trend_strength,
            structure=structure_result,
            liquidity={
                "wick_sweep": liquidity_result["wick_sweep"],
                "stop_hunt": liquidity_result["stop_hunt"],
                "fake_breakout": liquidity_result["fake_breakout"]
            },
            candle_psychology={
                "engulfing": candle_psychology_result["engulfing"],
                "pin_bar": candle_psychology_result["pin_bar"],
                "rejection": candle_psychology_result["rejection"],
                "momentum": candle_psychology_result["momentum"],
                "patterns_found": candle_psychology_result["patterns_found"]
            },
            indicators={
                "ema_20": float(ema_20),
                "ema_50": float(ema_50),
                "ema_200": float(ema_200),
                "rsi": float(rsi),
                "macd": float(macd["macd"]),
                "macd_signal": float(macd["signal"]),
                "macd_histogram": float(macd["histogram"]),
                "atr": float(atr),
                "bb_upper": float(bb["upper"]),
                "bb_middle": float(bb["middle"]),
                "bb_lower": float(bb["lower"]),
                "momentum": float(momentum),
                "volume_spike": volume_spike
            },
            reasoning=quality_evaluation["reasoning"],
            risk_level=quality_evaluation["risk_level"],
            quality_components={
                "trend_alignment": quality_evaluation["components"]["trend_alignment"],
                "pattern_confirmation": quality_evaluation["components"]["pattern_confirmation"],
                "liquidity_quality": quality_evaluation["components"]["liquidity_quality"],
                "candle_strength": quality_evaluation["components"]["candle_strength"],
                "technical_setup": quality_evaluation["components"]["technical_setup"],
                "risk_reward": quality_evaluation["components"]["risk_reward"]
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(request: AnalysisRequest):
    """Train the ML model with provided candles"""
    try:
        candles_data = [
            {
                "timestamp": c.timestamp,
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
                "openTime": c.openTime,
                "closeTime": c.closeTime
            }
            for c in request.candles
        ]
        
        if model.train(candles_data):
            model.save()
            return {"status": "Model trained successfully"}
        else:
            raise HTTPException(status_code=400, detail="Training failed")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
