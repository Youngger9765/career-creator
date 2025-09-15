'use client';

import React from 'react';
import { Card } from '../Card';
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
      <Card
        card={card}
        isFaceUp={true}
        isSelected={false}
        isDragging={false}
        position={{ x: 0, y: 0 }}
        rotation={0}
        scale={0.8}
      />
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {filteredCards.map((card) => (
          <DraggableListCard key={card.id} card={card} onDoubleClick={onDoubleClick} />
        ))}
      </div>
    </div>
  );
}
