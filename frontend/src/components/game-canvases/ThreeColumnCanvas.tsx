/**
 * ThreeColumnCanvas - 三欄分類畫布元件
 *
 * 用於職游旅人卡的六大性格分析玩法
 * 提供喜歡、中立、不喜歡三個欄位進行牌卡分類
 */

'use client';

import React, { useState, Fragment } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Heart, Meh, ThumbsDown, X } from 'lucide-react';
import CardItem from './CardItem';

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

  // 狀態管理內部拖放
  const [dragOverPosition, setDragOverPosition] = useState<{
    column: string;
    index: number;
  } | null>(null);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);

  const handleDrop = (
    e: React.DragEvent,
    column: 'like' | 'neutral' | 'dislike',
    insertIndex?: number
  ) => {
    e.preventDefault();
    setDragOverPosition(null);
    setIsDraggingInternal(false);

    const cardId = e.dataTransfer.getData('cardId');
    const sourceColumn = e.dataTransfer.getData('sourceColumn');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex') || '-1');

    console.log('Drop:', { cardId, column, insertIndex, sourceColumn, sourceIndex });

    // 更新本地狀態
    setColumns((prev) => {
      // 從所有欄位移除這張卡片
      const newColumns = {
        like: prev.like.filter((id) => id !== cardId),
        neutral: prev.neutral.filter((id) => id !== cardId),
        dislike: prev.dislike.filter((id) => id !== cardId),
      };

      // 如果指定了插入位置
      if (insertIndex !== undefined) {
        const targetArray = [...newColumns[column]];

        // 如果是在同一列內移動，且原位置在插入位置之前，需要調整索引
        let finalIndex = insertIndex;
        if (sourceColumn === column && sourceIndex !== -1 && sourceIndex < insertIndex) {
          finalIndex = insertIndex - 1;
        }

        // 在指定位置插入卡片
        targetArray.splice(finalIndex, 0, cardId);
        newColumns[column] = targetArray;

        console.log('Inserted at index:', finalIndex, 'Result:', targetArray);
      } else {
        // 沒有指定位置，加到末尾
        newColumns[column] = [...newColumns[column], cardId];
        console.log('Added to end');
      }

      return newColumns;
    });

    // 通知父元件
    onCardMove?.(cardId, column);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  // 內部卡片開始拖放
  const handleCardDragStart = (
    e: React.DragEvent,
    cardId: string,
    column: string,
    index: number
  ) => {
    setIsDraggingInternal(true);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColumn', column);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
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
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(e, column.id as 'like' | 'neutral' | 'dislike');
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
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
              <div className="flex-1 p-2 overflow-y-auto min-h-[300px]">
                {columnCards.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 dark:text-gray-600 text-sm">拖曳卡片到此處</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-start">
                    {columnCards.map((cardId, index) => {
                      const card = cards.find((c) => c.id === cardId);
                      if (!card) return null;

                      return (
                        <div key={cardId} className="relative">
                          {/* 插入指示線 - 卡片上方 */}
                          {dragOverPosition?.column === column.id &&
                            dragOverPosition?.index === index && (
                              <div className="absolute -top-1 left-0 w-full h-1 bg-blue-400 rounded z-10" />
                            )}

                          {/* 卡片 */}
                          <div
                            className="w-[65px] cursor-move"
                            draggable={true}
                            onDragStart={(e) => handleCardDragStart(e, cardId, column.id, index)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const insertIndex = y < rect.height / 2 ? index : index + 1;
                              setDragOverPosition({ column: column.id, index: insertIndex });
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const insertIndex = y < rect.height / 2 ? index : index + 1;
                              handleDrop(
                                e,
                                column.id as 'like' | 'neutral' | 'dislike',
                                insertIndex
                              );
                            }}
                          >
                            <CardItem
                              id={card.id}
                              title={card.title}
                              description=""
                              category={card.category}
                              showRemoveButton={true}
                              isDraggable={false}
                              onRemove={() => {
                                setColumns((prev) => ({
                                  ...prev,
                                  [column.id]: prev[column.id as keyof typeof prev].filter(
                                    (id) => id !== cardId
                                  ),
                                }));
                                onCardMove?.(cardId, null as any);
                              }}
                            />
                          </div>

                          {/* 插入指示線 - 卡片下方 */}
                          {dragOverPosition?.column === column.id &&
                            dragOverPosition?.index === index + 1 && (
                              <div className="absolute -bottom-1 left-0 w-full h-1 bg-blue-400 rounded z-10" />
                            )}
                        </div>
                      );
                    })}
                  </div>
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
