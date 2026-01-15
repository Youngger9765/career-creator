/**
 * GameLayout - 通用遊戲佈局包裝器
 *
 * 統一所有遊戲的佈局結構，包含資訊欄、側邊欄和畫布區
 * 減少重複的 flex/overflow 設定
 */

'use client';

import React from 'react';
import GameInfoBar from '../game-info/GameInfoBar';
import CardSidebar, { DeckConfig } from './CardSidebar';

interface GameLayoutProps {
  // 資訊欄配置
  infoBar: {
    mode: string;
    gameplay: string;
    canvas: string;
    deckName: string;
    totalCards: number;
    availableCards: number;
  };

  // 側邊欄配置
  sidebar?: {
    type?: 'tabbed' | 'single' | 'none';
    decks: DeckConfig[];
    width?: string;
    columns?: number;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    onCardDragStart?: (cardId: string) => void;
  };

  // 畫布內容 - 可以是 ReactNode 或接收 viewMode 的函數
  canvas: React.ReactNode | ((viewMode: 'grid' | 'compact') => React.ReactNode);

  // 視圖模式控制
  enableViewModeToggle?: boolean;
  defaultViewMode?: 'grid' | 'compact';

  // 額外樣式
  className?: string;
  canvasClassName?: string;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  infoBar,
  sidebar,
  canvas,
  enableViewModeToggle = false,
  defaultViewMode = 'grid',
  className = '',
  canvasClassName = '',
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'compact'>(defaultViewMode);

  // 計算 canvas 內容
  const canvasContent = typeof canvas === 'function' ? canvas(viewMode) : canvas;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 遊戲資訊欄 */}
      <GameInfoBar 
        {...infoBar} 
        viewMode={enableViewModeToggle ? viewMode : undefined}
        onViewModeChange={enableViewModeToggle ? setViewMode : undefined}
      />

      {/* 主要遊戲區域 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop: 左側卡片區（可選） */}
        {sidebar && sidebar.type !== 'none' && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
              <CardSidebar
                decks={sidebar.decks}
                width={sidebar.width}
                columns={sidebar.columns}
                collapsible={sidebar.collapsible}
                defaultCollapsed={sidebar.defaultCollapsed}
                onCardDragStart={sidebar.onCardDragStart}
              />
            </div>

            {/* Mobile: Bottom Drawer Toggle Button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden fixed bottom-4 left-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              title="開啟卡片選單"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Mobile: Bottom Drawer */}
            {mobileSidebarOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="md:hidden fixed inset-0 bg-black/50 z-40"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                {/* Drawer */}
                <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
                  {/* Handle Bar */}
                  <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>
                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-hidden">
                    <CardSidebar
                      decks={sidebar.decks}
                      width="w-full"
                      columns={2}
                      collapsible={false}
                      onCardDragStart={sidebar.onCardDragStart}
                      className="border-0"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 右側畫布區 */}
        <div className={`flex-1 overflow-hidden ${canvasClassName}`}>{canvasContent}</div>
      </div>
    </div>
  );
};

export default GameLayout;
