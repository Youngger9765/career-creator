/**
 * CardTokenWidget - 卡片籌碼分配工具
 *
 * 將價值卡轉換為籌碼分配介面
 * 顯示卡片資訊和籌碼控制器
 */

'use client';

import React, { useState } from 'react';
import { Plus, Minus, X, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import CardModal from '@/components/common/CardModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TokenAllocation {
  area: string;
  amount: number;
  percentage: number;
}

interface CardTokenWidgetProps {
  card: CardData;
  allocation?: TokenAllocation;
  onAllocationChange: (amount: number) => void;
  onRemove: () => void;
  maxTokens?: number;
}

const CardTokenWidget: React.FC<CardTokenWidgetProps> = ({
  card,
  allocation,
  onAllocationChange,
  onRemove,
  maxTokens = 100,
}) => {
  const currentAmount = allocation?.amount || 0;
  const [inputValue, setInputValue] = useState(currentAmount.toString());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sortable setup
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 處理輸入框變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= maxTokens) {
      onAllocationChange(numValue);
    }
  };

  // 快速調整按鈕
  const handleQuickAdjust = (delta: number) => {
    const newValue = Math.max(0, Math.min(maxTokens, currentAmount + delta));
    onAllocationChange(newValue);
    setInputValue(newValue.toString());
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-300 p-3 shadow-sm"
      >
        {/* 卡片標題區 - 簡化版 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1">
            {/* 拖曳手柄 */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-sm font-bold">V</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-base md:text-lg">{card.title}</h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* 目前籌碼數 */}
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{currentAmount}</div>
            </div>

            {/* 查看大圖按鈕 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-gray-400 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-500 bg-white dark:bg-white p-1"
              title="查看卡片詳情"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* 移除按鈕 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 bg-white dark:bg-white p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 籌碼控制區 - 移除 slider，只保留按鈕和輸入框 */}
        <div className="flex items-center justify-center space-x-3">
          {/* -10 按鈕 */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleQuickAdjust(-10)}
            disabled={currentAmount < 10}
            className="h-12 px-6 text-lg font-semibold text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300 hover:bg-gray-50"
          >
            <Minus className="w-5 h-5 mr-1" />
            10
          </Button>

          {/* 手動輸入 */}
          <Input
            type="number"
            min="0"
            max={maxTokens}
            value={inputValue}
            onChange={handleInputChange}
            className="w-24 h-12 text-center text-xl font-bold text-gray-900 dark:text-gray-900 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
          />

          {/* +10 按鈕 */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleQuickAdjust(10)}
            disabled={currentAmount + 10 > maxTokens}
            className="h-12 px-6 text-lg font-semibold text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300 hover:bg-gray-50"
          >
            <Plus className="w-5 h-5 mr-1" />
            10
          </Button>
        </div>
      </div>

      {/* 卡片詳情 Modal */}
      <CardModal card={card} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default CardTokenWidget;
