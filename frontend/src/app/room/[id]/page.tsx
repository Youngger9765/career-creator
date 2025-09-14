'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ConsultationArea } from '@/components/ConsultationArea';
import QRCodeModal from '@/components/QRCodeModal';
import { GameSessionPanel } from '@/components/GameSessionPanel';
import { useRoomStore } from '@/stores/room-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useCardEvents } from '@/hooks/use-card-events';
import { CardEventType } from '@/lib/api/card-events';
import { roomsAPI } from '@/lib/api/rooms';

interface Participant {
  id: string;
  name: string;
  type: 'counselor' | 'visitor' | 'client';
  joinedAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;

  // Check if this is a visitor session
  const isVisitor = searchParams.get('visitor') === 'true';
  const visitorName = searchParams.get('name') || '';

  const { user, isAuthenticated } = useAuthStore();
  const { currentRoom, isLoading, error, joinRoom } = useRoomStore();
  const [isJoining, setIsJoining] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clearAreaCallback, setClearAreaCallback] = useState<(() => void) | null>(null);

  // WebSocket connection
  const {
    isConnected,
    sendCardEvent,
    connect: connectWebSocket,
    on: onWebSocketEvent,
  } = useWebSocket({
    roomId,
    userInfo: {
      user_id: user?.id || `visitor_${Date.now()}`,
      user_name: isVisitor ? visitorName : user?.name,
      user_type: isVisitor ? 'visitor' : 'user',
    },
    autoConnect: false, // We'll connect after joining the room
  });

  // Card events management
  const { events, handleRealtimeEvent, loadEvents } = useCardEvents({
    roomId,
    realtime: true,
  });

  // Join room on mount
  useEffect(() => {
    if (!isAuthenticated && !isVisitor) {
      router.push('/');
      return;
    }

    if (isJoining) {
      return; // Prevent multiple join attempts
    }

    const joinRoomAsync = async () => {
      setIsJoining(true);
      try {
        await joinRoom(roomId);
        // Connect WebSocket after successfully joining the room
        await connectWebSocket();

        // Add self to participants
        const participant: Participant = {
          id: isVisitor ? `visitor_${Date.now()}` : user?.id || '',
          name: isVisitor ? visitorName : user?.name || '',
          type: isVisitor ? 'visitor' : user?.roles.includes('counselor') ? 'counselor' : 'client',
          joinedAt: new Date().toISOString(),
        };
        setParticipants([participant]);
      } catch (error) {
        console.error('Failed to join room:', error);
      } finally {
        setIsJoining(false);
      }
    };

    joinRoomAsync();
    // Remove joinRoom and connectWebSocket from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isAuthenticated, isVisitor]);

  // Set up WebSocket event listeners
  useEffect(() => {
    const cleanup = onWebSocketEvent('card_event', (eventData: any) => {
      handleRealtimeEvent(eventData);
    });

    // Listen for participant join/leave events
    const cleanupJoin = onWebSocketEvent('participant_joined', (data: any) => {
      const newParticipant: Participant = {
        id: data.user_id,
        name: data.user_name,
        type: data.user_type === 'visitor' ? 'visitor' : 'counselor',
        joinedAt: new Date().toISOString(),
      };
      setParticipants((prev) => [
        ...prev.filter((p) => p.id !== newParticipant.id),
        newParticipant,
      ]);
    });

    const cleanupLeave = onWebSocketEvent('participant_left', (data: any) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.user_id));
    });

    return () => {
      cleanup();
      cleanupJoin();
      cleanupLeave();
    };
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
      performer_id: isVisitor ? `visitor_${Date.now()}` : user?.id,
      performer_name: isVisitor ? visitorName : user?.name,
      performer_type: isVisitor ? 'visitor' : 'user',
    });
  };

  const handleClearArea = () => {
    if (clearAreaCallback) {
      if (confirm('確定要清空所有牌卡嗎？此操作無法復原。')) {
        clearAreaCallback();
        // Send clear event via WebSocket
        sendCardEvent({
          event_type: CardEventType.AREA_CLEARED,
          card_id: 'all',
          event_data: { cleared_by: isVisitor ? visitorName : user?.name },
          performer_id: isVisitor ? `visitor_${Date.now()}` : user?.id,
          performer_name: isVisitor ? visitorName : user?.name,
          performer_type: isVisitor ? 'visitor' : 'user',
        });
      }
    }
  };

  const handleCloseRoom = async () => {
    if (!currentRoom || !isCounselor) return;

    if (confirm('確定要結束這個房間嗎？房間將會關閉，所有人將無法繼續操作。')) {
      try {
        await roomsAPI.closeRoom(currentRoom.id);
        alert('房間已結束');
        router.push('/dashboard');
      } catch (error) {
        console.error('Failed to close room:', error);
        alert('結束房間失敗，請重試');
      }
    }
  };

  const copyShareLink = async () => {
    if (!currentRoom) return;
    const shareLink = roomsAPI.generateShareLink(currentRoom.share_code);
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('分享連結已複製到剪貼簿！');
    } catch (err) {
      alert(`分享連結：${shareLink}`);
    }
  };

  const isCounselor = user?.roles.includes('counselor') || user?.roles.includes('admin');

  if (!isAuthenticated && !isVisitor) {
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
            <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
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
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span>{isConnected ? '已連線' : '未連線'}</span>
            </div>

            {/* Action Buttons */}
            {isCounselor && (
              <>
                <button
                  onClick={handleClearArea}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                  title="清空畫面"
                >
                  清空
                </button>
                <button
                  onClick={handleCloseRoom}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  title="結束房間"
                >
                  結束房間
                </button>
              </>
            )}

            <button
              onClick={copyShareLink}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              title="複製分享連結"
            >
              分享
            </button>

            <button
              onClick={() => setShowQRCode(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              title="顯示 QR Code"
            >
              QR Code
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              title="參與者列表"
            >
              參與者 ({participants.length})
            </button>

            {/* User Info */}
            <div className="text-sm text-gray-600">
              {isVisitor ? `${visitorName} (訪客)` : `${user?.name} (${user?.roles.join(', ')})`}
            </div>
          </div>
        </div>
      </div>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="absolute top-20 right-6 w-64 bg-white rounded-lg shadow-lg z-40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">參與者列表</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium text-gray-800">{participant.name}</div>
                  <div className="text-xs text-gray-500">
                    {participant.type === 'counselor'
                      ? '諮詢師'
                      : participant.type === 'visitor'
                        ? '訪客'
                        : '客戶'}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(participant.joinedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Consultation Area */}
      <div className="pt-20">
        <ConsultationArea
          roomId={roomId}
          onCardEvent={handleCardEvent}
          isReadOnly={!isCounselor && !isVisitor}
          performerInfo={{
            id: isVisitor ? `visitor_${Date.now()}` : user?.id,
            name: isVisitor ? visitorName : user?.name,
            type: isVisitor
              ? 'visitor'
              : user?.roles.includes('counselor')
                ? 'counselor'
                : 'client',
          }}
          onClearAreaReady={(clearFn: () => void) => setClearAreaCallback(() => clearFn)}
        />
      </div>

      {/* Game Session Panel (floating top-right) */}
      <div className="fixed top-24 right-4 w-96 z-30">
        <GameSessionPanel roomId={roomId} isCounselor={isCounselor || false} />
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
              {events
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="history-item text-xs text-gray-600 bg-gray-50 rounded"
                  >
                    <div className="font-medium">{event.performer_name || '未知用戶'}</div>
                    <div>
                      {event.event_type} {event.card_id && `- ${event.card_id}`}
                    </div>
                    <div className="text-gray-500">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && currentRoom && (
        <QRCodeModal room={currentRoom} isOpen={showQRCode} onClose={() => setShowQRCode(false)} />
      )}
    </div>
  );
}
