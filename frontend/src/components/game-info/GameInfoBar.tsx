/**
 * GameInfoBar - 遊戲資訊欄
 *
 * 顯示當前遊戲的模式、玩法、畫布、牌卡等資訊
 * 可被所有遊戲元件共用
 */

'use client';

import React from 'react';
import { Compass, Gamepad2, Layout, Layers } from 'lucide-react';

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
      className={`bg-white border-b border-gray-100 px-4 sm:px-6 py-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Desktop: pill 標籤樣式 */}
        <div className="hidden sm:flex items-center gap-3 flex-wrap">
          {/* 模式 - 深海藍 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0056A7]/10 rounded-full">
            <Compass className="w-4 h-4 text-[#0056A7]" />
            <span className="text-sm font-medium text-[#0056A7]">{mode}</span>
          </div>
          
          {/* 玩法 - 品牌金 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFCC3A]/20 rounded-full">
            <Gamepad2 className="w-4 h-4 text-[#B8860B]" />
            <span className="text-sm font-medium text-[#B8860B]">{gameplay}</span>
          </div>
          
          {/* 畫布 - 職游青 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7AB7B7]/20 rounded-full">
            <Layout className="w-4 h-4 text-[#5A9A9A]" />
            <span className="text-sm font-medium text-[#5A9A9A]">{canvas}</span>
          </div>
          
          {/* 牌卡 - 灰色 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{deckName}</span>
          </div>
        </div>

        {/* Mobile: 精簡顯示 */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#0056A7]/10 rounded-full text-xs font-medium text-[#0056A7]">
              {mode}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFCC3A]/20 rounded-full text-xs font-medium text-[#B8860B]">
              {gameplay}
            </span>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {availableCards}/{totalCards}
          </div>
        </div>

        {/* Card count - Desktop */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-gray-400">總卡片</span>
          <span className="font-bold text-gray-700">{totalCards}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">可用</span>
          <span className="font-bold text-[#7AB7B7]">{availableCards}</span>
        </div>
      </div>
    </div>
  );
};

export default GameInfoBar;
