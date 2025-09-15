'use client';

import React from 'react';
import { CardData } from '@/types/cards';
import { useDraggable } from '@dnd-kit/core';

interface CardListProps {
  title: string;
  cards: CardData[];
  deckType: string;
  onDoubleClick: (card: CardData) => void;
  searchQuery: string;
}

// Draggable card wrapper for the list
function DraggableListCard({
  card,
  onDoubleClick,
}: {
  card: CardData;
  onDoubleClick: (card: CardData) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `list-${card.id}`,
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
      onDoubleClick={() => onDoubleClick(card)}
    >
      <div className="w-full h-32 bg-white rounded-lg shadow-md p-3 border-2 border-gray-200">
        <div className="text-sm font-bold mb-1">{card.title}</div>
        <div className="text-xs text-gray-600 line-clamp-2">{card.description}</div>
        {card.category && <div className="text-xs text-blue-600 mt-2">{card.category}</div>}
      </div>
    </div>
  );
}

export function CardList({ title, cards, deckType, onDoubleClick, searchQuery }: CardListProps) {
  const filteredCards = cards.filter(
    (card) =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-lg font-semibold mb-3 flex-shrink-0">{title}</h3>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredCards.map((card) => (
            <DraggableListCard key={card.id} card={card} onDoubleClick={onDoubleClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
