'use client';

import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CardData } from '@/types/cards';

// Simple draggable card for grid
function DraggableGridCard({ card, position }: { card: CardData; position: string }) {
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
      {...listeners}
      {...attributes}
      className="w-full h-full bg-white dark:bg-gray-700 border-2 border-blue-400 dark:border-blue-500 rounded-lg shadow-lg p-2 cursor-move hover:shadow-xl transition-all flex flex-col justify-center"
    >
      <div className="text-sm font-bold mb-1 text-center text-gray-900 dark:text-gray-100">
        {card.title}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300 text-center line-clamp-2">
        {card.description}
      </div>
      {card.category && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
          {card.category}
        </div>
      )}
    </div>
  );
}

interface GridCellProps {
  id: string;
  row: number;
  col: number;
  card?: CardData;
}

function GridCell({ id, row, col, card }: GridCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2
        flex flex-col items-center justify-center h-full relative
        ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500' : 'bg-white dark:bg-gray-800'}
        transition-all duration-200
      `}
      style={{ minHeight: '100px' }}
    >
      {/* Position number always visible in top-left corner */}
      <div className="absolute top-1 left-1 text-lg font-bold text-gray-400 dark:text-gray-500 z-10">
        {row * 3 + col + 1}
      </div>

      {!card && (
        <div className="text-center">
          <div className="text-sm text-gray-300 dark:text-gray-600 mt-4">拖放卡片至此</div>
        </div>
      )}
      {card && <DraggableGridCard card={card} position={id} />}
    </div>
  );
}

interface ValueGridCanvasProps {
  cards: Map<string, CardData>;
}

export function ValueGridCanvas({ cards }: ValueGridCanvasProps) {
  const gridCards: (CardData | undefined)[][] = [
    [undefined, undefined, undefined],
    [undefined, undefined, undefined],
    [undefined, undefined, undefined],
  ];

  // Place cards in their grid positions
  cards.forEach((card, position) => {
    const match = position.match(/grid-(\d+)-(\d+)/);
    if (match) {
      const row = parseInt(match[1]);
      const col = parseInt(match[2]);
      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        gridCards[row][col] = card;
      }
    }
  });

  return (
    <div className="w-full h-full flex flex-col p-2">
      <h3 className="text-lg font-bold mb-2 text-center">價值觀排序</h3>
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex items-center justify-center p-2">
          <div className="w-full max-w-5xl">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gridAutoRows: 'minmax(100px, 1fr)',
              }}
            >
              {gridCards.map((row, rowIndex) =>
                row.map((card, colIndex) => (
                  <GridCell
                    key={`grid-${rowIndex}-${colIndex}`}
                    id={`grid-${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    card={card}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
        <p>將卡片拖放到九宮格中，排序你的價值觀優先順序</p>
      </div>
    </div>
  );
}
