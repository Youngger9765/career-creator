/**
 * WebSocket hook for React components
 * WebSocket React Hook
 */
import { useEffect, useRef, useState } from 'react';
import wsClient from '@/lib/websocket-client';
import { CardEventCreate, CardEventType } from '@/types/api';

interface UseWebSocketOptions {
  roomId: string;
  userInfo: {
    user_id?: string;
    user_name?: string;
    user_type?: 'user' | 'visitor';
  };
  autoConnect?: boolean;
}

export function useWebSocket({ roomId, userInfo, autoConnect = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const eventHandlersRef = useRef<Map<string, Function[]>>(new Map());

  const connect = async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      await wsClient.connect(roomId, userInfo);
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    wsClient.disconnect();
    setIsConnected(false);
  };

  const sendCardEvent = (eventData: Omit<CardEventCreate, 'room_id'>) => {
    wsClient.sendCardEvent({
      ...eventData,
      room_id: roomId,
    });
  };

  const sendChatMessage = (message: string) => {
    wsClient.sendChatMessage(message);
  };

  const sendUserAction = (action: string, data?: Record<string, any>) => {
    wsClient.sendUserAction({
      action,
      ...data,
    });
  };

  const on = (event: string, handler: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, []);
    }
    eventHandlersRef.current.get(event)!.push(handler);
    wsClient.on(event, handler as any);

    // Return cleanup function
    return () => {
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      wsClient.off(event, handler as any);
    };
  };

  useEffect(() => {
    // Set up connection state listeners
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleError = (error: any) => setError(error.message || 'WebSocket error');

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('error', handleError);

    // Auto-connect if requested
    if (autoConnect) {
      connect();
    }

    return () => {
      // Clean up event listeners
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      wsClient.off('error', handleError);

      // Clean up all custom event handlers
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          wsClient.off(event, handler as any);
        });
      });

      // Disconnect if still connected
      if (wsClient.isConnected()) {
        wsClient.disconnect();
      }
    };
  }, [roomId, userInfo.user_id, userInfo.user_name, userInfo.user_type, autoConnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendCardEvent,
    sendChatMessage,
    sendUserAction,
    on,
  };
}
