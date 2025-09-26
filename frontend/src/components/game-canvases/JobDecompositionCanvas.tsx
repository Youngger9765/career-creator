/**
 * JobDecompositionCanvas - 職位拆解畫布元件
 *
 * 左側：單一拖放區域，用於職能卡片分析
 * 右側：PDF/圖片上傳區域，用於職位說明文件
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { FileText, AlertCircle } from 'lucide-react';
import CardItem from './CardItem';
import PDFUploader from '@/components/common/PDFUploader';

interface JobDecompositionCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, zone: string | null) => void;
  onFileUpload?: (file: File) => void;
  maxCards?: number;
  isRoomOwner?: boolean;
  className?: string;
}

const JobDecompositionCanvas: React.FC<JobDecompositionCanvasProps> = ({
  cards = [],
  onCardMove,
  onFileUpload,
  maxCards = 10,
  isRoomOwner = false,
  className = '',
}) => {
  const [placedCards, setPlacedCards] = useState<string[]>([]);
  const [dragOverZone, setDragOverZone] = useState<boolean>(false);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    setDragOverZone(false);
    setDragOverPosition(null);

    const cardId = e.dataTransfer.getData('cardId');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex') || '-1');

    // 檢查是否已經存在該卡片
    const cardExists = placedCards.includes(cardId);

    // 檢查是否超過限制
    if (placedCards.length >= maxCards && !cardExists) {
      return;
    }

    // 更新本地狀態
    setPlacedCards((prev) => {
      let newCards = prev.filter((id) => id !== cardId);

      // 根據是否有插入位置來決定如何添加
      if (insertIndex !== undefined && sourceIndex !== -1) {
        // 內部重新排序
        let adjustedIndex = insertIndex;
        if (sourceIndex < insertIndex) {
          adjustedIndex = Math.max(0, insertIndex - 1);
        }
        newCards.splice(adjustedIndex, 0, cardId);
      } else {
        // 外部拖入，添加到末尾
        newCards.push(cardId);
      }

      return newCards;
    });

    // 通知父元件
    onCardMove?.(cardId, 'job-canvas');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  // 內部卡片開始拖放
  const handleCardDragStart = (e: React.DragEvent, cardId: string, index: number) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceIndex', index.toString());
  };

  const isOverLimit = placedCards.length >= maxCards;

  return (
    <div className={`w-full h-full flex ${className}`}>
      {/* 左側 - 職能卡片拖放區域 */}
      <div className="flex-1 p-4 min-w-0">
        <div
          className={`
            h-full flex flex-col rounded-xl border-2 transition-all duration-200 overflow-hidden
            ${
              dragOverZone && !isOverLimit
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
          `}
          onDrop={(e) => handleDrop(e)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* 區域標題 - 固定高度 */}
          <div className="flex-shrink-0 px-4 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">職能分析區</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    拖曳卡片到此處進行職位分析
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`
                    text-sm font-medium px-2 py-1 rounded flex items-center space-x-1
                    ${
                      isOverLimit
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  <span>
                    {placedCards.length} / {maxCards}
                  </span>
                </span>
                {isOverLimit && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          </div>

          {/* 卡片區域 */}
          <div className="flex-1 p-3 overflow-y-auto">
            {placedCards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <FileText className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">拖曳卡片到此處</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  最多可放 {maxCards} 張卡片
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-start">
                {placedCards.map((cardId, index) => {
                  const card = cards.find((c) => c.id === cardId);
                  if (!card) return null;

                  const showInsertLineBefore = dragOverPosition === index;
                  const showInsertLineAfter =
                    dragOverPosition === index + 1 && index === placedCards.length - 1;

                  return (
                    <React.Fragment key={cardId}>
                      {showInsertLineBefore && (
                        <div className="w-0.5 h-20 bg-blue-500 animate-pulse" />
                      )}
                      <div
                        className="relative w-[100px]"
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, cardId, index)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const insertIndex = x < rect.width / 2 ? index : index + 1;
                          setDragOverPosition(insertIndex);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const insertIndex = x < rect.width / 2 ? index : index + 1;
                          handleDrop(e, insertIndex);
                        }}
                      >
                        <div className="absolute -top-2 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center z-10">
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        </div>
                        <CardItem
                          id={card.id}
                          title={card.title}
                          description=""
                          category=""
                          showRemoveButton={true}
                          isDraggable={false}
                          onRemove={() => {
                            setPlacedCards((prev) => prev.filter((id) => id !== cardId));
                            onCardMove?.(cardId, null);
                          }}
                        />
                      </div>
                      {showInsertLineAfter && (
                        <div className="w-0.5 h-20 bg-blue-500 animate-pulse" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右側 - PDF上傳區域 */}
      <div className="w-96 p-4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <PDFUploader
          title="職位說明文件"
          subtitle="上傳 JD 或職位需求文件"
          onFileUpload={onFileUpload}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default JobDecompositionCanvas;
