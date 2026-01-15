/**
 * GrowthPlanCanvas - 成長計畫畫布元件
 *
 * 用於職能盤點卡的成長計畫玩法
 * 將職能卡（卡片A）和行動卡（卡片B）結合，填寫成長計畫
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Plus, X, FileText, Target, Zap } from 'lucide-react';
import CardItem from '../game-cards/CardItem';
import { Textarea } from '@/components/ui/textarea';
import DropZone from '../common/DropZone';

interface GrowthPlanCanvasProps {
  cards?: CardData[];
  onCardUse?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  onPlanCreate?: (cardAId: string, cardBId: string, plan: string) => void;
  onPlanTextChange?: (text: string) => void;
  className?: string;
  skillCards?: string[]; // 外部技能卡狀態
  actionCards?: string[]; // 外部行動卡狀態
  planText?: string; // 外部計畫文字狀態
  draggedByOthers?: Map<string, string>; // 同步相關
  onDragStart?: (cardId: string) => void; // 同步相關
  onDragEnd?: (cardId: string) => void; // 同步相關
  isReadOnly?: boolean; // 是否為唯讀模式
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
  onPlanTextChange,
  className = '',
  skillCards = [],
  actionCards = [],
  planText = '',
  isReadOnly = false,
}) => {
  // 處理職能卡（A區）
  const handleCardAAdd = (cardId: string) => {
    onCardUse?.(cardId);
    checkAndCreatePlan([cardId], actionCards, planText);
  };

  const handleCardARemove = (cardId: string) => {
    onCardRemove?.(cardId);
  };

  // 處理行動卡（B區）
  const handleCardBAdd = (cardId: string) => {
    onCardUse?.(cardId);
    checkAndCreatePlan(skillCards, [cardId], planText);
  };

  const handleCardBRemove = (cardId: string) => {
    onCardRemove?.(cardId);
  };

  // 檢查並創建計畫
  const checkAndCreatePlan = (aCards: string[], bCards: string[], text: string) => {
    if (aCards.length > 0 && bCards.length > 0 && text.trim()) {
      onPlanCreate?.(aCards[0], bCards[0], text);
    }
  };

  // 更新計畫文字
  const updatePlanText = (text: string) => {
    onPlanTextChange?.(text);
    checkAndCreatePlan(skillCards, actionCards, text);
  };

  // 過濾職能卡和行動卡 - 使用 category 判斷
  const availableSkillCards = cards.filter((card) => card.category === 'mindset');
  const availableActionCards = cards.filter((card) => card.category === 'action');

  return (
    <div className={`w-full h-full overflow-y-auto p-6 ${className}`}>
      <div className="min-h-full flex flex-col space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* 職能卡 A區 */}
            <div className="flex justify-center">
              <DropZone
                id="cardA"
                cards={availableSkillCards}
                placedCardIds={skillCards}
                maxCards={1}
                allowedCardTypes={['mindset_']} // 只允許職能卡
                title="職能卡"
                subtitle="選擇要發展的技能"
                icon={Target}
                emptyMessage="拖曳職能卡到此處"
                emptySubMessage=""
                dragOverColor="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                showCardNumbers={false}
                showRemoveButton={true}
                allowReorder={false}
                showCounter={false}
                compactMode={true}
                cardWidth="135px"
                cardHeight="240px"
                onCardAdd={handleCardAAdd}
                onCardRemove={handleCardARemove}
                className="w-64 h-96"
                headerClassName="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
                contentClassName="flex items-center justify-center"
              />
            </div>

            {/* 加號 */}
            <div className="flex justify-center">
              <Plus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>

            {/* 行動卡 B區 */}
            <div className="flex justify-center">
              <DropZone
                id="cardB"
                cards={availableActionCards}
                placedCardIds={actionCards}
                maxCards={1}
                allowedCardTypes={['action_']} // 只允許行動卡
                title="行動卡"
                subtitle="選擇具體行動方案"
                icon={Zap}
                emptyMessage="拖曳行動卡到此處"
                emptySubMessage=""
                dragOverColor="border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                showCardNumbers={false}
                showRemoveButton={true}
                allowReorder={false}
                showCounter={false}
                compactMode={true}
                cardWidth="135px"
                cardHeight="240px"
                onCardAdd={handleCardBAdd}
                onCardRemove={handleCardBRemove}
                className="w-64 h-96"
                headerClassName="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20"
                contentClassName="flex items-center justify-center"
              />
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
                {isReadOnly ? (
                  // 訪客看到的是閱讀區域
                  <div className="min-h-[100px] p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                    {planText ? (
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {planText}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">
                        等待諮詢師輸入成長計畫...
                      </p>
                    )}
                  </div>
                ) : (
                  // 諮詢師看到的是輸入區域
                  <Textarea
                    value={planText}
                    onChange={(e) => updatePlanText(e.target.value)}
                    placeholder="以輸入文字方式，填入成長計畫..."
                    className="min-h-[100px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthPlanCanvas;
