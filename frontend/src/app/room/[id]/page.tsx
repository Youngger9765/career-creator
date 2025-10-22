'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRoomStore } from '@/stores/room-store';
import { useGameSession } from '@/hooks/use-game-session';
import { useRoomParticipants } from '@/hooks/use-room-participants';
import { VisitorWelcome } from '@/components/visitor/VisitorWelcome';
import { ParticipantList } from '@/components/room/ParticipantList';
import { NotesDrawer } from '@/components/room/NotesDrawer';
import { MobileNotesModal } from '@/components/room/MobileNotesModal';
import GameModeIntegration from './GameModeIntegration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import { Camera } from 'lucide-react';
import { consultationRecordsAPI } from '@/lib/api/clients';
import { ConsultationRecord } from '@/types/client';

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
  const [visitorName, setVisitorName] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(true);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotMessage, setScreenshotMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [currentConsultationRecord, setCurrentConsultationRecord] =
    useState<ConsultationRecord | null>(null);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  // Game Session for state persistence
  const gameSession = useGameSession({
    roomId,
    autoLoad: true,
    gameRuleSlug: 'career_personality',
  });

  // 牌卡和玩法選擇狀態
  const [selectedDeck, setSelectedDeck] = useState('職游旅人卡');
  const [selectedGameRule, setSelectedGameRule] = useState('六大性格分析');

  // 測試新架構整合
  const [showNewArchitecture, setShowNewArchitecture] = useState(true);
  const [currentGameplay, setCurrentGameplay] = useState<string>('');

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
      六大性格分析: 'personality_assessment',
      優劣勢分析: 'skill_assessment',
      價值觀排序: 'value_ranking',
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

  // 取得諮詢室狀態
  const { currentRoom, isLoading: roomLoading, error: roomError, joinRoom } = useRoomStore();

  // 檢查是否為諮詢師
  const isCounselor = user?.roles?.includes('counselor') || user?.roles?.includes('admin');

  // 使用 useRoomParticipants hook 追蹤參與者
  // IMPORTANT: Use useMemo to prevent re-creating object on every render
  const currentUserInfo = useMemo(() => {
    if (!isReady) return undefined;
    return {
      id: user?.id || (isVisitor ? `visitor-${visitorName || urlVisitorName}` : 'current-user'),
      name: isVisitor ? visitorName || urlVisitorName : user?.name || 'User',
      type: (isVisitor ? 'visitor' : isCounselor ? 'counselor' : 'user') as
        | 'counselor'
        | 'visitor'
        | 'user',
    };
  }, [isReady, user?.id, user?.name, isVisitor, visitorName, urlVisitorName, isCounselor]);

  const {
    participants,
    participantCount,
    onlineCount,
    isLoading: participantsLoading,
    error: participantsError,
    refreshParticipants,
  } = useRoomParticipants({
    roomId,
    currentUser: currentUserInfo,
    updateInterval: 10000, // 10 seconds
    offlineThreshold: 60000, // 1 minute
  });

  // Debug log for participants (only on significant changes)
  useEffect(() => {
    if (participantCount > 0) {
      console.log('[RoomPage] Participants updated:', {
        count: participantCount,
        online: onlineCount,
        loading: participantsLoading,
      });
    }
  }, [participantCount, onlineCount, participantsLoading]);

  // 簡單的認證檢查
  useEffect(() => {
    // 訪客處理
    if (isVisitor) {
      if (urlVisitorName) {
        // URL 已有訪客名稱，直接使用
        setVisitorName(urlVisitorName);
        setIsChecking(false);
        setIsReady(true);
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
  }, [isVisitor, urlVisitorName, router, isAuthenticated]);

  // 加入諮詢室
  useEffect(() => {
    if (!isReady) return;

    // 呼叫加入諮詢室 API
    joinRoom(roomId).catch((error) => {
      console.error('Failed to join room:', error);
      setErrorMessage('無法加入諮詢室');
    });
  }, [isReady, roomId, joinRoom]);

  // 自動創建或獲取當天的 consultation record（僅諮詢師）
  useEffect(() => {
    if (!currentRoom || !isCounselor || !currentRoom.client_id) return;

    const initConsultationRecord = async () => {
      try {
        // 先嘗試獲取今天的記錄
        const records = await consultationRecordsAPI.getClientRecords(currentRoom.client_id!);
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = records.find((r) => r.session_date.startsWith(today));

        if (todayRecord) {
          setCurrentConsultationRecord(todayRecord);
          console.log('[Room] Found today consultation record:', todayRecord.id);
        } else {
          // 創建新的記錄
          const newRecord = await consultationRecordsAPI.createRecord(currentRoom.client_id!, {
            room_id: roomId,
            client_id: currentRoom.client_id!,
            session_date: new Date().toISOString(),
            topics: [],
            follow_up_required: false,
          });
          setCurrentConsultationRecord(newRecord);
          console.log('[Room] Created new consultation record:', newRecord.id);
        }
      } catch (error) {
        console.error('[Room] Failed to init consultation record:', error);
      }
    };

    initConsultationRecord();
  }, [currentRoom, isCounselor, roomId]);

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

  // 顯示加入諮詢室中
  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加入諮詢室...</p>
        </div>
      </div>
    );
  }

  // 只截圖畫布區域，返回 Blob（給 Mobile Modal 使用）
  const captureCanvasScreenshot = async (): Promise<Blob | null> => {
    if (!gameAreaRef.current) {
      throw new Error('找不到遊戲區域');
    }

    try {
      // Capture the game area using html2canvas
      const canvas = await html2canvas(gameAreaRef.current, {
        backgroundColor: '#f3f4f6',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('無法生成截圖'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  };

  // Mobile: 送出筆記 + 截圖（創建 consultation record）
  const handleMobileNotesSubmit = async (notes: string, screenshotBlob: Blob | null) => {
    if (!currentRoom?.client_id) {
      throw new Error('此諮詢室未關聯客戶，無法儲存記錄');
    }

    try {
      // 創建 consultation record
      const newRecord = await consultationRecordsAPI.createRecord(currentRoom.client_id, {
        room_id: roomId,
        client_id: currentRoom.client_id,
        game_rule_id: currentRoom.game_rule_id || undefined,
        session_date: new Date().toISOString(),
        game_state: {
          gameplay: currentGameplay || '',
        },
        topics: [],
        follow_up_required: false,
        notes: notes || undefined,
      });

      console.log('[Room] Created consultation record:', newRecord.id);

      // 如果有截圖，上傳
      if (screenshotBlob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File(
          [screenshotBlob],
          `consultation-${currentRoom?.name}-${timestamp}.png`,
          {
            type: 'image/png',
          }
        );

        await consultationRecordsAPI.uploadScreenshot(newRecord.id, file);
        console.log('[Room] Screenshot uploaded');
      }

      // 顯示成功訊息
      setScreenshotMessage({
        type: 'success',
        text: '記錄已儲存',
      });
      setTimeout(() => setScreenshotMessage(null), 3000);
    } catch (error) {
      console.error('[Room] Failed to save consultation record:', error);
      throw error;
    }
  };

  // Desktop: 舊的截圖處理（保留給 NotesDrawer 使用）
  const handleCaptureScreenshot = async (notes: string) => {
    if (!gameAreaRef.current) {
      setScreenshotMessage({
        type: 'error',
        text: '找不到遊戲區域',
      });
      return;
    }

    setIsCapturingScreenshot(true);
    setScreenshotMessage(null);

    try {
      const blob = await captureCanvasScreenshot();
      await handleMobileNotesSubmit(notes, blob);
    } catch (error) {
      console.error('Screenshot error:', error);
      setScreenshotMessage({
        type: 'error',
        text: '截圖失敗，請稍後再試',
      });
      setTimeout(() => setScreenshotMessage(null), 3000);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* 頂部標題欄 - Fixed position */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
            {/* 退出按鈕 - 只在選擇遊戲模式時顯示 */}
            {!currentGameplay && (
              <button
                onClick={() => setShowExitDialog(true)}
                className="px-3 py-1.5 sm:py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">退出諮詢室</span>
                <span className="sm:hidden">退出</span>
              </button>
            )}

            {currentRoom && (
              <div className="flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                  {currentRoom.name}
                </h1>
                {currentRoom.description && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                    {currentRoom.description}
                  </p>
                )}
              </div>
            )}

            {/* 切換遊戲模式按鈕 - 僅諮詢師在已選擇遊戲時顯示 */}
            {isCounselor && showNewArchitecture && currentGameplay && (
              <>
                <button
                  onClick={() => setCurrentGameplay('')}
                  className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="hidden sm:inline">切換遊戲模式</span>
                  <span className="sm:hidden">切換</span>
                </button>
              </>
            )}

            {/* 參與者列表 */}
            <ParticipantList
              participants={participants as any}
              onlineCount={onlineCount}
              isLoading={participantsLoading}
              className="hidden sm:block"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4 w-full lg:w-auto text-xs sm:text-sm">
            <div className="text-gray-600 truncate max-w-full">
              {isVisitor
                ? `訪客: ${visitorName || urlVisitorName}`
                : `${user?.name} (${user?.roles?.join(', ')})`}
            </div>
            {currentRoom && (
              <div className="text-gray-500 hidden sm:block">分享碼: {currentRoom.share_code}</div>
            )}
            {/* 同步資訊圖標移到這裡 */}
            <div id="sync-status-container" className="relative"></div>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div
        ref={gameAreaRef}
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-300
          ${isCounselor && currentGameplay && notesDrawerOpen ? 'md:pr-96' : 'pr-0'}
        `}
      >
        <GameModeIntegration
          roomId={roomId}
          isVisitor={isVisitor}
          counselorId={isCounselor ? user?.id : undefined}
          onGameplayChange={setCurrentGameplay}
          currentGameplay={currentGameplay}
          onStateChange={(state) => {
            console.log('[Room] Game state changed:', state);
            // 可以在這裡更新 gameSession 或其他狀態
          }}
        />
      </div>

      {/* Notes Drawer - Only for counselors and only during gameplay */}
      {isCounselor && currentGameplay && (
        <div className="hidden md:block">
          <NotesDrawer
            roomId={roomId}
            clientId={currentRoom?.client_id}
            currentGameplay={currentGameplay}
            isOpen={notesDrawerOpen}
            onToggle={() => setNotesDrawerOpen(!notesDrawerOpen)}
            onCaptureScreenshot={handleCaptureScreenshot}
            isCapturingScreenshot={isCapturingScreenshot}
            screenshotMessage={screenshotMessage}
          />
        </div>
      )}

      {/* Mobile Notes Button - Only for counselors during gameplay */}
      {isCounselor && currentGameplay && (
        <button
          onClick={() => setMobileNotesOpen(true)}
          className="md:hidden fixed bottom-4 right-4 z-40 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          title="開始記錄"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="text-sm">記錄</span>
        </button>
      )}

      {/* Mobile Notes Modal */}
      {isCounselor && currentGameplay && (
        <MobileNotesModal
          isOpen={mobileNotesOpen}
          onClose={() => setMobileNotesOpen(false)}
          onSubmit={handleMobileNotesSubmit}
          onCapture={captureCanvasScreenshot}
          isSubmitting={isCapturingScreenshot}
        />
      )}

      {/* Error/Success Messages */}
      {(errorMessage || roomError) && (
        <div className="fixed bottom-4 left-4 md:bottom-4 md:right-4 md:left-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          {errorMessage || roomError}
        </div>
      )}

      {screenshotMessage && (
        <div
          className={`fixed bottom-20 right-4 md:bottom-4 px-4 py-3 rounded shadow-lg z-50 ${
            screenshotMessage.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {screenshotMessage.text}
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

          // Update URL to include visitor name
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('name', name);
          window.history.replaceState({}, '', newUrl.toString());
        }}
        onCancel={() => {
          router.push('/');
        }}
      />

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>確認退出諮詢室</DialogTitle>
            <DialogDescription>您確定要退出諮詢室嗎？未儲存的變更可能會遺失。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <button
              onClick={() => setShowExitDialog(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                setShowExitDialog(false);
                router.push('/dashboard');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              確認退出
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
