/**
 * CardTokenWidget - 卡片籌碼分配工具
 *
 * 將價值卡轉換為籌碼分配介面
 * 顯示卡片資訊和籌碼控制器
 */

'use client';

import React, { useState } from 'react';
import { Plus, Minus, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card as CardData } from '@/game-modes/services/card-loader.service';

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

  // 處理滑桿變化
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onAllocationChange(value);
    setInputValue(value.toString());
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
    <div className="bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-300 p-3 shadow-sm">
      {/* 卡片標題區 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 text-xs font-bold">V</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm">{card.title}</h3>
            <p className="text-xs text-gray-600 line-clamp-1">{card.description}</p>
          </div>

          {/* 快速調整按鈕移至標題旁 */}
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdjust(10)}
              className="text-xs px-1.5 py-0.5 h-6 text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
            >
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdjust(20)}
              className="text-xs px-1.5 py-0.5 h-6 text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
            >
              +20
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdjust(-10)}
              className="text-xs px-1.5 py-0.5 h-6 text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
              disabled={currentAmount < 10}
            >
              -10
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">{currentAmount}</div>
            <div className="text-xs text-gray-500">{currentAmount}%</div>
          </div>
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

      {/* 籌碼控制區 */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAdjust(-1)}
          disabled={currentAmount <= 0}
          className="w-7 h-7 p-0 text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
        >
          <Minus className="w-3 h-3" />
        </Button>

        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max={maxTokens}
            value={currentAmount}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(currentAmount / maxTokens) * 100}%, #e5e7eb ${(currentAmount / maxTokens) * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAdjust(1)}
          disabled={currentAmount >= maxTokens}
          className="w-7 h-7 p-0 text-gray-700 dark:text-gray-700 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
        >
          <Plus className="w-3 h-3" />
        </Button>

        <Input
          type="number"
          min="0"
          max={maxTokens}
          value={inputValue}
          onChange={handleInputChange}
          className="w-14 h-7 text-center p-1 text-sm text-gray-900 dark:text-gray-900 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
        />
      </div>
    </div>
  );
};

export default CardTokenWidget;
