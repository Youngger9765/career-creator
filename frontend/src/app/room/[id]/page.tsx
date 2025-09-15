'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRoomStore } from '@/stores/room-store';
import { ConsultationAreaNew } from '@/components/consultation/ConsultationAreaNew';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;

  // 基本狀態
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 牌卡和玩法選擇狀態
  const [selectedDeck, setSelectedDeck] = useState('職游旅人卡');
  const [selectedGameRule, setSelectedGameRule] = useState('六大性格分析');

  // 牌卡與可用玩法的映射關係
  const deckGameRuleMapping = {
    職游旅人卡: ['六大性格分析', '優劣勢分析'],
    職能盤點卡: ['優劣勢分析'],
    價值導航卡: ['價值觀排序', '優劣勢分析'],
  };

  // 根據選擇的牌卡，取得可用玩法
  const getAvailableGameRules = (deck: string) => {
    return deckGameRuleMapping[deck as keyof typeof deckGameRuleMapping] || [];
  };

  // 當牌卡改變時，檢查當前玩法是否還可用
  const handleDeckChange = (newDeck: string) => {
    setSelectedDeck(newDeck);
    const availableRules = getAvailableGameRules(newDeck);
    if (!availableRules.includes(selectedGameRule)) {
      setSelectedGameRule(availableRules[0] || '優劣勢分析');
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 頂部標題欄 */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
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

            {/* 牌卡選擇和玩法選擇 */}
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">牌卡選擇</label>
                <select
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDeck}
                  onChange={(e) => handleDeckChange(e.target.value)}
                >
                  <option value="職游旅人卡">職游旅人卡</option>
                  <option value="職能盤點卡">職能盤點卡</option>
                  <option value="價值導航卡">價值導航卡</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">玩法選擇</label>
                <select
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedGameRule}
                  onChange={(e) => setSelectedGameRule(e.target.value)}
                >
                  {getAvailableGameRules(selectedDeck).map((rule) => (
                    <option key={rule} value={rule}>
                      {rule === '六大性格分析'
                        ? '性格分類'
                        : rule === '價值觀排序'
                          ? '價值排序'
                          : rule === '優劣勢分析'
                            ? '優劣分析'
                            : rule}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <ConsultationAreaNew
            roomId={roomId}
            isHost={isCounselor || false}
            gameMode={selectedGameRule as any}
            selectedDeck={selectedDeck as any}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
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
