import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import API_BASE_URL from '../config';

/**
 * Singleton WebSocket service using STOMP over SockJS.
 *
 * Usage:
 *   import websocketService from '../services/websocket';
 *
 *   // Connect once (e.g. after login)
 *   websocketService.connect();
 *
 *   // Subscribe to a topic — returns an unsubscribe function
 *   const unsub = websocketService.subscribe('/topic/tables/<uuid>', (msg) => { ... });
 *
 *   // Later
 *   unsub();
 *
 *   // Disconnect (e.g. on logout)
 *   websocketService.disconnect();
 */

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();   // id → StompSubscription
    this.pendingSubscriptions = [];   // queued before connection is ready
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000; // ms
  }

  /**
   * Establish the STOMP connection.
   */
  connect() {
    if (this.client?.connected) {
      console.log('[WS] Already connected');
      return;
    }

    const wsUrl = `${API_BASE_URL}/ws`;

    this.client = new Client({
      // SockJS factory – required for browsers that don't support native WS or
      // when the server uses SockJS (like our Spring backend)
      webSocketFactory: () => new SockJS(wsUrl),

      reconnectDelay: this.reconnectDelay,

      // Debug logging (comment out in production)
      // debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('[WS] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Flush any subscriptions that were requested before the connection was ready
        this.pendingSubscriptions.forEach(({ destination, callback, id }) => {
          this._doSubscribe(destination, callback, id);
        });
        this.pendingSubscriptions = [];
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame.headers['message'], frame.body);
      },

      onDisconnect: () => {
        console.log('[WS] Disconnected');
        this.connected = false;
      },

      onWebSocketClose: () => {
        this.connected = false;
        this.reconnectAttempts += 1;
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          console.warn('[WS] Max reconnect attempts reached');
        }
      },
    });

    this.client.activate();
  }

  /**
   * Subscribe to a STOMP destination.
   *
   * @param {string}   destination  e.g. '/topic/tables/abc-123'
   * @param {function} callback     receives the parsed JSON body
   * @returns {function} unsubscribe
   */
  subscribe(destination, callback) {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (this.connected && this.client?.connected) {
      this._doSubscribe(destination, callback, id);
    } else {
      // Queue it – will be flushed once connected
      this.pendingSubscriptions.push({ destination, callback, id });
      // Ensure we attempt to connect
      if (!this.client) this.connect();
    }

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /** @private */
  _doSubscribe(destination, callback, id) {
    const sub = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        console.error('[WS] Failed to parse message', e);
        callback(message.body);
      }
    }, { id });

    this.subscriptions.set(id, sub);
  }

  /**
   * Unsubscribe by subscription id.
   */
  unsubscribe(id) {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(id);
    }
    // Also remove from pending
    this.pendingSubscriptions = this.pendingSubscriptions.filter((p) => p.id !== id);
  }

  /**
   * Disconnect and clean up all subscriptions.
   */
  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.pendingSubscriptions = [];
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      console.log('[WS] Disconnected and cleaned up');
    }
  }

  /**
   * Check if currently connected.
   */
  isConnected() {
    return this.connected && this.client?.connected;
  }
}

// Export singleton
const websocketService = new WebSocketService();
export default websocketService;
