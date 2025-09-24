/**
 * CollectionCanvas - 職業收藏家畫布元件
 *
 * 用於職游旅人卡的職業收藏玩法
 * 提供一個空白收藏區，讓玩家拖曳卡片來收藏
 * 最多可收藏15張職業卡
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Briefcase, Star, X, AlertCircle } from 'lucide-react';
import CardItem from './CardItem';

interface CollectionCanvasProps {
  cards?: CardData[];
  onCardCollect?: (cardId: string, collected: boolean) => void;
  maxCards?: number;
  className?: string;
}

const CollectionCanvas: React.FC<CollectionCanvasProps> = ({
  cards = [],
  onCardCollect,
  maxCards = 15,
  className = '',
}) => {
  // 收藏的卡片ID列表
  const [collectedCardIds, setCollectedCardIds] = useState<string[]>([]);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);

  // 處理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(false);

    const cardId = e.dataTransfer.getData('cardId');

    // 檢查是否已收藏
    if (collectedCardIds.includes(cardId)) {
      return;
    }

    // 檢查是否超過限制
    if (collectedCardIds.length >= maxCards) {
      return;
    }

    // 添加到收藏
    setCollectedCardIds((prev) => [...prev, cardId]);
    onCardCollect?.(cardId, true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(true);
  };

  const handleDragLeave = () => {
    setDragOverCanvas(false);
  };

  // 移除卡片
  const removeCard = (cardId: string) => {
    setCollectedCardIds((prev) => prev.filter((id) => id !== cardId));
    onCardCollect?.(cardId, false);
  };

  // 獲取已收藏的卡片資料
  const collectedCards = collectedCardIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card) => card !== undefined) as CardData[];

  const isAtLimit = collectedCardIds.length >= maxCards;

  return (
    <div className={`w-full h-full p-6 ${className}`}>
      <div className="h-full relative">
        {/* 浮動計數器 - 右上角 */}
        <div className="absolute top-2 right-2 z-20">
          <div
            className={`
            px-3 py-1.5 rounded-full text-sm font-medium shadow-md
            ${
              isAtLimit
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }
          `}
          >
            {collectedCardIds.length} / {maxCards} 張
          </div>
        </div>

        {/* 收藏區 */}
        <div
          className={`
            h-full rounded-lg border-2 border-dashed transition-all duration-200
            ${
              dragOverCanvas && !isAtLimit
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
            }
            ${isAtLimit ? 'opacity-60' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {collectedCards.length === 0 ? (
            // 空狀態
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Star className="w-16 h-16 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                至多可以放 {maxCards} 張職業卡
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                從左側拖曳卡片到此處開始收藏
              </p>
            </div>
          ) : (
            // 已收藏的卡片
            <div className="p-6 h-full overflow-auto">
              <div
                className="grid grid-cols-2 gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
              >
                {collectedCards.map((card) => (
                  <div key={card.id} className="relative">
                    {/* 移除按鈕 */}
                    <button
                      onClick={() => removeCard(card.id)}
                      className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="移除"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <CardItem
                      id={card.id}
                      title={card.title}
                      description={card.description}
                      category={card.category}
                      isDraggable={false}
                      showRemoveButton={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionCanvas;
