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
        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 flex-1">
          {card.description}
        </div>
        {card.category && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-auto">{card.category}</div>
        )}
      </div>
    </div>
  );
}

interface PersonalityZoneProps {
  id: string;
  title: string;
  cards: CardData[];
  color: 'green' | 'yellow' | 'red';
  onRemoveCard?: (cardId: string) => void;
}

function PersonalityZone({ id, title, cards, color, onRemoveCard }: PersonalityZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500',
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-all
        ${colorClasses[color]}
        ${isOver ? 'border-solid scale-102 shadow-lg' : ''}
      `}
    >
      <h3 className="text-lg font-bold mb-4 text-center text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onRemove={onRemoveCard} />
        ))}
      </div>
    </div>
  );
}

interface PersonalityCanvasProps {
  likeCards: CardData[];
  neutralCards: CardData[];
  dislikeCards: CardData[];
  onRemoveCard?: (cardId: string) => void;
}

export function PersonalityCanvas({
  likeCards,
  neutralCards,
  dislikeCards,
  onRemoveCard,
}: PersonalityCanvasProps) {
  return (
    <div className="h-full">
      <h3 className="text-2xl font-bold mb-6 text-center">六大性格分析</h3>
      <div className="grid grid-cols-3 gap-4">
        <PersonalityZone
          id="like"
          title="喜歡"
          cards={likeCards}
          color="green"
          onRemoveCard={onRemoveCard}
        />
        <PersonalityZone
          id="neutral"
          title="中立"
          cards={neutralCards}
          color="yellow"
          onRemoveCard={onRemoveCard}
        />
        <PersonalityZone
          id="dislike"
          title="討厭"
          cards={dislikeCards}
          color="red"
          onRemoveCard={onRemoveCard}
        />
      </div>
    </div>
  );
}
