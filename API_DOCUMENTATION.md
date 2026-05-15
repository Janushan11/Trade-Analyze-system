# Trade Analyze - API Documentation

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **AI Engine API**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:5000`

## Authentication

Currently, the API is open (for development). In production, implement JWT authentication.

## API Endpoints

### Health Check

#### Backend Health
```
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-05-15T10:30:00Z",
  "uptime": 123.456
}
```

### Signals API

#### Get Latest Signals
```
GET /api/signals/latest?limit=10&symbol=BTCUSDT
```

Query Parameters:
- `limit` (optional): Number of signals to return (default: 10)
- `symbol` (optional): Filter by symbol (e.g., BTCUSDT)

Response:
```json
[
  {
    "_id": "objectId",
    "symbol": "BTCUSDT",
    "type": "BUY",
    "confidence": 85,
    "upProbability": 87,
    "downProbability": 13,
    "patterns": {
      "bos": true,
      "choch": true,
      "liquiditySweep": false,
      "qm": "BULLISH"
    },
    "riskLevel": "LOW",
    "trend": {
      "direction": "UP",
      "strength": 75
    },
    "entryPrice": 43500,
    "stopLoss": 43000,
    "takeProfit": 44500,
    "timeframe": "1m",
    "createdAt": "2024-05-15T10:30:00Z"
  }
]
```

#### Get Signals by Symbol
```
GET /api/signals/:symbol?limit=20
```

Path Parameters:
- `symbol`: Trading pair (e.g., BTCUSDT)

Query Parameters:
- `limit` (optional): Number of signals to return (default: 20)

Response: Same as above

#### Create Signal (Internal)
```
POST /api/signals
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "type": "BUY",
  "confidence": 85,
  "upProbability": 87,
  "downProbability": 13,
  "patterns": {
    "bos": true,
    "choch": true,
    "liquiditySweep": false,
    "orderBlock": true,
    "fvg": false,
    "qm": "BULLISH"
  },
  "riskLevel": "LOW",
  "trend": {
    "direction": "UP",
    "strength": 75
  },
  "entryPrice": 43500,
  "stopLoss": 43000,
  "takeProfit": 44500,
  "timeframe": "1m"
}
```

Response:
```json
{
  "_id": "objectId",
  "symbol": "BTCUSDT",
  ...
}
```

### Predictions API

#### Get Latest Predictions
```
GET /api/predictions/latest?limit=10&symbol=BTCUSDT
```

Query Parameters:
- `limit` (optional): Number of predictions to return (default: 10)
- `symbol` (optional): Filter by symbol

Response:
```json
[
  {
    "_id": "objectId",
    "symbol": "BTCUSDT",
    "timestamp": "2024-05-15T10:30:00Z",
    "upProbability": 85,
    "downProbability": 15,
    "confidence": 82,
    "trend": "UP",
    "trendStrength": 75,
    "indicators": {
      "ema": 43200,
      "rsi": 65,
      "macd": 125.5,
      "candleStructure": "STRONG_BODY",
      "volumeSpike": true,
      "volatility": 0.5
    },
    "accuracy": 82,
    "result": "CORRECT"
  }
]
```

#### Get Prediction History
```
GET /api/predictions/:symbol/history?days=7
```

Path Parameters:
- `symbol`: Trading pair

Query Parameters:
- `days` (optional): Number of days of history (default: 7)

Response: Array of predictions

#### Get Prediction Statistics
```
GET /api/predictions/:symbol/stats
```

Path Parameters:
- `symbol`: Trading pair

Response:
```json
{
  "total": 150,
  "correct": 123,
  "incorrect": 27,
  "accuracy": "82%",
  "winRatio": "4.56"
}
```

### Analytics API

#### Get Market Overview
```
GET /api/analytics/overview
```

Response:
```json
[
  {
    "symbol": "BTCUSDT",
    "price": 43500,
    "signal": "BUY",
    "confidence": 85,
    "prediction": 87
  },
  {
    "symbol": "ETHUSDT",
    "price": 2300,
    "signal": "SELL",
    "confidence": 72,
    "prediction": 68
  },
  {
    "symbol": "EURUSDT",
    "price": 1.095,
    "signal": "HOLD",
    "confidence": 55,
    "prediction": 52
  }
]
```

#### Get Dashboard Statistics
```
GET /api/analytics/dashboard?days=7
```

Query Parameters:
- `days` (optional): Number of days to analyze (default: 7)

Response:
```json
{
  "totalPredictions": 520,
  "correctPredictions": 425,
  "accuracy": "81.73%",
  "averageConfidence": "78.5",
  "timeframe": "Last 7 days"
}
```

## WebSocket Events

### Client Events

#### Subscribe to Symbol
```javascript
socket.emit('subscribe', {
  symbol: 'BTCUSDT',
  timeframe: '1m'
})
```

#### Unsubscribe from Symbol
```javascript
socket.emit('unsubscribe', {
  symbol: 'BTCUSDT'
})
```

### Server Events

#### Candle Update
```javascript
socket.on('candle-update', (candle) => {
  console.log({
    symbol: 'BTCUSDT',
    timestamp: '2024-05-15T10:30:00Z',
    open: 43400,
    high: 43600,
    low: 43300,
    close: 43500,
    volume: 125.5
  })
})
```

#### Analysis Result
```javascript
socket.on('analysis-result', (result) => {
  console.log({
    symbol: 'BTCUSDT',
    upProbability: 87,
    downProbability: 13,
    confidence: 85,
    trend: 'UP',
    patterns: { bos: true, qm: 'BULLISH' }
  })
})
```

## AI Engine API

### Analyze Candles
```
POST /analyze
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "timeframe": "1m",
  "candles": [
    {
      "timestamp": "2024-05-15T10:25:00Z",
      "open": 43400,
      "high": 43600,
      "low": 43300,
      "close": 43500,
      "volume": 125.5
    },
    ...
  ]
}
```

Response:
```json
{
  "symbol": "BTCUSDT",
  "timestamp": "2024-05-15T10:30:00Z",
  "upProbability": 87,
  "downProbability": 13,
  "confidence": 85,
  "trend": "UP",
  "trendStrength": 75,
  "patterns": {
    "bos": true,
    "choch": true,
    "liquiditySweep": false,
    "qm": "BULLISH"
  },
  "indicators": {
    "ema20": 43200,
    "rsi": 65,
    "macd": 125.5,
    "atr": 150,
    "volumeSpike": true
  },
  "riskLevel": "LOW"
}
```

### Train Model
```
POST /train
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "candles": [/* array of historical candles */]
}
```

Response:
```json
{
  "status": "Model trained successfully"
}
```

### AI Engine Health
```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-05-15T10:30:00Z",
  "model_loaded": true
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Need at least 10 candles"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message describing what went wrong"
}
```

## Rate Limiting

Currently no rate limiting. For production, consider:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

For list endpoints returning many items, implement pagination:

```
GET /api/signals/latest?page=1&limit=20
```

## Versioning

API endpoints may be versioned in the future:
```
GET /api/v1/signals/latest
```

## CORS Headers

Response includes:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Example Requests

### Get Signals Using cURL
```bash
curl http://localhost:5000/api/signals/latest?limit=10
```

### Get Predictions Using JavaScript
```javascript
const response = await fetch('http://localhost:5000/api/predictions/BTCUSDT/history?days=7')
const data = await response.json()
console.log(data)
```

### Analyze with Python Requests
```python
import requests

url = 'http://localhost:8000/analyze'
data = {
  'symbol': 'BTCUSDT',
  'timeframe': '1m',
  'candles': [...]
}
response = requests.post(url, json=data)
print(response.json())
```

## WebSocket Example
```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:5000')

socket.on('connect', () => {
  socket.emit('subscribe', { symbol: 'BTCUSDT', timeframe: '1m' })
})

socket.on('candle-update', (candle) => {
  console.log('New candle:', candle)
})

socket.on('analysis-result', (result) => {
  console.log('Analysis:', result)
})
```

---

**Last Updated**: May 15, 2024
