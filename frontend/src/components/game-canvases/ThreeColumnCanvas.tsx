/**
 * ThreeColumnCanvas - 三欄分類畫布元件
 *
 * 用於職游旅人卡的六大性格分析玩法
 * 提供喜歡、中立、不喜歡三個欄位進行牌卡分類
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Heart, Meh, ThumbsDown } from 'lucide-react';

interface ThreeColumnCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, column: 'like' | 'neutral' | 'dislike') => void;
  className?: string;
}

const ThreeColumnCanvas: React.FC<ThreeColumnCanvasProps> = ({
  cards = [],
  onCardMove,
  className = '',
}) => {
  const [columns, setColumns] = useState<{
    like: string[];
    neutral: string[];
    dislike: string[];
  }>({
    like: [],
    neutral: [],
    dislike: [],
  });

  const handleDrop = (e: React.DragEvent, column: 'like' | 'neutral' | 'dislike') => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');

    // 更新本地狀態
    setColumns((prev) => {
      // 從其他欄位移除
      const newColumns = {
        like: prev.like.filter((id) => id !== cardId),
        neutral: prev.neutral.filter((id) => id !== cardId),
        dislike: prev.dislike.filter((id) => id !== cardId),
      };

      // 加到新欄位
      newColumns[column] = [...newColumns[column], cardId];

      return newColumns;
    });

    // 通知父元件
    onCardMove?.(cardId, column);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const columnConfig = [
    {
      id: 'like',
      title: '喜歡',
      icon: Heart,
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-300 dark:border-green-700',
      headerBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'neutral',
      title: '中立',
      icon: Meh,
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      borderColor: 'border-gray-300 dark:border-gray-700',
      headerBg: 'bg-gray-100 dark:bg-gray-900',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
    {
      id: 'dislike',
      title: '不喜歡',
      icon: ThumbsDown,
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-300 dark:border-red-700',
      headerBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className={`w-full h-full p-4 ${className}`}>
      <div className="h-full grid grid-cols-3 gap-4">
        {columnConfig.map((column) => {
          const Icon = column.icon;
          const columnCards = columns[column.id as keyof typeof columns];

          return (
            <div
              key={column.id}
              className={`flex flex-col rounded-lg border-2 ${column.borderColor} ${column.bgColor} overflow-hidden`}
              onDrop={(e) => handleDrop(e, column.id as 'like' | 'neutral' | 'dislike')}
              onDragOver={handleDragOver}
            >
              {/* 欄位標題 */}
              <div
                className={`px-4 py-3 ${column.headerBg} border-b border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${column.iconColor}`} />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {column.title}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({columnCards.length})
                  </span>
                </div>
              </div>

              {/* 卡片區域 */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {columnCards.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 dark:text-gray-600 text-sm">拖曳卡片到此處</p>
                  </div>
                ) : (
                  columnCards.map((cardId) => {
                    const card = cards.find((c) => c.id === cardId);
                    if (!card) return null;

                    return (
                      <div
                        key={cardId}
                        className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {card.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {card.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeColumnCanvas;
