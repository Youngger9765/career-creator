/**
 * GridCanvas - 3+1格局畫布元件
 *
 * 用於價值導航卡的價值觀排序玩法
 * 提供3個上方格子和1個下方大格子
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Star, Circle, Square, X, Grid3x3 } from 'lucide-react';
import CardItem from '../game-cards/CardItem';

interface GridCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, position: { row: number; col: number }) => void;
  className?: string;
}

interface GridCell {
  id: string;
  cardId: string | null;
  cardIds?: string[]; // For bottom area to support multiple cards
  label: string;
  type: 'top' | 'bottom';
}

const GridCanvas: React.FC<GridCanvasProps> = ({ cards = [], onCardMove, className = '' }) => {
  // 初始化3+1格局
  const initializeCells = (): GridCell[] => {
    return [
      { id: 'top1', cardId: null, label: '第一名', type: 'top' },
      { id: 'top2', cardId: null, label: '第二名', type: 'top' },
      { id: 'top3', cardId: null, label: '第三名', type: 'top' },
      { id: 'others', cardId: null, cardIds: [], label: '其他', type: 'bottom' },
    ];
  };

  const [cells, setCells] = useState<GridCell[]>(initializeCells());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // 處理拖放
  const handleDrop = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(null);

    const cardId = e.dataTransfer.getData('cardId');

    // 檢查卡片是否已在其他格子中
    const cardExists = cells.some((cell) => {
      if (cell.type === 'top') {
        return cell.cardId === cardId;
      } else {
        return cell.cardIds?.includes(cardId);
      }
    });

    if (cardExists) {
      return; // 卡片已存在，不允許重複放置
    }

    setCells((prev) => {
      return prev.map((cell) => {
        if (cell.id === cellId) {
          // 如果是「其他」區域，可以有多張卡片（最多6張）
          if (cell.type === 'bottom') {
            const currentCards = cell.cardIds || [];
            if (currentCards.length >= 6) {
              return cell; // 已達到上限
            }
            return { ...cell, cardIds: [...currentCards, cardId] };
          }
          // 如果目標格子已有卡片，不允許覆蓋
          if (cell.cardId) {
            return cell;
          }
          return { ...cell, cardId };
        }
        return cell;
      });
    });

    const cellIndex = cells.findIndex((c) => c.id === cellId);
    if (cellIndex !== -1) {
      onCardMove?.(cardId, { row: 0, col: cellIndex });
    }
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const getCellStyle = (cell: GridCell) => {
    const isDraggingOver = dragOverCell === cell.id;

    if (cell.type === 'top') {
      const baseStyle = 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700';
      const dragOverStyle = 'bg-blue-100 dark:bg-blue-900 border-blue-500';
      return isDraggingOver ? `${dragOverStyle} border-2` : `${baseStyle} border-2`;
    } else {
      const baseStyle = 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700';
      const dragOverStyle = 'bg-green-100 dark:bg-green-900 border-green-500';
      return isDraggingOver ? `${dragOverStyle} border-2` : `${baseStyle} border-2`;
    }
  };

  return (
    <div className={`w-full h-full p-6 ${className}`}>
      <div className="h-full flex flex-col space-y-4">
        {/* 前三名區域 */}
        <div className="grid grid-cols-3 gap-4">
          {cells
            .filter((cell) => cell.type === 'top')
            .map((cell) => {
              const card = cards.find((c) => c.id === cell.cardId);
              return (
                <div
                  key={cell.id}
                  className={`
                  relative h-48 rounded-lg p-4 transition-all duration-200
                  ${getCellStyle(cell)}
                  ${cell.cardId ? 'shadow-md' : 'border-dashed'}
                `}
                  onDrop={(e) => handleDrop(e, cell.id)}
                  onDragOver={(e) => handleDragOver(e, cell.id)}
                  onDragLeave={handleDragLeave}
                >
                  {/* 位置標籤 */}
                  <div className="absolute top-3 left-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cell.label}
                    </span>
                  </div>

                  {/* 卡片內容 */}
                  {card ? (
                    <div className="mt-8 h-full flex items-center justify-center">
                      <button
                        onClick={() => {
                          setCells((prev) =>
                            prev.map((c) => (c.id === cell.id ? { ...c, cardId: null } : c))
                          );
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="text-center">
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                          {card.title}
                        </div>
                        {card.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                            {card.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                          <Star className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-600">拖曳卡片到此</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* 其他區域 */}
        <div className="flex-1">
          {cells
            .filter((cell) => cell.type === 'bottom')
            .map((cell) => {
              const cellCards = (cell.cardIds || [])
                .map((id) => cards.find((c) => c.id === id))
                .filter(Boolean) as CardData[];
              return (
                <div
                  key={cell.id}
                  className={`
                  relative h-full rounded-lg p-4 transition-all duration-200
                  ${getCellStyle(cell)}
                  ${cellCards.length > 0 ? 'shadow-md' : 'border-dashed'}
                `}
                  onDrop={(e) => handleDrop(e, cell.id)}
                  onDragOver={(e) => handleDragOver(e, cell.id)}
                  onDragLeave={handleDragLeave}
                >
                  {/* 位置標籤 */}
                  <div className="absolute top-3 left-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cell.label} ({cellCards.length}/6)
                    </span>
                  </div>

                  {/* 卡片內容 - 支持多張卡片 */}
                  {cellCards.length > 0 ? (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {cellCards.map((card, index) => (
                        <div key={card.id} className="relative">
                          <button
                            onClick={() => {
                              setCells((prev) =>
                                prev.map((c) => {
                                  if (c.id === cell.id) {
                                    return {
                                      ...c,
                                      cardIds: c.cardIds?.filter((id) => id !== card.id) || [],
                                    };
                                  }
                                  return c;
                                })
                              );
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 min-w-[150px]">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {card.title}
                            </div>
                            {card.description && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {card.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                          <Square className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-600">
                          拖曳其他卡片到此區域（最多6張）
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default GridCanvas;
