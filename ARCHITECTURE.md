# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Dashboard  │ Live Analysis │ Analytics │ Settings        │  │
│  │                                                           │  │
│  │  Real-time Chart │ Signal Panel │ Prediction Display    │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP + WebSocket
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST API Routes                                         │  │
│  │  - /api/signals                                          │  │
│  │  - /api/predictions                                      │  │
│  │  - /api/analytics                                        │  │
│  │  - /api/health                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebSocket Server (Socket.io)                            │  │
│  │  - Real-time data streaming                              │  │
│  │  - Signal broadcasting                                   │  │
│  │  - Event handling                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic                                          │  │
│  │  - Data aggregation                                      │  │
│  │  - Signal generation                                     │  │
│  │  - Analytics computation                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────┬────────────────────────┬──────────────────────┬──────────┘
       │                        │                      │
       ↓                        ↓                      ↓
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  BINANCE        │  │  DATABASE        │  │   AI ENGINE      │
│  WebSocket      │  │  (MongoDB)       │  │  (Python/FastAPI)│
│                 │  │                  │  │                  │
│ - Kline stream  │  │ - Candles        │  │ - SMC Analysis   │
│ - 1-minute data │  │ - Signals        │  │ - QM Detection   │
│ - Real-time     │  │ - Predictions    │  │ - ML Prediction  │
│   candlesticks  │  │ - Analytics      │  │ - Indicators     │
│                 │  │                  │  │                  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

## Data Flow

```
1. BINANCE WebSocket Stream
   ↓
2. Backend receives kline data
   ↓
3. Save to MongoDB (Candles collection)
   ↓
4. Send to AI Engine for analysis
   ↓
5. AI Engine:
   - SMC Pattern Detection
   - QM Pattern Recognition
   - Technical Indicators Calculation
   - ML Prediction
   ↓
6. Return analysis result
   ↓
7. Generate Signal (BUY/SELL/HOLD)
   ↓
8. Save Signal to MongoDB
   ↓
9. Emit via WebSocket to Frontend
   ↓
10. Frontend updates chart and displays signal
```

## Component Interaction

### Frontend
- `Dashboard`: Overview of all symbols and signals
- `LiveAnalysis`: Real-time chart and analysis for selected symbol
- `Analytics`: Historical prediction accuracy and performance
- `TradeHistory`: Complete signal history with details
- `Settings`: User preferences and symbol selection

### Backend Services
- **BinanceWebSocket**: Connects to Binance, receives candle data
- **AnalysisService**: Sends data to AI engine and processes results
- **SignalGenerator**: Creates trading signals based on AI analysis
- **AnalyticsCompute**: Calculates metrics and statistics

### AI Engine
- **SMCAnalyzer**: Detects BOS, CHOCH, Liquidity Sweeps, Order Blocks, FVG
- **QuasimodroAnalyzer**: Identifies QM patterns and entry/exit zones
- **TechnicalIndicators**: Calculates EMA, RSI, MACD, Bollinger Bands, ATR, etc.
- **TradingModel**: ML prediction using Random Forest classifier
- **IndicatorCalculator**: Supporting calculations for all technical indicators

### Database Collections

```
signals
├── symbol (BTCUSDT)
├── type (BUY/SELL/HOLD)
├── confidence (0-100)
├── patterns (detected patterns)
├── riskLevel (LOW/MEDIUM/HIGH)
└── timestamps

predictions
├── symbol
├── timestamp
├── upProbability
├── downProbability
├── confidence
├── indicators (all calculated values)
├── accuracy
└── result

candles
├── symbol
├── timestamp
├── open, high, low, close
├── volume
└── technical data
```

## Communication Protocols

### HTTP REST API
- GET /api/signals/latest
- GET /api/predictions/:symbol/history
- GET /api/analytics/dashboard
- POST /api/signals (internal)

### WebSocket (Socket.io)
- Client: subscribe to symbol
- Server: emit candle-update
- Server: emit analysis-result
- Server: emit signal-generated

### Inter-service HTTP
- Backend → AI Engine: POST /analyze
- Backend ← AI Engine: Analysis result JSON

## Deployment Architecture

### Development
- All services on localhost
- MongoDB local instance
- Real-time hot reloading

### Production
- Containerized with Docker
- Load balancing (Nginx)
- Managed MongoDB (Atlas)
- CDN for frontend assets
- Reverse proxy for APIs

## Security Layers

1. **Frontend**: HTTPS only
2. **Backend**: CORS, Rate limiting, Input validation
3. **AI Engine**: Request validation, Timeout handling
4. **Database**: Authentication, SSL/TLS
5. **Network**: Firewall, VPN (for private infrastructure)

## Scalability Considerations

- Horizontal scaling: Multiple backend instances
- Load balancing: Distribute WebSocket connections
- Caching: Redis for prediction cache
- Message queue: RabbitMQ for analysis jobs
- Database indexing: Optimized queries

---

See SETUP.md for implementation details and deployment instructions.
