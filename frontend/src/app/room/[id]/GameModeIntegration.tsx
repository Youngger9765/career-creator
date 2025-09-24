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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // 籌碼系統狀態（for 生活改造王）
  const [tokenAllocations, setTokenAllocations] = useState<TokenAllocation[]>([]);
  const [showTokenSystem, setShowTokenSystem] = useState(false);

  // 測試模式
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

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

  // 生活改造王的區域配置
  const lifeAreas = [
    { id: 'family', name: '家庭', icon: <Home className="w-4 h-4" /> },
    { id: 'love', name: '愛情', icon: <Heart className="w-4 h-4" /> },
    { id: 'career', name: '事業', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'wealth', name: '財富', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'friends', name: '友誼', icon: <Users className="w-4 h-4" /> },
    { id: 'growth', name: '成長', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'leisure', name: '休閒', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'health', name: '健康', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* 測試模式開關 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">遊戲模式整合測試</h1>
        <button
          onClick={() => setTestMode(!testMode)}
          className="px-3 py-1 text-sm border border-gray-400 rounded text-gray-700 dark:text-white dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {testMode ? '關閉測試模式' : '開啟測試模式'}
        </button>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 測試結果面板 */}
      {testMode && testResults.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900 dark:text-gray-100">測試日誌</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select">1. 選擇模式</TabsTrigger>
          <TabsTrigger value="configure" disabled={!selectedMode}>
            2. 選擇玩法
          </TabsTrigger>
          <TabsTrigger value="play" disabled={!selectedGameplay}>
            3. 開始遊戲
          </TabsTrigger>
        </TabsList>

        {/* Step 1: 選擇模式 */}
        <TabsContent value="select" className="space-y-4">
          <ModeSelector
            currentMode={selectedMode}
            onModeSelect={handleModeSelect}
            disabled={isLoading}
          />
        </TabsContent>

        {/* Step 2: 選擇玩法 */}
        <TabsContent value="configure" className="space-y-4">
          {selectedMode && (
            <GameplaySelector
              modeId={selectedMode}
              currentGameplay={selectedGameplay}
              onGameplaySelect={handleGameplaySelect}
              disabled={isLoading}
            />
          )}
        </TabsContent>

        {/* Step 3: 開始遊戲 */}
        <TabsContent value="play" className="space-y-4">
          {selectedGameplay && (
            <>
              {/* 遊戲資訊 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">遊戲配置資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                      <span className="text-gray-500 dark:text-gray-400">主牌組：</span>
                      <span className="font-medium ml-2 text-gray-900 dark:text-gray-100">
                        {mainDeck ? `${mainDeck.name} (${mainDeck.cards.length}張)` : '無'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">畫布類型：</span>
                      <span className="font-medium ml-2 text-gray-900 dark:text-gray-100">{canvasConfig?.name || '未知'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 生活改造王籌碼系統 */}
              {showTokenSystem && (
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
              )}

              {/* 一般遊戲畫布 */}
              {!showTokenSystem && mainDeck && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">遊戲畫布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8
                                  min-h-[400px] flex items-center justify-center"
                    >
                      <div className="text-center space-y-4">
                        <p className="text-gray-500 dark:text-gray-400">這裡將顯示 {canvasConfig?.name} 畫布</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          牌卡數量：{mainDeck.cards.length} 張
                        </p>
                        {/* 這裡可以整合現有的 ConsultationAreaNew 元件 */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameModeIntegration;
