/**
 * Frontend Socket.io Service for Pattern Matching
 * Handles real-time communication with backend for pattern updates
 */

import io from 'socket.io-client';

class PatternSocketService {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.isConnected = false;
    this.subscriptions = new Set();
    this.listeners = {
      'pattern-match': [],
      'pattern-check-results': [],
      'subscription-confirmed': [],
      'error': []
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('[PatternSocket] Connected to server');
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[PatternSocket] Connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('[PatternSocket] Disconnected from server');
    }
  }

  /**
   * Subscribe to pattern updates for a symbol
   */
  subscribeToSymbol(symbol) {
    if (!this.socket || !this.isConnected) {
      console.warn('[PatternSocket] Not connected. Cannot subscribe to', symbol);
      return false;
    }

    this.socket.emit('subscribe-pattern-updates', { symbol });
    this.subscriptions.add(symbol);
    console.log(`[PatternSocket] Subscribed to ${symbol} pattern updates`);
    return true;
  }

  /**
   * Unsubscribe from pattern updates for a symbol
   */
  unsubscribeFromSymbol(symbol) {
    if (!this.socket) return false;

    this.socket.emit('unsubscribe-pattern-updates', { symbol });
    this.subscriptions.delete(symbol);
    console.log(`[PatternSocket] Unsubscribed from ${symbol} pattern updates`);
    return true;
  }

  /**
   * Request manual pattern check
   */
  checkPatterns(symbol, liveCandles) {
    if (!this.socket || !this.isConnected) {
      console.warn('[PatternSocket] Not connected. Cannot check patterns.');
      return false;
    }

    this.socket.emit('check-patterns', { symbol, liveCandles });
    return true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Pattern match detected
    this.socket.on('pattern-match', (data) => {
      console.log('[PatternSocket] Pattern match received:', data);
      this.emit('pattern-match', data);
    });

    // Pattern check results
    this.socket.on('pattern-check-results', (data) => {
      console.log('[PatternSocket] Pattern check results:', data);
      this.emit('pattern-check-results', data);
    });

    // Subscription confirmed
    this.socket.on('subscription-confirmed', (data) => {
      console.log('[PatternSocket] Subscription confirmed:', data);
      this.emit('subscription-confirmed', data);
    });

    // Error
    this.socket.on('error', (data) => {
      console.error('[PatternSocket] Error:', data);
      this.emit('error', data);
    });

    // Reconnection
    this.socket.on('reconnect', () => {
      console.log('[PatternSocket] Reconnected to server');
      // Resubscribe to previous subscriptions
      this.subscriptions.forEach(symbol => {
        this.subscribeToSymbol(symbol);
      });
    });
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PatternSocket] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      subscriptions: Array.from(this.subscriptions)
    };
  }

  /**
   * Get subscribed symbols
   */
  getSubscribedSymbols() {
    return Array.from(this.subscriptions);
  }
}

export default PatternSocketService;
