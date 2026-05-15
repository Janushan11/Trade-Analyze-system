import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple
import pickle
import os

class TradingModel:
    """ML Model for trading prediction"""
    
    def __init__(self, model_type: str = "random_forest"):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = f"models/{model_type}_model.pkl"
        self.scaler_path = f"models/{model_type}_scaler.pkl"
    
    def create_features(self, candles: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Create feature matrix from candles"""
        if len(candles) < 20:
            return np.array([]), np.array([])
        
        df = pd.DataFrame(candles)
        df = df.sort_values('timestamp')
        
        features = []
        
        # Calculate returns
        df['returns'] = df['close'].pct_change()
        
        # EMA indicators
        df['ema_10'] = df['close'].ewm(span=10).mean()
        df['ema_20'] = df['close'].ewm(span=20).mean()
        
        # RSI calculation
        df['rsi'] = self._calculate_rsi(df['close'].values, 14)
        
        # MACD
        df['macd'] = (df['close'].ewm(span=12).mean() - 
                     df['close'].ewm(span=26).mean())
        
        # Volatility
        df['volatility'] = df['returns'].rolling(window=10).std()
        
        # Volume SMA
        df['volume_sma'] = df['volume'].rolling(window=10).mean()
        
        # High-Low ratio
        df['hl_ratio'] = (df['high'] - df['low']) / df['close']
        
        # Create feature rows (exclude NaN values)
        feature_cols = ['returns', 'ema_10', 'ema_20', 'rsi', 'macd', 'volatility', 'volume_sma', 'hl_ratio']
        X = df[feature_cols].dropna().values
        
        # Create labels (1: up, 0: down) based on next candle
        y = (df['close'].shift(-1) > df['close']).dropna().astype(int).values[:-len(X)+len(df[feature_cols].dropna())]
        
        return X, y
    
    def train(self, candles: List[Dict]) -> bool:
        """Train the model"""
        X, y = self.create_features(candles)
        
        if len(X) < 10:
            print("Insufficient data for training")
            return False
        
        if self.model_type == "random_forest":
            self.model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        
        return True
    
    def predict(self, candles: List[Dict]) -> Dict:
        """Make prediction"""
        if self.model is None:
            return {"error": "Model not trained"}
        
        X, _ = self.create_features(candles)
        
        if len(X) == 0:
            return {"error": "Insufficient data"}
        
        X_scaled = self.scaler.transform(X[-1:])
        
        # Get prediction and probability
        prediction = self.model.predict(X_scaled)[0]
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        return {
            "prediction": "UP" if prediction == 1 else "DOWN",
            "up_probability": float(probabilities[1] * 100),
            "down_probability": float(probabilities[0] * 100),
            "confidence": float(max(probabilities) * 100)
        }
    
    @staticmethod
    def _calculate_rsi(prices, period=14):
        """Calculate RSI"""
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum() / period if period > 0 else 0
        down = -seed[seed < 0].sum() / period if period > 0 else 1
        rs = up / down if down != 0 else 0
        rsi = 100 - 100 / (1 + rs) if rs >= 0 else 50
        rsis = [rsi]
        
        for delta in deltas[period+1:]:
            up = up * (period - 1) / period + (delta if delta > 0 else 0) / period
            down = down * (period - 1) / period + (-delta if delta < 0 else 0) / period
            rs = up / down if down != 0 else 0
            rsi = 100 - 100 / (1 + rs) if rs >= 0 else 50
            rsis.append(rsi)
        
        return np.array([rsis[-1]] * len(prices)) if len(rsis) > 0 else np.full(len(prices), 50)
    
    def save(self):
        """Save model and scaler"""
        os.makedirs("models", exist_ok=True)
        if self.model:
            pickle.dump(self.model, open(self.model_path, "wb"))
            pickle.dump(self.scaler, open(self.scaler_path, "wb"))
    
    def load(self) -> bool:
        """Load model and scaler"""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = pickle.load(open(self.model_path, "rb"))
            self.scaler = pickle.load(open(self.scaler_path, "rb"))
            return True
        return False
