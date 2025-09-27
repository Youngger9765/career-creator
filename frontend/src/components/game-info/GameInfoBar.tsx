/**
 * GameInfoBar - 遊戲資訊欄
 *
 * 顯示當前遊戲的模式、玩法、畫布、牌卡等資訊
 * 可被所有遊戲元件共用
 */

'use client';

import React from 'react';

interface GameInfoBarProps {
  mode: string;
  gameplay: string;
  canvas: string;
  deckName: string;
  totalCards: number;
  availableCards: number;
  className?: string;
}

const GameInfoBar: React.FC<GameInfoBarProps> = ({
  mode,
  gameplay,
  canvas,
  deckName,
  totalCards,
  availableCards,
  className = '',
}) => {
  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">模式:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{mode}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">玩法:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{gameplay}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">畫布:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{canvas}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">牌卡:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{deckName}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          總卡片: {totalCards} 張 | 可用: {availableCards} 張
        </div>
      </div>
    </div>
  );
};

export default GameInfoBar;
