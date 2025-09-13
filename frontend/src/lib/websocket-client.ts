/**
 * WebSocket Client for real-time communication
 * WebSocket 客戶端 - 即時通訊
 */
import { WebSocketMessage, CardEventMessage, ChatMessage, UserActionMessage } from '@/types/api';

type WebSocketEventHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private roomId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isConnecting: boolean = false;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000') {
    this.url = baseUrl;
  }

  async connect(
    roomId: string,
    userInfo: {
      user_id?: string;
      user_name?: string;
      user_type?: 'user' | 'visitor';
    }
  ): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    this.roomId = roomId;

    const params = new URLSearchParams();
    if (userInfo.user_id) params.append('user_id', userInfo.user_id);
    if (userInfo.user_name) params.append('user_name', userInfo.user_name);
    if (userInfo.user_type) params.append('user_type', userInfo.user_type);

    const wsUrl = `${this.url}/ws/room/${roomId}?${params.toString()}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected', { roomId });
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(roomId, userInfo);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
        reject(error);
      };
    });
  }

  private scheduleReconnect(
    roomId: string,
    userInfo: {
      user_id?: string;
      user_name?: string;
      user_type?: 'user' | 'visitor';
    }
  ) {
    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect(roomId, userInfo).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.roomId = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event subscription
  on(event: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private handleMessage(message: WebSocketMessage) {
    this.emit(message.type, message.data);

    // Handle specific message types
    switch (message.type) {
      case 'connected':
        this.emit('room_joined', message.data);
        break;
      case 'user_joined':
        this.emit('user_joined', message.data);
        break;
      case 'user_left':
        this.emit('user_left', message.data);
        break;
      case 'card_event_created':
        this.emit('card_event', message.data);
        break;
      case 'chat_message':
        this.emit('chat_message', message.data);
        break;
      case 'user_action':
        this.emit('user_action', message.data);
        break;
      case 'error':
        console.error('WebSocket server error:', message.data);
        break;
    }
  }

  // Send messages
  private send(message: WebSocketMessage) {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  sendCardEvent(eventData: CardEventMessage['data']) {
    this.send({
      type: 'card_event',
      data: eventData,
    });
  }

  sendChatMessage(message: string) {
    this.send({
      type: 'chat_message',
      data: { message },
    });
  }

  sendUserAction(actionData: UserActionMessage['data']) {
    this.send({
      type: 'user_action',
      data: actionData,
    });
  }

  sendHeartbeat() {
    this.send({
      type: 'heartbeat',
      data: { timestamp: new Date().toISOString() },
    });
  }
}

// Create and export a singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
