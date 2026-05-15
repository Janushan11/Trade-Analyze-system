const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/signals', require('./routes/signals'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/health', require('./routes/health'));

// WebSocket Events
const BinanceWebSocket = require('./services/binanceWebSocket');
const binanceWs = new BinanceWebSocket(io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribe', (data) => {
    const { symbol, timeframe } = data;
    binanceWs.subscribe(symbol, timeframe);
    socket.join(`chart:${symbol}`);
  });

  socket.on('unsubscribe', (data) => {
    const { symbol } = data;
    binanceWs.unsubscribe(symbol);
    socket.leave(`chart:${symbol}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export for use in other modules
app.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
