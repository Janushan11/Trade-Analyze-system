const WebSocket = require('ws');
const Candle = require('../models/Candle');
const axios = require('axios');

class BinanceWebSocket {
  constructor(io) {
    this.io = io;
    this.subscriptions = new Map();
    this.candles = new Map();
  }

  subscribe(symbol, timeframe = '1m') {
    const key = `${symbol}:${timeframe}`;
    
    if (this.subscriptions.has(key)) {
      return;
    }

    const streamName = `${symbol.toLowerCase()}@kline_${timeframe}`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.k) {
          this.handleCandleUpdate(symbol, timeframe, message.k);
        }
      } catch (error) {
        console.error('Error parsing Binance message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${key}:`, error);
    });

    ws.on('close', () => {
      console.log(`WebSocket closed for ${key}`);
      this.subscriptions.delete(key);
    });

    this.subscriptions.set(key, ws);
  }

  unsubscribe(symbol, timeframe = '1m') {
    const key = `${symbol}:${timeframe}`;
    const ws = this.subscriptions.get(key);
    
    if (ws) {
      ws.close();
      this.subscriptions.delete(key);
    }
  }

  async handleCandleUpdate(symbol, timeframe, klineData) {
    const candle = {
      symbol,
      timeframe,
      timestamp: new Date(klineData.T),
      openTime: klineData.t,
      closeTime: klineData.T,
      open: parseFloat(klineData.o),
      high: parseFloat(klineData.h),
      low: parseFloat(klineData.l),
      close: parseFloat(klineData.c),
      volume: parseFloat(klineData.v),
      quoteVolume: parseFloat(klineData.q),
      trades: klineData.n,
      takerBuyBaseAssetVolume: parseFloat(klineData.V),
      takerBuyQuoteAssetVolume: parseFloat(klineData.Q)
    };

    // Save to MongoDB
    try {
      await Candle.findOneAndUpdate(
        { symbol, timeframe, openTime: klineData.t },
        candle,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving candle:', error);
    }

    // Emit to connected clients
    this.io.to(`chart:${symbol}`).emit('candle-update', candle);

    // Send to Python AI engine for analysis
    await this.sendToPythonEngine(symbol, timeframe);
  }

  async sendToPythonEngine(symbol, timeframe) {
    try {
      // Get last 100 candles for analysis
      const candles = await Candle.find({ symbol, timeframe })
        .sort({ timestamp: -1 })
        .limit(100);

      if (candles.length >= 10) {
        // Call Python AI engine
        const response = await axios.post(
          `${process.env.PYTHON_API_URL}/analyze`,
          {
            symbol,
            candles: candles.reverse(),
            timeframe
          },
          { timeout: 5000 }
        );

        // Emit analysis results
        if (response.data) {
          this.io.to(`chart:${symbol}`).emit('analysis-result', response.data);
        }
      }
    } catch (error) {
      console.error('Error sending to Python engine:', error.message);
    }
  }

  closeAll() {
    for (const [key, ws] of this.subscriptions) {
      ws.close();
    }
    this.subscriptions.clear();
  }
}

module.exports = BinanceWebSocket;
