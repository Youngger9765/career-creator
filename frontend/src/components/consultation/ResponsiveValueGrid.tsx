'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CardData } from '@/types/cards';

// Draggable card component
function DraggableCard({
  card,
  onRemove,
}: {
  card: CardData;
  onRemove?: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full h-full bg-white border-2 border-blue-400 rounded-lg shadow-md p-2 hover:shadow-lg transition-all flex flex-col justify-center relative group"
    >
      {/* Delete button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(card.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
          title="移除卡片"
        >
          ×
        </button>
      )}
      <div
        {...listeners}
        {...attributes}
        className="cursor-move h-full flex flex-col justify-center"
      >
        <div className="text-xs sm:text-sm font-bold text-center line-clamp-2">{card.title}</div>
        <div className="text-xs text-gray-600 text-center line-clamp-1 mt-1">
          {card.description}
        </div>
      </div>
    </div>
  );
}

// Grid cell component
function GridCell({
  id,
  position,
  card,
  token,
  onRemoveCard,
}: {
  id: string;
  position: number;
  card?: CardData;
  token?: CardData;
  onRemoveCard?: (cardId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        border-2 border-dashed border-gray-300 rounded-lg p-1.5
        flex items-center justify-center relative
        ${isOver ? 'bg-blue-50 border-blue-400' : 'bg-white'}
        transition-all duration-200
      `}
    >
      {!card && !token && (
        <div className="text-center">
          <div className="text-sm sm:text-base font-bold text-gray-300">{position}</div>
        </div>
      )}
      {card && <DraggableCard card={card} onRemove={onRemoveCard} />}
      {/* Token overlay on top of card */}
      {token && (
        <div className="absolute top-1 right-1 z-10">
          <DraggableTokenBadge token={token} onRemove={onRemoveCard} />
        </div>
      )}
    </div>
  );
}

// Token badge component for displaying on cards
function DraggableTokenBadge({
  token,
  onRemove,
}: {
  token: CardData;
  onRemove?: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: token.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  // Extract token value from title (e.g., "10分" -> "10")
  const tokenValue = token.title.replace('分', '');

  // Determine color based on value
  const getTokenColor = () => {
    if (tokenValue === '10') return 'bg-red-400';
    if (tokenValue === '5') return 'bg-blue-400';
    if (tokenValue === '1') return 'bg-green-400';
    return 'bg-gray-400';
  };

  const getTokenShape = () => {
    if (tokenValue === '10') return 'rounded-full';
    if (tokenValue === '5') return 'rounded-lg';
    if (tokenValue === '1') return ''; // Triangle shape would need custom CSS
    return 'rounded-full';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-8 h-8 ${getTokenColor()} ${getTokenShape()} flex items-center justify-center cursor-move shadow-md group relative`}
    >
      <div {...listeners} {...attributes}>
        <span className="text-white text-xs font-bold">{tokenValue}</span>
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(token.id);
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-20 text-xs"
          title="移除籌碼"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface ResponsiveValueGridProps {
  cards: Map<string, CardData>;
  tokens: Map<string, CardData>;
  onRemoveCard?: (cardId: string) => void;
}

export function ResponsiveValueGrid({ cards, tokens, onRemoveCard }: ResponsiveValueGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridLayout, setGridLayout] = useState({ rows: 3, cols: 3 });
  const [cellHeight, setCellHeight] = useState(120);

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const availableHeight = container.clientHeight - 80; // 減去標題和提示文字
      const availableWidth = container.clientWidth - 32; // 減去內邊距

      // 根據可用空間決定佈局
      let rows = 3;
      let cols = 3;

      // 如果高度不夠，考慮改為 2x5 或 2x4 佈局
      if (availableHeight < 400) {
        rows = 2;
        cols = availableHeight < 350 ? 4 : 5;
      }

      // 計算每個格子的高度
      const calculatedHeight = Math.min(
        Math.floor((availableHeight - (rows - 1) * 8) / rows), // 8px 是間距
        Math.floor((availableWidth - (cols - 1) * 8) / cols),
        150 // 最大高度限制
      );

      setGridLayout({ rows, cols });
      setCellHeight(Math.max(calculatedHeight, 80)); // 最小高度 80px
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // 準備網格數據
  const gridCards: (CardData | undefined)[] = new Array(gridLayout.rows * gridLayout.cols).fill(
    undefined
  );
  const gridTokensArray: (CardData | undefined)[] = new Array(
    gridLayout.rows * gridLayout.cols
  ).fill(undefined);

  cards.forEach((card, position) => {
    const match = position.match(/grid-(\d+)-(\d+)/);
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      const index = row * gridLayout.cols + col;
      if (index < gridCards.length) {
        gridCards[index] = card;
      }
    }
  });

  tokens.forEach((token, position) => {
    const match = position.match(/grid-(\d+)-(\d+)/);
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      const index = row * gridLayout.cols + col;
      if (index < gridTokensArray.length) {
        gridTokensArray[index] = token;
      }
    }
  });

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col p-2">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridLayout.rows}, ${cellHeight}px)`,
            }}
          >
            {gridCards.map((card, index) => {
              const row = Math.floor(index / gridLayout.cols);
              const col = index % gridLayout.cols;
              const gridId = `grid-${row}-${col}`;

              return (
                <GridCell
                  key={gridId}
                  id={gridId}
                  position={index + 1}
                  card={gridCards[index]}
                  token={gridTokensArray[index]}
                  onRemoveCard={onRemoveCard}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-xs text-gray-600 flex-shrink-0">
        <p>將卡片拖放到格子中，排序你的價值觀優先順序</p>
      </div>
    </div>
  );
}
