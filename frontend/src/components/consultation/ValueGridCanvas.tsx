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
      className="w-full h-full bg-white border-2 border-gray-300 rounded-lg shadow-md p-2 cursor-move hover:shadow-lg transition-shadow"
    >
      <div className="text-xs font-bold mb-1">{card.title}</div>
      <div className="text-xs text-gray-600 line-clamp-2">{card.description}</div>
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
        border-2 border-dashed border-gray-300 rounded-lg p-2
        min-h-[180px] flex items-center justify-center
        ${isOver ? 'bg-blue-50 border-blue-400' : 'bg-white'}
      `}
    >
      {card ? (
        <DraggableGridCard card={card} position={id} />
      ) : (
        <span className="text-gray-400 text-sm">位置 {row * 3 + col + 1}</span>
      )}
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
    <div className="w-full h-full flex flex-col justify-center">
      <h3 className="text-2xl font-bold mb-6 text-center">價值觀排序</h3>
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
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
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>將卡片拖放到九宮格中，排序你的價值觀優先順序</p>
      </div>
    </div>
  );
}
