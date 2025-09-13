'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConsultationArea } from '@/components/ConsultationArea';
import { useRoomStore } from '@/stores/room-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useCardEvents } from '@/hooks/use-card-events';
import { CardEventType } from '@/types/api';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const { user, isAuthenticated } = useAuthStore();
  const { currentRoom, isLoading, error, joinRoom } = useRoomStore();
  const [isJoining, setIsJoining] = useState(false);

  // WebSocket connection
  const {
    isConnected,
    sendCardEvent,
    connect: connectWebSocket,
    on: onWebSocketEvent
  } = useWebSocket({
    roomId,
    userInfo: {
      user_id: user?.id,
      user_name: user?.name,
      user_type: 'user'
    },
    autoConnect: false // We'll connect after joining the room
  });

  // Card events management
  const {
    events,
    handleRealtimeEvent,
    loadEvents
  } = useCardEvents({
    roomId,
    realtime: true
  });

  // Join room on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const joinRoomAsync = async () => {
      setIsJoining(true);
      try {
        await joinRoom(roomId);
        // Connect WebSocket after successfully joining the room
        await connectWebSocket();
      } catch (error) {
        console.error('Failed to join room:', error);
      } finally {
        setIsJoining(false);
      }
    };

    joinRoomAsync();
  }, [roomId, isAuthenticated, joinRoom, router, connectWebSocket]);

  // Set up WebSocket event listeners
  useEffect(() => {
    const cleanup = onWebSocketEvent('card_event', (eventData: any) => {
      handleRealtimeEvent(eventData);
    });

    return cleanup;
  }, [onWebSocketEvent, handleRealtimeEvent]);

  // Load initial events when room is ready
  useEffect(() => {
    if (currentRoom) {
      loadEvents();
    }
  }, [currentRoom, loadEvents]);

  // Handle card events from the consultation area
  const handleCardEvent = (cardId: string, eventType: CardEventType, data?: any) => {
    // Send via WebSocket for real-time sync
    sendCardEvent({
      event_type: eventType,
      card_id: cardId,
      event_data: data,
      performer_id: user?.id,
      performer_name: user?.name,
      performer_type: 'user'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">請先登入</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            前往登入頁面
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">正在加入房間...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">無法加入房間</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">找不到房間</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Room Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-800">{currentRoom.name}</h1>
              {currentRoom.description && (
                <p className="text-sm text-gray-600">{currentRoom.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{isConnected ? '已連線' : '未連線'}</span>
            </div>

            {/* Share Code */}
            <div className="text-sm text-gray-600">
              分享碼: <span className="font-mono font-bold text-blue-600">{currentRoom.share_code}</span>
            </div>

            {/* User Info */}
            <div className="text-sm text-gray-600">
              {user?.name} ({user?.roles.join(', ')})
            </div>
          </div>
        </div>
      </div>

      {/* Main Consultation Area */}
      <div className="pt-20">
        <ConsultationArea
          roomId={roomId}
          onCardEvent={handleCardEvent}
          isReadOnly={!user?.roles.includes('counselor') && !user?.roles.includes('admin')}
        />
      </div>

      {/* Events Panel (floating) */}
      <div className="fixed bottom-4 left-4 w-80 max-h-60 history-panel z-30 overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">操作歷史</h3>
        </div>
        <div className="p-3 overflow-y-auto max-h-40">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">尚無操作記錄</p>
          ) : (
            <div className="space-y-2">
              {events.slice(-5).reverse().map((event) => (
                <div key={event.id} className="history-item text-xs text-gray-600 bg-gray-50 rounded">
                  <div className="font-medium">{event.performer_name || '未知用戶'}</div>
                  <div>{event.event_type} {event.card_id && `- ${event.card_id}`}</div>
                  <div className="text-gray-500">{new Date(event.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}