/**
 * GameModeIntegration - 遊戲模式整合元件 (更新版)
 *
 * 使用獨立的遊戲組件，每個遊戲有自己的狀態管理
 * 透過 GameStateStore 實現狀態隔離和持久化
 * 整合 Supabase Broadcast 實現多用戶同步
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameModeService } from '@/game-modes/services/mode.service';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import CombinedGameSelector from '@/game-modes/components/CombinedGameSelector';
import { useGameModeSync } from '@/hooks/use-game-mode-sync';
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

  const isRoomOwner = !isVisitor;

  // 使用遊戲模式同步 Hook
  const {
    syncedState,
    ownerOnline,
    canInteract,
    isConnected,
    error: syncError,
    changeGameMode,
    startGame,
    gameStarted,
  } = useGameModeSync({
    roomId,
    isOwner: isRoomOwner,
    onStateChange: (state) => {
      // 當同步狀態改變時，更新本地顯示
      setSelectedGameplay(state.gameMode);
      onStateChange?.(state);
    },
  });

  // 選擇遊戲（模式 + 玩法）- Owner 同步選擇
  const handleGameSelect = (modeId: string, gameplayId: string) => {
    if (isRoomOwner) {
      // Owner: 同步到所有人
      // 找出對應的 deck 名稱
      let deckName: string = DECK_TYPES.TRAVELER; // 預設
      if (modeId === 'skills_card') deckName = DECK_TYPES.SKILLS;
      else if (modeId === 'values_card') deckName = DECK_TYPES.VALUES;

      // 取得玩法名稱
      const gameRuleName = GAMEPLAY_NAMES[gameplayId] || gameplayId;

      changeGameMode(deckName, gameRuleName, gameplayId);
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

  return (
    <div className="h-full flex flex-col relative">
      {/* 同步狀態顯示 */}
      {isConnected && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          {/* 連線狀態 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? '已同步' : '未連線'}
            </span>
          </div>

          {/* Owner 狀態（訪客才顯示） */}
          {isVisitor && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ownerOnline ? '🟢 諮詢師在線' : '⏸️ 等待諮詢師'}
              </span>
            </div>
          )}

          {/* 當前同步模式 */}
          {syncedState.deck && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">當前同步模式：</div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {syncedState.deck} - {syncedState.gameRule}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 模式和玩法選擇器 - 顯示所有組合 */}
          {!gameStarted && !selectedGameplay && (
            <div className="h-full overflow-y-auto">
              <CombinedGameSelector
                onGameSelect={handleGameSelect}
                currentMode={selectedMode}
                currentGameplay={selectedGameplay}
                disabled={!canInteract}
              />

              {/* 開始遊戲按鈕（Owner 才能看到） */}
              {isRoomOwner && syncedState.gameMode && (
                <div className="fixed bottom-8 right-8 z-20">
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    開始遊戲
                  </Button>
                </div>
              )}
            </div>
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
            <div className="flex-1 overflow-hidden">
              <div className="h-full">{renderGame()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameModeIntegration;
