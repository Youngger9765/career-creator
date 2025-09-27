/**
 * LifeTransformationGame - 生活改造王玩法
 *
 * 使用籌碼系統進行生活各領域的平衡規劃
 * 包含8個生活領域和100個籌碼分配
 */

'use client';

import React, { useState, useEffect } from 'react';
import GameLayout from '../common/GameLayout';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import { useGameState } from '@/stores/game-state-store';
import CardTokenWidget from './CardTokenWidget';
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
  const { state, updateCards } = useGameState(roomId, 'life');
  const [maxCards, setMaxCards] = useState(10);
  const [totalTokens, setTotalTokens] = useState(100);

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck('value_cards_36');
      setMainDeck(deck);
    };
    getDeck();
  }, []);

  // 處理卡片拖曳開始
  const handleCardDragStart = (cardId: string) => {
    console.log('Card drag started:', cardId);
  };

  // 處理拖放到畫布
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const lifeAreas = state.cardPlacements.lifeAreas || {};

    // 檢查是否已經有這張卡片
    const hasCard = Object.values(lifeAreas).some((area) => area.cards.includes(cardId));
    if (cardId && !hasCard) {
      handleCardAdd(cardId);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 從狀態計算已使用和剩餘籌碼
  const rawLifeAreas = state.cardPlacements.lifeAreas || {};

  // 數據遷移：清理舊的 "personal" 區域數據，將其轉換為新格式
  const migratedLifeAreas = { ...rawLifeAreas };
  if (migratedLifeAreas.personal && migratedLifeAreas.personal.cards) {
    // 將舊的 personal 區域中的卡片遷移到獨立區域
    const personalCards = migratedLifeAreas.personal.cards;
    const personalTokens = migratedLifeAreas.personal.tokens || 0;

    // 為每張卡片創建獨立區域
    personalCards.forEach((cardId: string, index: number) => {
      migratedLifeAreas[cardId] = {
        cards: [cardId],
        tokens: index === 0 ? personalTokens : 0, // 只給第一張卡片分配原來的籌碼
      };
    });

    // 刪除舊的 personal 區域
    delete migratedLifeAreas.personal;

    // 保存遷移後的數據
    updateCards({ lifeAreas: migratedLifeAreas });
  }

  const lifeAreas = migratedLifeAreas;
  const usedTokens = Object.values(lifeAreas).reduce((sum, area) => sum + area.tokens, 0);
  const remainingTokens = totalTokens - usedTokens;

  // 計算籌碼分配資料
  const tokenAllocations: TokenAllocation[] = Object.entries(lifeAreas)
    .filter(([_, area]) => area.tokens > 0)
    .map(([areaKey, area]) => ({
      area: areaKey,
      amount: area.tokens,
      percentage: (area.tokens / totalTokens) * 100,
    }));

  // 處理卡片添加 - 每張卡片創建獨立的生活領域
  const handleCardAdd = (cardId: string) => {
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
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    const currentLifeAreas = state.cardPlacements.lifeAreas || {};
    const updatedAreas = { ...currentLifeAreas };

    // 刪除該卡片對應的獨立領域
    delete updatedAreas[cardId];

    updateCards({ lifeAreas: updatedAreas });
  };

  // 計算已使用的卡片
  const usedCardIds = new Set<string>();
  Object.values(lifeAreas).forEach((area) => {
    area.cards.forEach((cardId) => usedCardIds.add(cardId));
  });

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

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
                        setMaxCards(parseInt(value) || 0);
                      }
                    }}
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
                        setTotalTokens(parseInt(value) || 0);
                      }
                    }}
                    className="w-16 h-8 text-center text-gray-900 dark:text-gray-900 bg-white dark:bg-white border-gray-300 dark:border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 左側：卡片籌碼分配區 */}
            <div className="space-y-4">
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
              <div className="space-y-4 overflow-y-auto">
                {Array.from(usedCardIds).map((cardId: string) => {
                  const card = mainDeck?.cards?.find((c: any) => c.id === cardId);
                  if (!card) return null;

                  // 從該卡片的獨立領域中獲取token數量
                  const cardArea = lifeAreas[cardId as string];
                  const cardTokens = cardArea ? cardArea.tokens : 0;

                  const allocation = {
                    area: cardId as string, // 使用卡片ID作為區域名稱
                    amount: cardTokens,
                    percentage: cardTokens,
                  };

                  return (
                    <CardTokenWidget
                      key={cardId as string}
                      card={card}
                      allocation={allocation}
                      maxTokens={totalTokens}
                      onAllocationChange={(amount) => {
                        // 更新該卡片獨立領域的token數量
                        const updatedAreas = { ...lifeAreas };
                        if (updatedAreas[cardId as string]) {
                          // 計算可用的剩餘籌碼（總籌碼 - 其他卡片已使用的籌碼）
                          const otherUsedTokens = Object.entries(updatedAreas)
                            .filter(([areaKey]) => areaKey !== cardId)
                            .reduce((sum, [_, area]) => sum + area.tokens, 0);
                          const maxAvailable = totalTokens - otherUsedTokens;

                          updatedAreas[cardId as string] = {
                            ...updatedAreas[cardId as string],
                            tokens: Math.min(amount, maxAvailable),
                          };
                        }
                        updateCards({ lifeAreas: updatedAreas });
                      }}
                      onRemove={() => handleCardRemove(cardId as string)}
                    />
                  );
                })}
              </div>
            </div>

            {/* 右側：視覺化展示區 */}
            <div className="space-y-4">
              {/* 圓餅圖區域 */}
              <div className="bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-300 p-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-900 mb-3 text-center">
                  籌碼分配圓餅圖
                </h3>
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {usedTokens > 0 ? (
                        (() => {
                          let cumulativeAngle = 0;
                          const colors = [
                            '#22c55e',
                            '#3b82f6',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#06b6d4',
                            '#f97316',
                            '#84cc16',
                            '#ec4899',
                            '#6366f1',
                          ];

                          // 從lifeAreas創建分配數據
                          const allocations = Object.entries(lifeAreas)
                            .filter(([_, area]) => area.tokens > 0)
                            .map(([areaKey, area]) => ({
                              area: areaKey,
                              amount: area.tokens,
                              cards: area.cards,
                            }));

                          return allocations.map((allocation, index) => {
                            const percentage = (allocation.amount / totalTokens) * 100;
                            const angle = (percentage / 100) * 360;
                            const startAngle = cumulativeAngle;
                            const endAngle = cumulativeAngle + angle;

                            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                            const endAngleRad = (endAngle - 90) * (Math.PI / 180);

                            const x1 = 100 + 80 * Math.cos(startAngleRad);
                            const y1 = 100 + 80 * Math.sin(startAngleRad);
                            const x2 = 100 + 80 * Math.cos(endAngleRad);
                            const y2 = 100 + 80 * Math.sin(endAngleRad);

                            const largeArc = angle > 180 ? 1 : 0;

                            const pathData = [
                              `M 100 100`,
                              `L ${x1} ${y1}`,
                              `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                              'Z',
                            ].join(' ');

                            cumulativeAngle += angle;

                            return (
                              <g key={allocation.area}>
                                <path
                                  d={pathData}
                                  fill={colors[index % colors.length]}
                                  stroke="white"
                                  strokeWidth="2"
                                />
                                {percentage > 5 && (
                                  <text
                                    x={
                                      100 +
                                      50 * Math.cos((startAngle + angle / 2 - 90) * (Math.PI / 180))
                                    }
                                    y={
                                      100 +
                                      50 * Math.sin((startAngle + angle / 2 - 90) * (Math.PI / 180))
                                    }
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs font-medium fill-white"
                                  >
                                    {allocation.amount}
                                  </text>
                                )}
                              </g>
                            );
                          });
                        })()
                      ) : (
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="#f3f4f6"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                      )}

                      {/* 中心圓 */}
                      <circle
                        cx="100"
                        cy="100"
                        r="25"
                        fill="white"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="95"
                        textAnchor="middle"
                        className="text-sm font-bold fill-gray-900"
                      >
                        {usedTokens}
                      </text>
                      <text x="100" y="110" textAnchor="middle" className="text-xs fill-gray-600">
                        / {totalTokens}
                      </text>
                    </svg>
                  </div>
                </div>

                {/* 圖例 */}
                {tokenAllocations.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {tokenAllocations
                      .filter((a) => a.amount > 0)
                      .map((allocation, index) => {
                        const colors = [
                          '#22c55e',
                          '#3b82f6',
                          '#f59e0b',
                          '#ef4444',
                          '#8b5cf6',
                          '#06b6d4',
                          '#f97316',
                          '#84cc16',
                          '#ec4899',
                          '#6366f1',
                        ];
                        const card = mainDeck?.cards?.find((c: any) => c.id === allocation.area);
                        return (
                          <div key={allocation.area} className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-700 truncate flex-1">
                              {card?.title || allocation.area}
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-900">
                              {allocation.amount}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-300 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4 text-center">
                  價值觀分配概覽
                </h3>
                {tokenAllocations.length > 0 ? (
                  <div className="space-y-3">
                    {tokenAllocations.map((allocation) => {
                      const card = mainDeck?.cards?.find((c: any) => c.id === allocation.area);
                      return (
                        <div key={allocation.area} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-700 truncate flex-1">
                            {card?.title || allocation.area}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${allocation.amount}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-900 w-8">
                              {allocation.amount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-600">總計分配:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-900">
                          {usedTokens} / {totalTokens}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-700 dark:text-gray-700 py-8">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>拖曳價值卡開始分配籌碼</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default LifeTransformationGame;
