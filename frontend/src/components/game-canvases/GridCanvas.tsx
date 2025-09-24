/**
 * GridCanvas - 3x3九宮格畫布元件
 *
 * 用於價值導航卡的價值觀排序玩法
 * 提供3x3的九宮格，根據重要性進行排列
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Grid3x3, Star, Circle, Square } from 'lucide-react';

interface GridCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, position: { row: number; col: number }) => void;
  className?: string;
}

interface GridCell {
  row: number;
  col: number;
  cardId: string | null;
  importance: 'high' | 'medium' | 'low';
  label: string;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ cards = [], onCardMove, className = '' }) => {
  // 初始化九宮格
  const initializeGrid = (): GridCell[][] => {
    const importanceMap = {
      0: 'high',
      1: 'medium',
      2: 'low',
    } as const;

    const labels = [
      ['最重要', '很重要', '重要'],
      ['較重要', '一般重要', '稍微重要'],
      ['不太重要', '不重要', '最不重要'],
    ];

    const grid: GridCell[][] = [];
    for (let row = 0; row < 3; row++) {
      grid[row] = [];
      for (let col = 0; col < 3; col++) {
        grid[row][col] = {
          row,
          col,
          cardId: null,
          importance: (row === 0 ? 'high' : row === 1 ? 'medium' : 'low') as
            | 'high'
            | 'medium'
            | 'low',
          label: labels[row][col],
        };
      }
    }
    return grid;
  };

  const [grid, setGrid] = useState<GridCell[][]>(initializeGrid());
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverCell(null);

    const cardId = e.dataTransfer.getData('cardId');

    // 更新格子
    setGrid((prev) => {
      const newGrid = prev.map((r) => r.map((c) => ({ ...c })));

      // 清除原位置
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (newGrid[r][c].cardId === cardId) {
            newGrid[r][c].cardId = null;
          }
        }
      }

      // 設定新位置
      newGrid[row][col].cardId = cardId;

      return newGrid;
    });

    // 通知父元件
    onCardMove?.(cardId, { row, col });
  };

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverCell({ row, col });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const getCellStyle = (cell: GridCell) => {
    const isDraggingOver = dragOverCell?.row === cell.row && dragOverCell?.col === cell.col;

    const baseStyles = {
      high: {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-300 dark:border-red-700',
        dragOver: 'bg-red-100 dark:bg-red-900 border-red-500',
      },
      medium: {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-300 dark:border-yellow-700',
        dragOver: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500',
      },
      low: {
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-300 dark:border-green-700',
        dragOver: 'bg-green-100 dark:bg-green-900 border-green-500',
      },
    };

    const style = baseStyles[cell.importance];

    if (isDraggingOver) {
      return `${style.dragOver} border-2`;
    }

    return `${style.bg} ${style.border} border`;
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return <Star className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Circle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Square className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  // 計算統計資訊
  const getStats = () => {
    let filled = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.cardId) {
          filled++;
          if (cell.importance === 'high') high++;
          else if (cell.importance === 'medium') medium++;
          else if (cell.importance === 'low') low++;
        }
      });
    });

    return { filled, high, medium, low };
  };

  const stats = getStats();

  return (
    <div className={`w-full h-full p-4 ${className}`}>
      <div className="h-full flex flex-col">
        {/* 標題和統計 */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Grid3x3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">價值觀九宮格</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">依重要性排列你的價值觀</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.high}/3</span>
              </div>
              <div className="flex items-center space-x-2">
                <Circle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.medium}/3</span>
              </div>
              <div className="flex items-center space-x-2">
                <Square className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.low}/3</span>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stats.filled}/9 已填
              </div>
            </div>
          </div>
        </div>

        {/* 九宮格 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3 w-full max-w-3xl aspect-square">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const card = cell.cardId ? cards.find((c) => c.id === cell.cardId) : null;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      relative rounded-lg p-3 transition-all duration-200
                      flex flex-col justify-between
                      ${getCellStyle(cell)}
                      ${!card ? 'hover:shadow-md' : ''}
                    `}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
                    onDragLeave={handleDragLeave}
                  >
                    {/* 格子標籤 */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1">
                      {getImportanceIcon(cell.importance)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">{cell.label}</span>
                    </div>

                    {/* 卡片內容 */}
                    {card ? (
                      <div
                        className="mt-6 bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm border border-gray-200 dark:border-gray-700"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('cardId', card.id);
                        }}
                      >
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          {card.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center mt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                            <Grid3x3 className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-600">拖曳卡片</p>
                        </div>
                      </div>
                    )}

                    {/* 位置指示 */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-xs text-gray-400 dark:text-gray-600">
                        {rowIndex + 1},{colIndex + 1}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 說明文字 */}
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>上方代表最重要的價值觀，下方代表較不重要的價值觀</p>
        </div>
      </div>
    </div>
  );
};

export default GridCanvas;
