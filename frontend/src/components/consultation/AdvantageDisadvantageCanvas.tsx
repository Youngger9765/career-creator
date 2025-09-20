'use client';

import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CardData } from '@/types/cards';

// Simple draggable card without absolute positioning
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
      className="w-28 h-36 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow relative group"
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
      <div {...listeners} {...attributes} className="cursor-move h-full flex flex-col">
        <div className="text-xs font-bold mb-1 line-clamp-2 text-gray-900 dark:text-gray-100">
          {card.title}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          {card.description}
        </div>
        {card.category && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-auto">{card.category}</div>
        )}
      </div>
    </div>
  );
}

interface DroppableZoneProps {
  id: string;
  title: string;
  cards: CardData[];
  className?: string;
  onRemoveCard?: (cardId: string) => void;
}

function DroppableZone({ id, title, cards, className = '', onRemoveCard }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const bgColor =
    id === 'advantage'
      ? 'bg-green-50 dark:bg-green-900/20'
      : id === 'disadvantage'
        ? 'bg-red-50 dark:bg-red-900/20'
        : 'bg-gray-50 dark:bg-gray-800/50';
  const borderColor =
    id === 'advantage'
      ? 'border-green-400 dark:border-green-500'
      : id === 'disadvantage'
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-400 dark:border-gray-600';

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-all
        ${bgColor} ${borderColor}
        ${isOver ? 'border-solid scale-102 shadow-lg' : ''}
        ${className}
      `}
    >
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onRemove={onRemoveCard} />
        ))}
      </div>
    </div>
  );
}

interface AdvantageDisadvantageCanvasProps {
  advantageCards: CardData[];
  disadvantageCards: CardData[];
  onRemoveCard?: (cardId: string) => void;
}

export function AdvantageDisadvantageCanvas({
  advantageCards,
  disadvantageCards,
  onRemoveCard,
}: AdvantageDisadvantageCanvasProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <DroppableZone
        id="advantage"
        title="優勢區域"
        cards={advantageCards}
        onRemoveCard={onRemoveCard}
        className="flex-1"
      />
      <DroppableZone
        id="disadvantage"
        title="劣勢區域"
        cards={disadvantageCards}
        onRemoveCard={onRemoveCard}
        className="flex-1"
      />
    </div>
  );
}
