/**
 * GameModeIntegration - 遊戲模式整合元件 (更新版)
 *
 * 使用獨立的遊戲組件，每個遊戲有自己的狀態管理
 * 透過 GameStateStore 實現狀態隔離和持久化
 * 整合 Supabase Broadcast 實現多用戶同步
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GameModeService } from '@/game-modes/services/mode.service';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import CombinedGameSelector from '@/game-modes/components/CombinedGameSelector';
import { useGameModeSync } from '@/hooks/use-game-mode-sync';
import { usePresence } from '@/hooks/use-presence';
import { DECK_TYPES, GAMEPLAY_IDS, GAMEPLAY_NAMES } from '@/constants/game-modes';

// 導入獨立的遊戲組件
import PersonalityAnalysisGame from '@/components/games/PersonalityAnalysisGame';
import AdvantageAnalysisGame from '@/components/games/AdvantageAnalysisGame';
import ValueRankingGame from '@/components/games/ValueRankingGame';
import CareerCollectorGame from '@/components/games/CareerCollectorGame';
import GrowthPlanningGame from '@/components/games/GrowthPlanningGame';
import PositionBreakdownGame from '@/components/games/PositionBreakdownGame';
import LifeTransformationGame from '@/components/games/LifeTransformationGame';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GameModeIntegrationProps {
  roomId: string;
  isVisitor?: boolean;
  counselorId?: string;
  visitorId?: string;
  onGameplayChange?: (gameplay: string) => void;
  currentGameplay?: string;
  onStateChange?: (state: any) => void;
}

const GameModeIntegration: React.FC<GameModeIntegrationProps> = ({
  roomId,
  isVisitor = false,
  counselorId,
  visitorId,
  onGameplayChange,
  currentGameplay,
  onStateChange,
}) => {
  // 模式和玩法選擇 - 本地預覽狀態
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedGameplay, setSelectedGameplay] = useState<string>(currentGameplay || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncInfoExpanded, setSyncInfoExpanded] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const isRoomOwner = !isVisitor;

  // 找到 Portal 容器
  useEffect(() => {
    const container = document.getElementById('sync-status-container');
    setPortalContainer(container);
  }, []);

  // 使用 room presence 檢測 counselor 在線狀態
  const { onlineUsers } = usePresence(roomId);
  const counselorOnline = onlineUsers.some(u => u.role === 'owner');

  // Debug: log online users
  useEffect(() => {
    console.log('[GameMode] onlineUsers:', onlineUsers.map(u => ({ id: u.id, role: u.role })));
    console.log('[GameMode] counselorOnline:', counselorOnline);
  }, [onlineUsers, counselorOnline]);

  // 使用遊戲模式同步 Hook
  const {
    syncedState,
    ownerOnline: gameChannelOwnerOnline,
    canInteract,
    isConnected,
    error: syncError,
    changeGameMode,
    exitGame,
    startGame,
    gameStarted,
    waitingForOwnerState,
  } = useGameModeSync({
    roomId,
    isOwner: isRoomOwner,
    onStateChange: (state) => {
      // 當同步狀態改變時，更新本地顯示
      console.log('[GameModeIntegration] onStateChange received:', {
        isVisitor,
        gameMode: state.gameMode,
        deck: state.deck,
        gameRule: state.gameRule,
      });
      setSelectedGameplay(state.gameMode);
      console.log('[GameModeIntegration] selectedGameplay updated to:', state.gameMode);
      onStateChange?.(state);
    },
  });

  // 使用 room presence 的在線狀態（更準確）
  const ownerOnline = counselorOnline;

  // 計算是否可互動：Owner 永遠可以，訪客需要等諮詢師開始遊戲
  const canInteractLocal = isRoomOwner || (counselorOnline && gameStarted);

  // 選擇遊戲（模式 + 玩法）- Owner 同步選擇
  const handleGameSelect = (modeId: string, gameplayId: string) => {
    // 檢查是否能互動（Owner 或 Owner 在線時）
    if (!canInteractLocal) {
      console.warn('[GameModeIntegration] Cannot select game - owner is offline');
      return;
    }

    if (isRoomOwner) {
      // Owner: 同步到所有人
      // 找出對應的 deck 名稱
      let deckName: string = DECK_TYPES.TRAVELER; // 預設
      if (modeId === 'skills_card') deckName = DECK_TYPES.SKILLS;
      else if (modeId === 'values_card') deckName = DECK_TYPES.VALUES;

      // 取得玩法名稱
      const gameRuleName = GAMEPLAY_NAMES[gameplayId] || gameplayId;

      changeGameMode(deckName, gameRuleName, gameplayId);
      // 自動開始遊戲，設置 gameStarted = true，讓訪客端遮罩消失
      startGame();
    }

    // 本地預覽更新
    setSelectedMode(modeId);
    setSelectedGameplay(gameplayId);
  };

  // Sync with parent state
  useEffect(() => {
    if (currentGameplay !== undefined) {
      setSelectedGameplay(currentGameplay);
    }
  }, [currentGameplay]);

  useEffect(() => {
    if (onGameplayChange) {
      onGameplayChange(selectedGameplay);
    }
  }, [selectedGameplay, onGameplayChange]);

  // 監聽 currentGameplay，當諮詢師從 header 返回時，自動調用 exitGame
  useEffect(() => {
    if (isRoomOwner && !currentGameplay && selectedGameplay) {
      // currentGameplay 被清空（header 返回），且之前有選擇遊戲
      console.log('[GameModeIntegration] Detected game exit from header, calling exitGame()');
      exitGame();
      setSelectedGameplay('');
      setSelectedMode('');
    }
  }, [currentGameplay, isRoomOwner, selectedGameplay, exitGame]);

  // 選擇玩法
  const handleGameplaySelect = async (gameplayId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      setSelectedGameplay(gameplayId);
    } catch (err) {
      setError(`載入玩法失敗: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 根據玩法渲染對應的遊戲組件
  const renderGame = () => {
    if (!selectedGameplay) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">請選擇遊戲模式</p>
          </div>
        </div>
      );
    }

    // 根據玩法來決定渲染哪個遊戲組件（使用統一命名）
    switch (selectedGameplay) {
      case GAMEPLAY_IDS.PERSONALITY_ASSESSMENT:
        return <PersonalityAnalysisGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.ADVANTAGE_ANALYSIS:
        return <AdvantageAnalysisGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.VALUE_RANKING:
        return <ValueRankingGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.CAREER_COLLECTOR:
        return <CareerCollectorGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.GROWTH_PLANNING:
        return <GrowthPlanningGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.POSITION_BREAKDOWN:
        return <PositionBreakdownGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case GAMEPLAY_IDS.LIFE_REDESIGN:
        return <LifeTransformationGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                玩法 ({selectedGameplay}) 尚未實作
              </p>
            </div>
          </div>
        );
    }
  };

  // 同步狀態組件
  const syncStatusComponent =
    isConnected && portalContainer ? (
      <>
        {syncInfoExpanded ? (
          // 展開狀態 - 顯示完整資訊
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2 min-w-[200px] absolute right-0 top-full mt-2 z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? '已同步' : '未連線'}
                </span>
              </div>
              <button
                onClick={() => setSyncInfoExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Owner 狀態（訪客才顯示） */}
            {isVisitor && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ownerOnline ? '🟢 諮詢師在線' : '⏸️ 等待諮詢師'}
              </div>
            )}

            {/* 當前同步模式 */}
            {syncedState.deck && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1.5">
                <div className="text-xs text-gray-500 dark:text-gray-400">當前同步模式：</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {syncedState.deck} - {syncedState.gameRule}
                </div>
              </div>
            )}
          </div>
        ) : (
          // 收合狀態 - 只顯示圖標
          <button
            onClick={() => setSyncInfoExpanded(true)}
            className="bg-white dark:bg-gray-800 rounded-full shadow-md p-2 hover:shadow-lg transition-all flex items-center gap-1.5 group relative"
            title="點擊查看同步資訊"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            />
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </>
    ) : null;

  return (
    <div className="h-full flex flex-col relative">
      {/* 使用 Portal 將同步狀態渲染到頂部容器 */}
      {portalContainer && syncStatusComponent && createPortal(syncStatusComponent, portalContainer)}

      {/* 訪客等待 Owner 狀態 */}
      {waitingForOwnerState && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="mb-4">
              <span className="text-6xl">🔄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              正在連接諮商師...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">等待諮商師的遊戲狀態</p>
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                連線中
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要內容區域 */}
      {!waitingForOwnerState && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* 模式和玩法選擇器 - 顯示所有組合 */}
            {!gameStarted && !selectedGameplay && (
              <>
                {/* 訪客：顯示等待諮詢師選擇遊戲的遮罩 */}
                {isVisitor ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="mb-4">
                        <span className="text-6xl">🎮</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        等待諮詢師選擇遊戲
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">諮詢師正在選擇遊戲模式</p>
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          等待中
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 諮詢師：顯示選擇器 */
                  <div className="h-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
                    <div className="max-w-7xl mx-auto">
                      <CombinedGameSelector
                        onGameSelect={handleGameSelect}
                        currentMode={selectedMode}
                        currentGameplay={selectedGameplay}
                        disabled={!canInteractLocal}
                      />
                    </div>
                  </div>
                )}
              </>
          )}

          {/* 錯誤顯示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 載入中顯示 */}
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500 dark:text-gray-400">載入中...</div>
            </div>
          )}

          {/* 遊戲區域 - 遊戲開始後顯示 */}
          {(gameStarted || selectedGameplay) && !isLoading && (
            <div className="flex-1 overflow-hidden relative flex flex-col">
              <div className="flex-1 overflow-hidden">{renderGame()}</div>

              {/* Owner 離線遮罩層 */}
              {!canInteractLocal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                  {/* 半透明黑色遮罩 */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                  {/* 提示訊息 */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 mx-4 max-w-md text-center">
                    <div className="mb-4">
                      <span className="text-6xl">⏸️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      等待諮詢師回來
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">諮詢師離線時，房間暫時凍結</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                      請稍候，諮詢師上線後即可繼續
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameModeIntegration;
