/**
 * GameModeIntegration - 遊戲模式整合元件
 *
 * 整合新的三模式架構到房間頁面
 * 測試完整的選擇流程和渲染正確性
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameModeService } from '@/game-modes/services/mode.service';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import { LegacyGameAdapter } from '@/game-modes/adapters/legacy-adapter';
import ModeSelector from '@/game-modes/components/ModeSelector';
import GameplaySelector from '@/game-modes/components/GameplaySelector';
import TokenControls from '@/token-system/components/TokenControls';
import TokenDisplay from '@/token-system/components/TokenDisplay';
import { TokenManager, TokenAllocation } from '@/token-system/TokenManager';
import { ConsultationAreaNew } from '@/components/consultation/ConsultationAreaNew';

// 導入模組化畫布元件
import ThreeColumnCanvas from '@/components/game-canvases/ThreeColumnCanvas';
import TwoZoneCanvas from '@/components/game-canvases/TwoZoneCanvas';
import GridCanvas from '@/components/game-canvases/GridCanvas';
import CardItem from '@/components/game-canvases/CardItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home,
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Gamepad2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface GameModeIntegrationProps {
  roomId: string;
  isVisitor?: boolean;
  counselorId?: string;
  onStateChange?: (state: any) => void;
}

const GameModeIntegration: React.FC<GameModeIntegrationProps> = ({
  roomId,
  isVisitor = false,
  counselorId,
  onStateChange,
}) => {
  // 模式和玩法狀態
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedGameplay, setSelectedGameplay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 牌卡和畫布資料
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [auxiliaryDeck, setAuxiliaryDeck] = useState<any>(null);
  const [canvasConfig, setCanvasConfig] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());

  // 籌碼系統狀態（for 生活改造王）
  const [tokenAllocations, setTokenAllocations] = useState<TokenAllocation[]>([]);
  const [showTokenSystem, setShowTokenSystem] = useState(false);

  // 測試模式
  const [testMode, setTestMode] = useState(false);
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testAreaCollapsed, setTestAreaCollapsed] = useState(false);

  // Tab 控制
  const [activeTab, setActiveTab] = useState('select');

  // 初始化服務
  useEffect(() => {
    const init = async () => {
      try {
        await CardLoaderService.initialize();
        addTestResult('✅ CardLoaderService 初始化成功');
      } catch (error) {
        addTestResult(`❌ CardLoaderService 初始化失敗: ${error}`);
      }
    };
    init();
  }, []);

  const addTestResult = (message: string) => {
    if (testMode) {
      setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    }
    console.log('[GameModeIntegration]', message);
  };

  // 處理模式選擇
  const handleModeSelect = useCallback(
    async (modeId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        addTestResult(`📍 選擇模式: ${modeId}`);
        setSelectedMode(modeId);

        // 重置玩法選擇
        setSelectedGameplay('');
        setShowTokenSystem(false);

        // 取得模式資訊
        const mode = GameModeService.getMode(modeId);
        if (mode) {
          addTestResult(`✅ 模式載入成功: ${mode.name}, 包含 ${mode.gameplays.length} 種玩法`);

          // 自動前進到玩法選擇
          setActiveTab('configure');
          addTestResult('➡️ 自動前進到：選擇玩法');
        } else {
          throw new Error(`找不到模式: ${modeId}`);
        }
      } catch (err: any) {
        setError(err.message);
        addTestResult(`❌ 模式選擇錯誤: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [testMode]
  );

  // 處理玩法選擇
  const handleGameplaySelect = useCallback(
    async (gameplayId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        addTestResult(`📍 選擇玩法: ${gameplayId}`);
        setSelectedGameplay(gameplayId);

        // 載入對應的牌組
        const decks = await CardLoaderService.getDecksForGameplay(gameplayId);
        addTestResult(
          `✅ 載入牌組: 主牌組=${decks.main?.cards.length || 0}張, 輔助牌組=${decks.auxiliary?.cards.length || 0}張`
        );

        setMainDeck(decks.main);
        setAuxiliaryDeck(decks.auxiliary);

        // 載入畫布配置
        const canvasConfigData = await loadCanvasConfig(gameplayId);
        setCanvasConfig(canvasConfigData);
        addTestResult(`✅ 載入畫布配置: ${canvasConfigData?.type || 'unknown'}`);

        // 檢查是否需要籌碼系統
        if (gameplayId === 'life_redesign') {
          setShowTokenSystem(true);
          addTestResult('✅ 啟動籌碼系統 (生活改造王)');
        } else {
          setShowTokenSystem(false);
        }

        // 使用 LegacyAdapter 創建遊戲狀態
        const gameState = LegacyGameAdapter.startGameWithMode(selectedMode, gameplayId);
        addTestResult(
          `✅ 遊戲狀態初始化: rule_id=${gameState.rule_id}, zones=${gameState.zones.size}`
        );

        // 通知父元件
        if (onStateChange) {
          onStateChange({
            mode: selectedMode,
            gameplay: gameplayId,
            gameState,
            decks,
            canvas: canvasConfigData,
          });
        }

        // 自動前進到開始遊戲
        setActiveTab('play');
        addTestResult('➡️ 自動前進到：開始遊戲');
      } catch (err: any) {
        setError(err.message);
        addTestResult(`❌ 玩法選擇錯誤: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedMode, testMode, onStateChange]
  );

  // 載入畫布配置
  const loadCanvasConfig = async (gameplayId: string): Promise<any> => {
    // 這裡應該從 canvas-configs.json 載入，暫時返回模擬資料
    const canvasMap: Record<string, any> = {
      personality_analysis: { type: 'three_columns', name: '三欄分類' },
      career_collector: { type: 'collection_zone', name: '收藏區' },
      advantage_analysis: { type: 'two_zones', name: '雙區' },
      growth_planning: { type: 'three_zones', name: '三區成長' },
      position_breakdown: { type: 'free_canvas', name: '自由畫布' },
      value_ranking: { type: 'grid_3x3', name: '3×3九宮格' },
      life_redesign: { type: 'value_gauge', name: '量表畫布' },
    };

    return canvasMap[gameplayId] || { type: 'default', name: '預設畫布' };
  };

  // 處理籌碼變更
  const handleTokenChange = (allocations: TokenAllocation[]) => {
    setTokenAllocations(allocations);
    addTestResult(`🎯 籌碼更新: ${allocations.map((a) => `${a.area}:${a.amount}`).join(', ')}`);
  };

  // 根據畫布類型渲染對應的畫布元件
  const renderCanvas = () => {
    if (!canvasConfig || !mainDeck) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">載入畫布中...</p>
          </div>
        </div>
      );
    }

    // 根據畫布類型或玩法來決定渲染哪個畫布
    const canvasType = canvasConfig.type || selectedGameplay;

    switch (canvasType) {
      case 'three_columns':
      case 'personality_analysis':
        return (
          <ThreeColumnCanvas
            cards={mainDeck?.cards || []}
            onCardMove={(cardId, column) => {
              if (column === null) {
                // 卡片被移除，回到左邊
                setUsedCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardId);
                  return newSet;
                });
                addTestResult(`↔️ 卡片 ${cardId} 移回左邊`);
              } else {
                console.log(`Card ${cardId} moved to ${column}`);
                addTestResult(`🎯 卡片 ${cardId} 移至 ${column}`);
                setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
              }
            }}
          />
        );

      case 'two_zones':
      case 'advantage_analysis':
        return (
          <TwoZoneCanvas
            cards={mainDeck?.cards || []}
            onCardMove={(cardId, zone) => {
              if (zone === null) {
                // 卡片被移除，回到左邊
                setUsedCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardId);
                  return newSet;
                });
                addTestResult(`↔️ 卡片 ${cardId} 移回左邊`);
              } else {
                console.log(`Card ${cardId} moved to ${zone}`);
                addTestResult(`🎯 卡片 ${cardId} 移至 ${zone}`);
                setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
              }
            }}
            maxCardsPerZone={5}
          />
        );

      case 'grid_3x3':
      case 'value_ranking':
        return (
          <GridCanvas
            cards={mainDeck?.cards || []}
            onCardMove={(cardId, position) => {
              if (position === null) {
                // 卡片被移除，回到左邊
                setUsedCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardId);
                  return newSet;
                });
                addTestResult(`↔️ 卡片 ${cardId} 移回左邊`);
              } else {
                console.log(`Card ${cardId} moved to position (${position.row}, ${position.col})`);
                addTestResult(`🎯 卡片 ${cardId} 移至位置 (${position.row}, ${position.col})`);
                setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
              }
            }}
          />
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-lg">{canvasConfig?.name} 畫布</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                畫布類型 ({canvasType}) 尚未實作
              </p>
            </div>
          </div>
        );
    }
  };

  // 生活改造王的區域配置
  const lifeAreas = [
    { id: 'family', name: '家庭', icon: React.createElement(Home) },
    { id: 'love', name: '愛情', icon: React.createElement(Heart) },
    { id: 'career', name: '事業', icon: React.createElement(Briefcase) },
    { id: 'wealth', name: '財富', icon: React.createElement(DollarSign) },
    { id: 'friends', name: '友誼', icon: React.createElement(Users) },
    { id: 'growth', name: '成長', icon: React.createElement(BookOpen) },
    { id: 'leisure', name: '休閒', icon: React.createElement(Gamepad2) },
    { id: 'health', name: '健康', icon: React.createElement(TrendingUp) },
  ];

  return (
    <div className="h-full flex flex-col relative">
      {/* 測試模式開啟按鈕 - 在右上角 */}
      {!testMode && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => {
              setTestMode(true);
              setTestAreaCollapsed(false);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            測試模式
          </button>
        </div>
      )}

      {/* 測試控制區 - 可收合 */}
      {testMode && (
        <div
          className={`border-b border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden ${testAreaCollapsed ? 'h-10' : 'h-auto'}`}
        >
          {/* 測試區標題列 */}
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setTestAreaCollapsed(!testAreaCollapsed)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {testAreaCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>測試模式整合測試</span>
              <Badge className="ml-2" variant="outline">
                ON
              </Badge>
            </button>
            <button
              onClick={() => setTestMode(false)}
              className="text-xs px-2 py-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              關閉測試
            </button>
          </div>

          {/* 測試內容區 - 只在展開時顯示 */}
          {!testAreaCollapsed && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                遊戲模式整合測試
              </h2>
              {testResults.length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    測試日誌 ({testResults.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="text-xs font-mono text-gray-700 dark:text-gray-300"
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 錯誤提示 */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 主要內容區 - 始終顯示 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="select">1. 選擇模式</TabsTrigger>
          <TabsTrigger value="configure" disabled={!selectedMode}>
            2. 選擇玩法
          </TabsTrigger>
          <TabsTrigger value="play" disabled={!selectedGameplay}>
            3. 開始遊戲
          </TabsTrigger>
        </TabsList>

        {/* Step 1: 選擇模式 */}
        <TabsContent value="select" className="flex-1 p-4 overflow-auto">
          <ModeSelector
            currentMode={selectedMode}
            onModeSelect={handleModeSelect}
            disabled={isLoading}
          />
        </TabsContent>

        {/* Step 2: 選擇玩法 */}
        <TabsContent value="configure" className="flex-1 p-4 overflow-auto">
          {selectedMode && (
            <GameplaySelector
              modeId={selectedMode}
              currentGameplay={selectedGameplay}
              onGameplaySelect={handleGameplaySelect}
              disabled={isLoading}
            />
          )}
        </TabsContent>

        {/* Step 3: 開始遊戲 - 左右分欄佈局 */}
        <TabsContent value="play" className="flex-1 flex overflow-hidden">
          {selectedGameplay && (
            <div className="flex w-full h-full">
              {/* 左側：牌卡區 */}
              <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                {/* 牌卡區標題 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    {mainDeck ? mainDeck.name : '牌卡區'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {mainDeck ? `${mainDeck.cards.length} 張牌卡` : '載入中...'}
                  </p>
                </div>

                {/* 牌卡列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {mainDeck && (
                    <div className="grid grid-cols-2 gap-3">
                      {mainDeck.cards
                        .slice(0, 10)
                        .filter((card: any) => !usedCards.has(card.id)) // 直接過濾掉已使用的卡片
                        .map((card: any) => (
                          <CardItem
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            description={card.description}
                            category={card.category}
                            isUsed={false}
                            isDraggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('cardId', card.id);
                              addTestResult(`📋 開始拖曳卡片: ${card.title}`);
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 右側：遊戲畫布 */}
              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* 遊戲資訊條 */}
                <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">模式：</span>
                        <span className="font-medium ml-2 text-gray-900 dark:text-gray-100">
                          {GameModeService.getMode(selectedMode)?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">玩法：</span>
                        <span className="font-medium ml-2 text-gray-900 dark:text-gray-100">
                          {GameModeService.getGameplay(selectedMode, selectedGameplay)?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">畫布類型：</span>
                        <span className="font-medium ml-2 text-gray-900 dark:text-gray-100">
                          {canvasConfig?.name || '載入中'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 畫布區域 */}
                <div className="flex-1 p-6 overflow-auto">
                  {/* 生活改造王籌碼系統 */}
                  {showTokenSystem ? (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <TokenControls
                        areas={lifeAreas}
                        total={100}
                        onChange={handleTokenChange}
                        showSuggestions={true}
                      />
                      <div className="space-y-4">
                        <TokenDisplay
                          allocations={tokenAllocations}
                          visualType="pie"
                          title="能量分配圓餅圖"
                        />
                        <TokenDisplay
                          allocations={tokenAllocations}
                          visualType="progress"
                          title="能量分配進度"
                        />
                      </div>
                    </div>
                  ) : (
                    /* 一般遊戲畫布 - 根據畫布類型渲染 */
                    <div className="h-full">{renderCanvas()}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameModeIntegration;
