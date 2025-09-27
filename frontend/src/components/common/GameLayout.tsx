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

  // 畫布內容
  canvas: React.ReactNode;

  // 額外樣式
  className?: string;
  canvasClassName?: string;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  infoBar,
  sidebar,
  canvas,
  className = '',
  canvasClassName = '',
}) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 遊戲資訊欄 */}
      <GameInfoBar {...infoBar} />

      {/* 主要遊戲區域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側卡片區（可選） */}
        {sidebar && sidebar.type !== 'none' && (
          <CardSidebar
            decks={sidebar.decks}
            width={sidebar.width}
            columns={sidebar.columns}
            collapsible={sidebar.collapsible}
            defaultCollapsed={sidebar.defaultCollapsed}
            onCardDragStart={sidebar.onCardDragStart}
          />
        )}

        {/* 右側畫布區 */}
        <div className={`flex-1 overflow-hidden ${canvasClassName}`}>{canvas}</div>
      </div>
    </div>
  );
};

export default GameLayout;
