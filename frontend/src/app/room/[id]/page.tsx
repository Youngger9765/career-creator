'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRoomStore } from '@/stores/room-store';
import { ConsultationArea } from '@/components/ConsultationArea';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;

  // 基本狀態
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 檢查是否為訪客
  const isVisitor = searchParams.get('visitor') === 'true';
  const visitorName = searchParams.get('name') || '';

  // 取得認證狀態
  const { user, isAuthenticated } = useAuthStore();

  // 取得房間狀態
  const { currentRoom, isLoading: roomLoading, error: roomError, joinRoom } = useRoomStore();

  // 簡單的認證檢查
  useEffect(() => {
    // 訪客直接通過
    if (isVisitor) {
      setIsChecking(false);
      setIsReady(true);
      return;
    }

    // 檢查 localStorage 有沒有 token
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      // 沒有 token，導向登入頁
      router.push('/');
      return;
    }

    // 如果有 token 但 store 還沒載入，手動設定
    if (token && userStr && !isAuthenticated) {
      try {
        const userData = JSON.parse(userStr);
        // 手動更新 auth store
        useAuthStore.setState({
          user: userData,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // 等待一下確保 store 更新
    setTimeout(() => {
      setIsChecking(false);
      setIsReady(true);
    }, 100);
  }, [isVisitor, router, isAuthenticated]);

  // 加入房間
  useEffect(() => {
    if (!isReady) return;

    // 呼叫加入房間 API
    joinRoom(roomId).catch((error) => {
      console.error('Failed to join room:', error);
      setErrorMessage('無法加入房間');
    });
  }, [isReady, roomId, joinRoom]);

  // 顯示檢查中的狀態
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">檢查認證狀態...</p>
        </div>
      </div>
    );
  }

  // 顯示加入房間中
  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加入房間...</p>
        </div>
      </div>
    );
  }

  // 檢查是否為諮詢師
  const isCounselor = user?.roles?.includes('counselor') || user?.roles?.includes('admin');

  // Debug 資訊
  console.log('User roles:', user?.roles);
  console.log('Is counselor:', isCounselor);
  console.log('Is visitor:', isVisitor);
  console.log('Will be read-only:', !isCounselor && !isVisitor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 頂部標題欄 */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-800">
              ← 返回
            </button>

            {currentRoom && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">{currentRoom.name}</h1>
                {currentRoom.description && (
                  <p className="text-sm text-gray-600">{currentRoom.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {isVisitor ? `訪客: ${visitorName}` : `${user?.name} (${user?.roles?.join(', ')})`}
            </div>
            {currentRoom && (
              <div className="text-sm text-gray-500">分享碼: {currentRoom.share_code}</div>
            )}
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="p-6">
        {currentRoom ? (
          <ConsultationArea
            roomId={roomId}
            onCardEvent={(cardId, eventType, data) => {
              console.log('Card event:', cardId, eventType, data);
              // 之後這裡會加入 WebSocket 發送
            }}
            isReadOnly={!isCounselor && !isVisitor}
            performerInfo={{
              id: isVisitor ? `visitor_${Date.now()}` : user?.id,
              name: isVisitor ? visitorName : user?.name,
              type: isVisitor ? 'visitor' : isCounselor ? 'counselor' : 'client',
            }}
            onClearAreaReady={(clearFn) => {
              // 儲存清空函數，但不會造成重新渲染
              console.log('Clear function ready');
            }}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">載入房間資訊中...</p>
          </div>
        )}
      </div>

      {(errorMessage || roomError) && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage || roomError}
        </div>
      )}
    </div>
  );
}
