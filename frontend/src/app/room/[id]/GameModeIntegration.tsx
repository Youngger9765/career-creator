/**
 * GameModeIntegration - 遊戲模式整合元件 (更新版)
 *
 * 使用獨立的遊戲組件，每個遊戲有自己的狀態管理
 * 透過 GameStateStore 實現狀態隔離和持久化
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameModeService } from '@/game-modes/services/mode.service';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import CombinedGameSelector from '@/game-modes/components/CombinedGameSelector';

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
  // 模式和玩法選擇
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedGameplay, setSelectedGameplay] = useState<string>(currentGameplay || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRoomOwner = !isVisitor;

  // 選擇遊戲（模式 + 玩法）
  const handleGameSelect = (modeId: string, gameplayId: string) => {
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

    // 根據玩法來決定渲染哪個遊戲組件
    switch (selectedGameplay) {
      case 'personality_analysis':
        return <PersonalityAnalysisGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'advantage_analysis':
        return <AdvantageAnalysisGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'value_ranking':
        return <ValueRankingGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'career_collector':
        return <CareerCollectorGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'growth_planning':
        return <GrowthPlanningGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'position_breakdown':
        return <PositionBreakdownGame roomId={roomId} isRoomOwner={isRoomOwner} />;

      case 'life_redesign':
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
      {/* 主要內容區域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 模式和玩法選擇器 - 顯示所有組合 */}
          {!selectedGameplay && (
            <div className="h-full overflow-y-auto">
              <CombinedGameSelector
                onGameSelect={handleGameSelect}
                currentMode={selectedMode}
                currentGameplay={selectedGameplay}
              />
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

          {/* 遊戲區域 */}
          {selectedGameplay && !isLoading && (
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
