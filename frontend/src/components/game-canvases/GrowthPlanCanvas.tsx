/**
 * GrowthPlanCanvas - 成長計畫畫布元件
 *
 * 用於職能盤點卡的成長計畫玩法
 * 將優勢（卡片A）和劣勢（卡片B）結合，填寫成長計畫
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Plus, X, FileText } from 'lucide-react';
import CardItem from './CardItem';
import { Textarea } from '@/components/ui/textarea';

interface GrowthPlanCanvasProps {
  cards?: CardData[];
  onCardUse?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  onPlanCreate?: (cardAId: string, cardBId: string, plan: string) => void;
  className?: string;
}

interface GrowthPlan {
  cardA: CardData | null;
  cardB: CardData | null;
  planText: string;
}

const GrowthPlanCanvas: React.FC<GrowthPlanCanvasProps> = ({
  cards = [],
  onCardUse,
  onCardRemove,
  onPlanCreate,
  className = '',
}) => {
  const [plan, setPlan] = useState<GrowthPlan>({
    cardA: null,
    cardB: null,
    planText: '',
  });
  const [dragTarget, setDragTarget] = useState<'A' | 'B' | null>(null);

  // 處理拖放
  const handleDrop = (e: React.DragEvent, slot: 'A' | 'B') => {
    e.preventDefault();
    setDragTarget(null);

    const cardId = e.dataTransfer.getData('cardId');
    const card = cards.find((c) => c.id === cardId);

    if (!card) {
      return;
    }

    // 檢查卡片是否已經被使用
    const isCardUsed = plan.cardA?.id === cardId || plan.cardB?.id === cardId;

    if (isCardUsed) {
      return;
    }

    setPlan((prev) => {
      // 如果原本有卡片，先通知移除
      const oldCardId = slot === 'A' ? prev.cardA?.id : prev.cardB?.id;
      if (oldCardId) {
        onCardRemove?.(oldCardId);
      }

      // 設定新卡片
      const newPlan = { ...prev };
      if (slot === 'A') {
        newPlan.cardA = card;
      } else {
        newPlan.cardB = card;
      }

      // 通知新卡片已使用
      onCardUse?.(cardId);

      return newPlan;
    });
  };

  const handleDragOver = (e: React.DragEvent, slot: 'A' | 'B') => {
    e.preventDefault();
    setDragTarget(slot);
  };

  const handleDragLeave = () => {
    setDragTarget(null);
  };

  // 移除卡片
  const removeCard = (slot: 'A' | 'B') => {
    setPlan((prev) => {
      const cardId = slot === 'A' ? prev.cardA?.id : prev.cardB?.id;
      if (cardId) {
        onCardRemove?.(cardId);
      }

      const newPlan = { ...prev };
      if (slot === 'A') {
        newPlan.cardA = null;
      } else {
        newPlan.cardB = null;
      }

      return newPlan;
    });
  };

  // 更新計畫文字
  const updatePlanText = (text: string) => {
    setPlan((prev) => {
      const newPlan = { ...prev, planText: text };

      // 當有兩張卡片和文字時，自動觸發回調
      if (newPlan.cardA && newPlan.cardB && text) {
        onPlanCreate?.(newPlan.cardA.id, newPlan.cardB.id, text);
      }

      return newPlan;
    });
  };

  return (
    <div className={`w-full h-full p-6 ${className}`}>
      <div className="h-full flex flex-col space-y-6 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* 卡片 A */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                卡片 A
              </div>
              <div
                className={`
                    relative w-40 h-52 rounded-lg border-2 border-dashed
                    transition-all duration-200
                    ${
                      dragTarget === 'A'
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-950 scale-105'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    }
                  `}
                onDrop={(e) => handleDrop(e, 'A')}
                onDragOver={(e) => handleDragOver(e, 'A')}
                onDragLeave={handleDragLeave}
              >
                {plan.cardA ? (
                  <>
                    <button
                      onClick={() => removeCard('A')}
                      className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="p-3 h-full bg-blue-500 dark:bg-blue-600 rounded-md">
                      <div className="text-sm font-medium text-white text-center">
                        {plan.cardA.title}
                      </div>
                      {plan.cardA.description && (
                        <div className="text-xs text-blue-100 mt-2 line-clamp-4">
                          {plan.cardA.description}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center px-4">
                      拖曳卡片到此
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 加號 */}
            <div className="flex justify-center">
              <Plus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>

            {/* 卡片 B */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                卡片 B
              </div>
              <div
                className={`
                    relative w-40 h-52 rounded-lg border-2 border-dashed
                    transition-all duration-200
                    ${
                      dragTarget === 'B'
                        ? 'border-orange-500 bg-orange-100 dark:bg-orange-950 scale-105'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    }
                  `}
                onDrop={(e) => handleDrop(e, 'B')}
                onDragOver={(e) => handleDragOver(e, 'B')}
                onDragLeave={handleDragLeave}
              >
                {plan.cardB ? (
                  <>
                    <button
                      onClick={() => removeCard('B')}
                      className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="p-3 h-full bg-orange-500 dark:bg-orange-600 rounded-md">
                      <div className="text-sm font-medium text-white text-center">
                        {plan.cardB.title}
                      </div>
                      {plan.cardB.description && (
                        <div className="text-xs text-orange-100 mt-2 line-clamp-4">
                          {plan.cardB.description}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center px-4">
                      拖曳卡片到此
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 等號和成長計畫 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="text-2xl text-gray-400 dark:text-gray-600 mt-2">=</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">成長計畫</span>
                </div>
                <Textarea
                  value={plan.planText}
                  onChange={(e) => updatePlanText(e.target.value)}
                  placeholder={
                    plan.cardA && plan.cardB
                      ? '以輸入文字方式，填入成長計畫...'
                      : '請先選擇卡片 A 和卡片 B'
                  }
                  className="min-h-[100px] resize-none"
                  disabled={!plan.cardA || !plan.cardB}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthPlanCanvas;
