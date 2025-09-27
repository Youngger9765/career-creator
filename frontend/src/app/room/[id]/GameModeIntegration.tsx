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
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

  // 測試模式狀態
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testAreaCollapsed, setTestAreaCollapsed] = useState(false);

  const isRoomOwner = !isVisitor;

  // 新增測試結果
  const addTestResult = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    setTestResults((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // 選擇遊戲（模式 + 玩法）
  const handleGameSelect = (modeId: string, gameplayId: string) => {
    setSelectedMode(modeId);
    setSelectedGameplay(gameplayId);
    addTestResult(`✅ 選擇遊戲: ${modeId} - ${gameplayId}`);
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
      addTestResult(`✅ 選擇玩法: ${gameplayId}`);
    } catch (err) {
      setError(`載入玩法失敗: ${err}`);
      addTestResult(`❌ 載入失敗: ${err}`);
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
      {/* 測試模式開啟按鈕 - 在右上角 */}
      {!testMode && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => {
              setTestMode(true);
              setTestAreaCollapsed(false);
              addTestResult('🚀 測試模式已開啟');
            }}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            開啟測試模式
          </button>
        </div>
      )}

      {/* 測試面板 */}
      {testMode && (
        <div
          className={`bg-purple-50 dark:bg-purple-950/20 border-b border-purple-200 dark:border-purple-800 transition-all duration-300 ${
            testAreaCollapsed ? 'h-10' : ''
          }`}
        >
          {/* 摺疊控制 */}
          <div
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30"
            onClick={() => setTestAreaCollapsed(!testAreaCollapsed)}
          >
            <div className="flex items-center gap-2">
              {testAreaCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                測試面板
              </span>
              <Badge variant="secondary" className="text-xs">
                {testResults.length} 個事件
              </Badge>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestMode(false);
                addTestResult('👋 測試模式已關閉');
              }}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              關閉測試
            </button>
          </div>

          {/* 測試結果區域 */}
          {!testAreaCollapsed && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded p-3">
                  <h4 className="text-sm font-medium mb-2">當前狀態</h4>
                  <div className="space-y-1 text-xs">
                    <div>模式: {selectedMode || '未選擇'}</div>
                    <div>玩法: {selectedGameplay || '未選擇'}</div>
                    <div>房間: {roomId}</div>
                    <div>身份: {isRoomOwner ? '房主' : '訪客'}</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium">事件記錄</h4>
                    <button
                      onClick={() => setTestResults([])}
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      清除
                    </button>
                  </div>
                  <div className="space-y-0.5 text-xs max-h-24 overflow-y-auto">
                    {testResults.slice(-5).map((result, idx) => (
                      <div key={idx} className="text-gray-600 dark:text-gray-400">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full flex flex-col gap-6">
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
