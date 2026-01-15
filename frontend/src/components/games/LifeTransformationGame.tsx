/**
 * LifeTransformationGame - 生活改造王玩法
 *
 * 使用籌碼系統進行生活各領域的平衡規劃
 * 包含8個生活領域和100個籌碼分配
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameLayout from '../common/GameLayout';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import { useCardSync } from '@/hooks/use-card-sync';
import { useGameState } from '@/stores/game-state-store';
import { useGameplayStatePersistence } from '@/hooks/use-gameplay-state-persistence';
import { GAMEPLAY_IDS } from '@/constants/game-modes';
import CardTokenWidget from './CardTokenWidget';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Home,
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Gamepad2,
  TrendingUp,
  Star,
  Settings,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TokenAllocation {
  area: string;
  amount: number;
  percentage: number;
}

interface LifeArea {
  cards: string[];
  tokens: number;
}

interface GameSettings {
  maxCards: number;
  totalTokens: number;
}

interface LifeTransformationGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
}

const LifeTransformationGame: React.FC<LifeTransformationGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'life_balance',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const gameType = GAMEPLAY_IDS.LIFE_TRANSFORMATION;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 使用 GameState Store (統一使用 gameType 作為 storeKey)
  const { state, updateCards: _updateCards } = useGameState(roomId, gameType);

  // Backend persistence
  const persistence = useGameplayStatePersistence({
    roomId,
    gameplayId: gameType,
    enabled: isRoomOwner,
  });

  // Wrapper: updateCards + markDirty
  const updateCards = useCallback(
    (updates: any) => {
      _updateCards(updates);
      persistence.markDirty();
    },
    [_updateCards, persistence]
  );

  // 從 state 中取得遊戲設定，如果沒有就使用預設值
  const maxCards = (state.cardPlacements as any).maxCards ?? 10;
  const totalTokens = (state.cardPlacements as any).totalTokens ?? 100;

  // 使用原始的 useCardSync Hook 因為需要自定義處理
  const cardSync = useCardSync({
    roomId,
    gameType,
    isOwner: isRoomOwner,
    userName: isRoomOwner ? 'Owner' : 'Visitor',
    userId: `user_${Date.now()}`,
    onCardMove: (event) => {
      // 處理遠端卡片移動事件
      if (event.toZone?.startsWith('life_')) {
        // 添加卡片
        const cardId = event.cardId;
        const currentLifeAreas = state.cardPlacements.lifeAreas || {};
        const updatedAreas = {
          ...currentLifeAreas,
          [cardId]: {
            cards: [cardId],
            tokens: 0,
          },
        };
        updateCards({ lifeAreas: updatedAreas });
      } else if (event.fromZone?.startsWith('life_') && event.toZone === 'deck') {
        // 移除卡片
        const cardId = event.cardId;
        const currentLifeAreas = state.cardPlacements.lifeAreas || {};
        const updatedAreas = { ...currentLifeAreas };
        delete updatedAreas[cardId];
        updateCards({ lifeAreas: updatedAreas });
      }
    },
    onStateReceived: (receivedState: any) => {
      // 接收完整狀態
      const updates: any = {};

      // 處理遊戲設定
      if (receivedState.settings) {
        updates.maxCards = receivedState.settings.maxCards;
        updates.totalTokens = receivedState.settings.totalTokens;
      }

      // 處理卡片和籌碼
      const lifeAreas: Record<string, LifeArea> = {};
      if (receivedState.cards) {
        Object.entries(receivedState.cards).forEach(([cardId, cardInfo]: any) => {
          if (cardInfo.zone?.startsWith('life_')) {
            const areaId = cardInfo.zone.replace('life_', '');
            lifeAreas[areaId] = {
              cards: [cardId],
              tokens: cardInfo.tokens || 0,
            };
          }
        });
      }

      if (Object.keys(lifeAreas).length > 0) {
        updates.lifeAreas = lifeAreas;
      }

      // 更新本地狀態
      if (Object.keys(updates).length > 0) {
        updateCards(updates);
      }
    },
  });

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck('value_cards_36');
      setMainDeck(deck);
    };
    getDeck();
  }, []);

  // 處理遊戲設定更新
  const updateGameSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      if (!isRoomOwner) return; // 只有房主可以更新設定

      const updatedSettings = {
        ...state.cardPlacements,
        maxCards: settings.maxCards ?? maxCards,
        totalTokens: settings.totalTokens ?? totalTokens,
      };

      updateCards(updatedSettings);

      // 廣播設定變更
      if (cardSync.isConnected) {
        const gameStateData: any = {
          cards: {},
          settings: {
            maxCards: updatedSettings.maxCards,
            totalTokens: updatedSettings.totalTokens,
          },
          lastUpdated: Date.now(),
          gameType,
        };

        // 包含現有的卡片狀態
        const lifeAreas = state.cardPlacements.lifeAreas || {};
        Object.entries(lifeAreas).forEach(([areaId, area]: [string, any]) => {
          area.cards.forEach((cardId: string) => {
            gameStateData.cards[cardId] = {
              zone: `life_${areaId}`,
              tokens: area.tokens,
            };
          });
        });

        cardSync.saveGameState(gameStateData);
      }
    },
    [isRoomOwner, state.cardPlacements, maxCards, totalTokens, updateCards, cardSync, gameType]
  );

  // 處理卡片拖曳開始
  const handleCardDragStart = useCallback(
    (cardId: string) => {
      if (cardSync.isConnected) {
        cardSync.startDrag(cardId);
      }
    },
    [cardSync]
  );

  // 處理卡片添加 - 每張卡片創建獨立的生活領域
  const handleCardAdd = useCallback(
    (cardId: string) => {
      const currentLifeAreas = state.cardPlacements.lifeAreas || {};

      // 為每張卡片創建獨立的領域，使用卡片ID作為領域名稱
      const updatedAreas = {
        ...currentLifeAreas,
        [cardId]: {
          cards: [cardId],
          tokens: 0,
        },
      };

      updateCards({ lifeAreas: updatedAreas });

      // 廣播卡片添加事件
      if (cardSync.isConnected) {
        cardSync.moveCard(cardId, `life_${cardId}`, 'deck');

        // Owner 儲存狀態
        if (isRoomOwner) {
          const gameStateData: any = {
            cards: {},
            settings: {
              maxCards,
              totalTokens,
            },
            lastUpdated: Date.now(),
            gameType,
          };

          Object.entries(updatedAreas).forEach(([areaId, area]: [string, any]) => {
            area.cards.forEach((cId: string) => {
              gameStateData.cards[cId] = {
                zone: `life_${areaId}`,
                tokens: area.tokens || 0,
              };
            });
          });

          cardSync.saveGameState(gameStateData);
        }
      }

      // 結束拖曳
      if (cardSync.isConnected) {
        cardSync.endDrag(cardId);
      }
    },
    [
      state.cardPlacements.lifeAreas,
      updateCards,
      cardSync,
      isRoomOwner,
      maxCards,
      totalTokens,
      gameType,
    ]
  );

  // 處理拖放到畫布
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('cardId');
      const lifeAreas = state.cardPlacements.lifeAreas || {};

      // 檢查是否已經有這張卡片
      const hasCard = Object.values(lifeAreas).some(
        (area: any) => area.cards && area.cards.includes(cardId)
      );

      if (cardId && !hasCard) {
        // 檢查是否達到最大卡片數
        const usedCardIds = new Set<string>();
        Object.values(lifeAreas).forEach((area: any) => {
          if (area.cards) {
            area.cards.forEach((id: string) => usedCardIds.add(id));
          }
        });

        if (usedCardIds.size < maxCards) {
          handleCardAdd(cardId);
        }
      }
    },
    [state.cardPlacements.lifeAreas, maxCards, handleCardAdd]
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 處理卡片移除
  const handleCardRemove = useCallback(
    (cardId: string) => {
      const currentLifeAreas = state.cardPlacements.lifeAreas || {};
      const updatedAreas = { ...currentLifeAreas };

      // 刪除該卡片對應的獨立領域
      delete updatedAreas[cardId];

      updateCards({ lifeAreas: updatedAreas });

      // 廣播卡片移除事件
      if (cardSync.isConnected) {
        cardSync.moveCard(cardId, 'deck', `life_${cardId}`);

        // Owner 儲存狀態
        if (isRoomOwner) {
          const gameStateData: any = {
            cards: {},
            settings: {
              maxCards,
              totalTokens,
            },
            lastUpdated: Date.now(),
            gameType,
          };

          Object.entries(updatedAreas).forEach(([areaId, area]: [string, any]) => {
            area.cards.forEach((cId: string) => {
              gameStateData.cards[cId] = {
                zone: `life_${areaId}`,
                tokens: area.tokens || 0,
              };
            });
          });

          cardSync.saveGameState(gameStateData);
        }
      }
    },
    [
      state.cardPlacements.lifeAreas,
      updateCards,
      cardSync,
      isRoomOwner,
      maxCards,
      totalTokens,
      gameType,
    ]
  );

  // 處理籌碼更新
  const handleTokenUpdate = useCallback(
    (cardId: string, amount: number) => {
      const currentLifeAreas = state.cardPlacements.lifeAreas || {};
      const updatedAreas = { ...currentLifeAreas };

      if (updatedAreas[cardId]) {
        // 計算其他區域已使用的籌碼
        let otherUsedTokens = 0;
        Object.entries(updatedAreas).forEach(([areaId, area]: [string, any]) => {
          if (areaId !== cardId) {
            otherUsedTokens += area.tokens || 0;
          }
        });

        // 確保不超過總籌碼數
        const maxAvailable = totalTokens - otherUsedTokens;
        updatedAreas[cardId] = {
          ...updatedAreas[cardId],
          tokens: Math.min(Math.max(0, amount), maxAvailable),
        };

        updateCards({ lifeAreas: updatedAreas });

        // 廣播籌碼更新
        if (cardSync.isConnected && isRoomOwner) {
          const gameStateData: any = {
            cards: {},
            settings: {
              maxCards,
              totalTokens,
            },
            lastUpdated: Date.now(),
            gameType,
          };

          Object.entries(updatedAreas).forEach(([areaId, area]: [string, any]) => {
            area.cards.forEach((cId: string) => {
              gameStateData.cards[cId] = {
                zone: `life_${areaId}`,
                tokens: area.tokens || 0,
              };
            });
          });

          cardSync.saveGameState(gameStateData);
        }
      }
    },
    [
      state.cardPlacements.lifeAreas,
      totalTokens,
      updateCards,
      cardSync,
      isRoomOwner,
      maxCards,
      gameType,
    ]
  );

  // 計算已使用的卡片和籌碼
  const lifeAreas = useMemo(
    () => state.cardPlacements.lifeAreas || {},
    [state.cardPlacements.lifeAreas]
  );

  const usedCardIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(lifeAreas).forEach((area: any) => {
      if (area.cards) {
        area.cards.forEach((cardId: string) => ids.add(cardId));
      }
    });
    return ids;
  }, [lifeAreas]);

  const usedTokens = useMemo(() => {
    let tokens = 0;
    Object.values(lifeAreas).forEach((area: any) => {
      if (area.tokens) {
        tokens += area.tokens;
      }
    });
    return tokens;
  }, [lifeAreas]);

  const remainingTokens = totalTokens - usedTokens;

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

  // 處理卡片拖曳排序
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const currentCardIds = Array.from(usedCardIds);
        const oldIndex = currentCardIds.indexOf(active.id as string);
        const newIndex = currentCardIds.indexOf(over.id as string);

        const newCardIds = arrayMove(currentCardIds, oldIndex, newIndex);

        // 重新構建 lifeAreas，保持原有的 tokens 數據
        const currentLifeAreas = state.cardPlacements.lifeAreas || {};
        const updatedAreas: Record<string, LifeArea> = {};

        newCardIds.forEach((cardId) => {
          updatedAreas[cardId] = currentLifeAreas[cardId];
        });

        updateCards({ lifeAreas: updatedAreas });

        // 廣播更新
        if (cardSync.isConnected && isRoomOwner) {
          const gameStateData: any = {
            cards: {},
            settings: {
              maxCards,
              totalTokens,
            },
            lastUpdated: Date.now(),
            gameType,
          };

          Object.entries(updatedAreas).forEach(([areaId, area]: [string, any]) => {
            area.cards.forEach((cId: string) => {
              gameStateData.cards[cId] = {
                zone: `life_${areaId}`,
                tokens: area.tokens || 0,
              };
            });
          });

          cardSync.saveGameState(gameStateData);
        }
      }
    },
    [
      usedCardIds,
      state.cardPlacements.lifeAreas,
      updateCards,
      cardSync,
      isRoomOwner,
      maxCards,
      totalTokens,
      gameType,
    ]
  );

  return (
    <GameLayout
      infoBar={{
        mode: '價值導航',
        gameplay: '生活改造王',
        canvas: '籌碼分配畫布',
        deckName: '價值導航卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'value',
            label: '價值導航卡',
            cards: availableCards,
            color: 'green',
            type: 'value',
          },
        ],
        width: 'w-96',
        columns: 2,
        onCardDragStart: handleCardDragStart,
      }}
      canvas={
        <div
          className="p-4 h-full overflow-y-auto"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {/* 控制面板 */}
          <div className="bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-300 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    遊戲設定
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-700">最多卡片:</label>
                  <Input
                    type="text"
                    value={maxCards}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || parseInt(value) >= 0) {
                        updateGameSettings({ maxCards: parseInt(value) || 0 });
                      }
                    }}
                    disabled={!isRoomOwner}
                    className="w-16 h-8 text-center text-gray-900 dark:text-gray-900 bg-white dark:bg-white border-gray-300 dark:border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500">張</span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-700">總籌碼:</label>
                  <Input
                    type="text"
                    value={totalTokens}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || parseInt(value) >= 0) {
                        updateGameSettings({ totalTokens: parseInt(value) || 0 });
                      }
                    }}
                    disabled={!isRoomOwner}
                    className="w-20 h-8 text-center text-gray-900 dark:text-gray-900 bg-white dark:bg-white border-gray-300 dark:border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500">點</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 dark:text-gray-700">
                  <span className="font-medium">已選卡片:</span>
                  <span
                    className={`ml-1 ${usedCardIds.size >= maxCards ? 'text-red-600 dark:text-red-600' : 'text-gray-900 dark:text-gray-900'}`}
                  >
                    {usedCardIds.size}/{maxCards}
                  </span>
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-700">
                  <span className="font-medium">剩餘籌碼:</span>
                  <span
                    className={`ml-1 font-bold ${remainingTokens < 0 ? 'text-red-600 dark:text-red-600' : remainingTokens === 0 ? 'text-green-600 dark:text-green-600' : 'text-blue-600 dark:text-blue-600'}`}
                  >
                    {remainingTokens}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 ml-1">/ {totalTokens}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 主要內容區 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
            {/* 左側：卡片籌碼分配區 */}
            <div className="space-y-4 min-h-[400px]">
              {/* 拖曳提示區 */}
              {usedCardIds.size === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-100">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-gray-900 text-lg font-medium">
                      從左側拖曳價值卡到此處
                    </p>
                    <p className="text-gray-700 dark:text-gray-700 text-sm mt-2">
                      卡片會自動變成籌碼分配工具
                    </p>
                    <p className="text-blue-600 dark:text-blue-700 text-xs mt-2">
                      最多可選 {maxCards} 張卡片，總共 {totalTokens} 個籌碼
                    </p>
                  </div>
                </div>
              )}

              {/* 動態生成的卡片籌碼分配器 */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={Array.from(usedCardIds)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 overflow-y-auto">
                    {Array.from(usedCardIds).map((cardId: string) => {
                      const card = mainDeck?.cards?.find((c: any) => c.id === cardId);
                      if (!card) return null;

                      // 從該卡片的獨立領域中獲取token數量
                      const cardArea = lifeAreas[cardId];
                      const cardTokens = cardArea?.tokens || 0;

                      // 計算這張卡片可使用的最大籌碼數（當前值 + 剩餘籌碼）
                      const maxTokensForCard = cardTokens + remainingTokens;

                      const allocation = {
                        area: cardId,
                        amount: cardTokens,
                        percentage: totalTokens > 0 ? (cardTokens / totalTokens) * 100 : 0,
                      };

                      return (
                        <CardTokenWidget
                          key={cardId}
                          card={card}
                          allocation={allocation}
                          maxTokens={maxTokensForCard}
                          onAllocationChange={(amount) => handleTokenUpdate(cardId, amount)}
                          onRemove={() => handleCardRemove(cardId)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* 右側：視覺化圖表區 */}
            <div className="bg-white dark:bg-gray-100 rounded-lg border border-gray-200 dark:border-gray-300 p-4 md:p-6 min-h-[500px] overflow-hidden">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4 md:mb-6">
                生活平衡分配圖
              </h3>

              {usedTokens > 0 ? (
                <div className="space-y-6">
                  {/* 圓餅圖區域 */}
                  <div className="relative h-80 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-md">
                      {/* 使用 CSS 實現簡單的圓餅圖 */}
                      <svg viewBox="-20 0 240 200" className="w-full h-full overflow-visible">
                        {(() => {
                          let currentAngle = 0;
                          const segments = [];
                          const labels = [];
                          const colors = [
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#8B5CF6',
                            '#EC4899',
                            '#06B6D4',
                            '#84CC16',
                          ];

                          // 為每張卡片生成固定顏色（基於 cardId）
                          const getCardColor = (cardId: string) => {
                            let hash = 0;
                            for (let i = 0; i < cardId.length; i++) {
                              hash = cardId.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            return colors[Math.abs(hash) % colors.length];
                          };

                          // 為每個有籌碼的卡片創建扇形（按 cardId 排序以保持固定順序）
                          const sortedCardIds = Array.from(usedCardIds).sort();
                          sortedCardIds.forEach((cardId) => {
                            const cardArea = lifeAreas[cardId];
                            const tokens = cardArea?.tokens || 0;
                            if (tokens === 0) return;

                            const card = mainDeck?.cards?.find((c: any) => c.id === cardId);
                            const percentage = (tokens / totalTokens) * 100;
                            const angle = (percentage / 100) * 360;
                            const color = getCardColor(cardId);

                            // 計算路徑
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            const midAngle = startAngle + angle / 2;
                            currentAngle = endAngle;

                            const largeArcFlag = angle > 180 ? 1 : 0;

                            const centerX = 100;
                            const centerY = 100;
                            const radius = 60;
                            const labelRadius = 80;

                            const startX =
                              centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                            const startY =
                              centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

                            // 標籤位置
                            const labelX =
                              centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
                            const labelY =
                              centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

                            segments.push(
                              <g key={cardId}>
                                <path
                                  d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                  fill={color}
                                  stroke="white"
                                  strokeWidth="2"
                                  className="transition-all duration-300 hover:opacity-80"
                                />
                                {/* 標籤線條 */}
                                <line
                                  x1={centerX + radius * Math.cos((midAngle * Math.PI) / 180)}
                                  y1={centerY + radius * Math.sin((midAngle * Math.PI) / 180)}
                                  x2={labelX}
                                  y2={labelY}
                                  stroke={color}
                                  strokeWidth="1.5"
                                />
                                {/* 標籤文字 */}
                                <text
                                  x={labelX}
                                  y={labelY}
                                  fill={color}
                                  fontSize="10"
                                  fontWeight="600"
                                  textAnchor={labelX > centerX ? 'start' : 'end'}
                                  dominantBaseline="middle"
                                  className="pointer-events-none"
                                >
                                  {card?.title || cardId}
                                </text>
                                <text
                                  x={labelX}
                                  y={labelY + 10}
                                  fill={color}
                                  fontSize="9"
                                  fontWeight="500"
                                  textAnchor={labelX > centerX ? 'start' : 'end'}
                                  dominantBaseline="middle"
                                  className="pointer-events-none"
                                >
                                  {percentage.toFixed(1)}%
                                </text>
                              </g>
                            );
                          });

                          // 如果還有未使用的籌碼，添加灰色扇形
                          if (remainingTokens > 0) {
                            const percentage = (remainingTokens / totalTokens) * 100;
                            const angle = (percentage / 100) * 360;

                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;

                            const largeArcFlag = angle > 180 ? 1 : 0;

                            const centerX = 100;
                            const centerY = 100;
                            const radius = 60;

                            const startX =
                              centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                            const startY =
                              centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

                            segments.push(
                              <path
                                key="remaining"
                                d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                fill="#E5E7EB"
                                stroke="white"
                                strokeWidth="2"
                                className="transition-all duration-300"
                              />
                            );
                          }

                          return segments;
                        })()}
                      </svg>

                      {/* 中心文字 */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center bg-white dark:bg-gray-100 rounded-full w-32 h-32 md:w-36 md:h-36 flex flex-col items-center justify-center shadow-sm">
                          {/* 分數形式顯示 */}
                          <div className="flex flex-col items-center leading-none">
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-900">
                              {usedTokens}
                            </div>
                            <div className="w-full h-0.5 bg-gray-400 dark:bg-gray-500 my-1.5"></div>
                            <div className="text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-700">
                              {totalTokens}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 圖例 */}
                  <div className="grid grid-cols-1 gap-3 text-sm md:text-base">
                    {Array.from(usedCardIds)
                      .sort()
                      .map((cardId) => {
                        const card = mainDeck?.cards?.find((c: any) => c.id === cardId);
                        const cardArea = lifeAreas[cardId];
                        const tokens = cardArea?.tokens || 0;
                        if (tokens === 0) return null;

                        const colors = [
                          '#3B82F6',
                          '#10B981',
                          '#F59E0B',
                          '#EF4444',
                          '#8B5CF6',
                          '#EC4899',
                          '#06B6D4',
                          '#84CC16',
                        ];

                        // 使用相同的 hash 函數確保顏色一致
                        const getCardColor = (id: string) => {
                          let hash = 0;
                          for (let i = 0; i < id.length; i++) {
                            hash = id.charCodeAt(i) + ((hash << 5) - hash);
                          }
                          return colors[Math.abs(hash) % colors.length];
                        };

                        const percentage =
                          totalTokens > 0 ? ((tokens / totalTokens) * 100).toFixed(1) : '0';

                        return (
                          <div
                            key={cardId}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                          >
                            <div
                              className="w-4 h-4 md:w-5 md:h-5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCardColor(cardId) }}
                            />
                            <div className="flex-1 text-gray-700 dark:text-gray-700 font-medium">
                              {card?.title || '未知'}
                            </div>
                            <div className="text-gray-900 dark:text-gray-900 font-semibold text-base md:text-lg">
                              {percentage}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-600 text-center">
                    尚未分配籌碼
                    <br />
                    <span className="text-sm">請先選擇卡片並分配籌碼</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
};

export default LifeTransformationGame;
