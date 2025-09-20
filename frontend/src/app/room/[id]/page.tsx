'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRoomStore } from '@/stores/room-store';
import { useGameSession } from '@/hooks/use-game-session';
import { ConsultationAreaNew } from '@/components/consultation/ConsultationAreaNew';
import { VisitorWelcome } from '@/components/visitor/VisitorWelcome';
import { VisitorGuidance } from '@/components/visitor/VisitorGuidance';
import { ParticipantList } from '@/components/room/ParticipantList';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;

  // 基本狀態
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showVisitorWelcome, setShowVisitorWelcome] = useState(false);
  const [showVisitorGuidance, setShowVisitorGuidance] = useState(false);
  const [visitorName, setVisitorName] = useState('');

  // Game Session for state persistence
  const gameSession = useGameSession({
    roomId,
    autoLoad: true,
    gameRuleSlug: 'career_personality',
  });

  // 牌卡和玩法選擇狀態
  const [selectedDeck, setSelectedDeck] = useState('職游旅人卡');
  const [selectedGameRule, setSelectedGameRule] = useState('六大性格分析');

  // 當 gameSession 載入後，更新本地狀態
  useEffect(() => {
    if (gameSession.gameState.selectedDeck) {
      setSelectedDeck(gameSession.gameState.selectedDeck);
    }
    if (gameSession.gameState.selectedGameRule) {
      setSelectedGameRule(gameSession.gameState.selectedGameRule);
    }
  }, [gameSession.gameState.selectedDeck, gameSession.gameState.selectedGameRule]);

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

  // 當牌卡改變時，總是選擇第一個可用玩法
  const handleDeckChange = (newDeck: string) => {
    const availableRules = getAvailableGameRules(newDeck);
    const newGameRule = availableRules[0] || '優劣勢分析';

    // 獲取遊戲模式映射
    const gameModeMapping: Record<string, string> = {
      六大性格分析: 'career_personality',
      優劣勢分析: 'skill_assessment',
      價值觀排序: 'value_navigation',
    };

    const gameMode = gameModeMapping[newGameRule] || 'career_personality';

    // 更新本地狀態
    setSelectedDeck(newDeck);
    setSelectedGameRule(newGameRule);

    // 更新 game session
    gameSession.updateGameMode(newDeck, newGameRule, gameMode);
  };

  // 檢查是否為訪客
  const isVisitor = searchParams.get('visitor') === 'true';
  const urlVisitorName = searchParams.get('name') || '';

  // 取得認證狀態
  const { user, isAuthenticated } = useAuthStore();

  // 取得房間狀態
  const { currentRoom, isLoading: roomLoading, error: roomError, joinRoom } = useRoomStore();

  // 檢查是否為諮詢師
  const isCounselor = user?.roles?.includes('counselor') || user?.roles?.includes('admin');

  // 簡單的參與者顯示 (暫時用靜態資料)
  const participants = [
    {
      id: user?.id || 'current-user',
      name: isVisitor ? visitorName || urlVisitorName : user?.name || 'User',
      type: isVisitor ? 'visitor' : isCounselor ? 'counselor' : 'user',
      initials: isVisitor
        ? (visitorName || urlVisitorName || 'V').substring(0, 2).toUpperCase()
        : (user?.name || 'U').substring(0, 2).toUpperCase(),
      lastActiveAt: new Date().toISOString(),
      isOnline: true,
    },
  ];
  const onlineCount = 1;
  const participantsLoading = false;

  // 簡單的認證檢查
  useEffect(() => {
    // 訪客處理
    if (isVisitor) {
      if (urlVisitorName) {
        // URL 已有訪客名稱，直接使用
        setVisitorName(urlVisitorName);
        setIsChecking(false);
        setIsReady(true);
        setShowVisitorGuidance(true);
      } else {
        // 沒有訪客名稱，顯示歡迎對話框
        setIsChecking(false);
        setShowVisitorWelcome(true);
      }
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
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {currentRoom.name}
                </h1>
                {currentRoom.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRoom.description}
                  </p>
                )}
              </div>
            )}

            {/* 牌卡選擇和玩法選擇 */}
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">牌組模式</label>
                <select
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDeck}
                  onChange={(e) => handleDeckChange(e.target.value)}
                >
                  <option value="職游旅人卡">職游旅人卡</option>
                  <option value="職能盤點卡">職能盤點卡</option>
                  <option value="價值導航卡">價值導航卡</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">玩法選擇</label>
                <select
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedGameRule}
                  onChange={(e) => {
                    const newGameRule = e.target.value;
                    // 獲取遊戲模式映射
                    const gameModeMapping: Record<string, string> = {
                      六大性格分析: 'career_personality',
                      優劣勢分析: 'skill_assessment',
                      價值觀排序: 'value_navigation',
                    };
                    const gameMode = gameModeMapping[newGameRule] || 'career_personality';

                    // 更新本地狀態
                    setSelectedGameRule(newGameRule);

                    // 更新 game session
                    gameSession.updateGameMode(selectedDeck, newGameRule, gameMode);
                  }}
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

            {/* 參與者列表 */}
            <ParticipantList
              participants={participants as any}
              onlineCount={onlineCount}
              isLoading={participantsLoading}
              className="ml-6"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {isVisitor
                ? `訪客: ${visitorName || urlVisitorName}`
                : `${user?.name} (${user?.roles?.join(', ')})`}
            </div>
            {isVisitor && (
              <button
                onClick={() => setShowVisitorGuidance(!showVisitorGuidance)}
                className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                {showVisitorGuidance ? '隱藏指引' : '顯示指引'}
              </button>
            )}
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
            gameSession={{
              updateCardPosition: gameSession.updateCardPosition,
              toggleCardFlip: gameSession.toggleCardFlip,
              getCardPosition: gameSession.getCardPosition,
              isCardFlipped: gameSession.isCardFlipped,
              resetGameState: gameSession.resetGameState,
            }}
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

      {/* Visitor Welcome Modal */}
      <VisitorWelcome
        isOpen={showVisitorWelcome}
        roomName={currentRoom?.name}
        onComplete={(name) => {
          setVisitorName(name);
          setShowVisitorWelcome(false);
          setIsReady(true);
          setShowVisitorGuidance(true);

          // Update URL to include visitor name
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('name', name);
          window.history.replaceState({}, '', newUrl.toString());
        }}
        onCancel={() => {
          router.push('/');
        }}
      />

      {/* Visitor Guidance Panel */}
      {isVisitor && (
        <VisitorGuidance
          gameMode={selectedGameRule}
          isVisible={showVisitorGuidance}
          onClose={() => setShowVisitorGuidance(false)}
        />
      )}
    </div>
  );
}
