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
import { Briefcase, Star, X, AlertCircle, Settings, Lock, Unlock } from 'lucide-react';
import CardItem from './CardItem';

interface CollectionCanvasProps {
  cards?: CardData[];
  onCardCollect?: (cardId: string, collected: boolean) => void;
  maxCards?: number;
  onMaxCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
}

const CollectionCanvas: React.FC<CollectionCanvasProps> = ({
  cards = [],
  onCardCollect,
  maxCards = 15,
  onMaxCardsChange,
  isRoomOwner = false,
  className = '',
}) => {
  // 收藏的卡片ID列表
  const [collectedCardIds, setCollectedCardIds] = useState<string[]>([]);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  
  // 上限設定狀態
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempMaxCards, setTempMaxCards] = useState(maxCards);
  const [isLimitLocked, setIsLimitLocked] = useState(false);

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
  const hasCards = collectedCardIds.length > 0;
  
  // 當有卡片時自動鎖定上限
  const effectivelyLocked = isLimitLocked || hasCards;

  return (
    <div className={`w-full h-full p-6 ${className}`}>
      <div className="h-full relative">
        {/* 浮動計數器和設定 - 右上角 */}
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-2">
          {/* 上限設定區域 (僅房間擁有者可見) */}
          {isRoomOwner && (
            <div className="flex items-center space-x-1">
              {isEditingLimit ? (
                <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 border border-gray-200 dark:border-gray-700">
                  <input
                    type="number"
                    value={tempMaxCards}
                    onChange={(e) => setTempMaxCards(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-12 text-xs text-center bg-transparent border-none outline-none"
                    min="1"
                    max="50"
                  />
                  <button
                    onClick={() => {
                      onMaxCardsChange?.(tempMaxCards);
                      setIsEditingLimit(false);
                    }}
                    className="text-green-600 hover:text-green-700 p-0.5"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setTempMaxCards(maxCards);
                      setIsEditingLimit(false);
                    }}
                    className="text-red-600 hover:text-red-700 p-0.5"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!effectivelyLocked) {
                      setTempMaxCards(maxCards);
                      setIsEditingLimit(true);
                    }
                  }}
                  className={`p-1.5 rounded-full transition-colors ${
                    effectivelyLocked 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={effectivelyLocked}
                  title={
                    hasCards && !isLimitLocked
                      ? '有卡片時無法調整上限'
                      : isLimitLocked 
                      ? '上限已鎖定' 
                      : '設定上限'
                  }
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
              
              {/* 鎖定/解鎖按鈕 */}
              <button
                onClick={() => {
                  if (!hasCards) {
                    setIsLimitLocked(!isLimitLocked);
                  }
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  hasCards
                    ? 'bg-yellow-500 text-white cursor-default'
                    : isLimitLocked
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
                title={
                  hasCards
                    ? '有卡片時自動鎖定'
                    : isLimitLocked 
                    ? '解除鎖定' 
                    : '鎖定上限'
                }
              >
                {effectivelyLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
          )}
          
          {/* 計數器 */}
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
            {effectivelyLocked && <Lock className="w-3 h-3 ml-1 inline" />}
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
                {isRoomOwner && !effectivelyLocked && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 block mt-1">
                    (作為房間擁有者可調整上限)
                  </span>
                )}
                {isRoomOwner && hasCards && !isLimitLocked && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 block mt-1">
                    (有卡片時自動鎖定上限)
                  </span>
                )}
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
