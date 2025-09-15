'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card } from '../Card';
import { CardData } from '@/types/cards';

interface DroppableZoneProps {
  id: string;
  title: string;
  cards: CardData[];
  className?: string;
}

function DroppableZone({ id, title, cards, className = '' }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const bgColor =
    id === 'advantage' ? 'bg-green-50' : id === 'disadvantage' ? 'bg-red-50' : 'bg-gray-50';
  const borderColor =
    id === 'advantage'
      ? 'border-green-400'
      : id === 'disadvantage'
        ? 'border-red-400'
        : 'border-gray-400';

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-all
        ${bgColor} ${borderColor}
        ${isOver ? 'border-solid scale-102 shadow-lg' : ''}
        ${className}
      `}
    >
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            draggableId={card.id}
            isFaceUp={true}
            isSelected={false}
            isDragging={false}
            position={{ x: 0, y: 0 }}
            rotation={0}
            scale={1}
          />
        ))}
      </div>
    </div>
  );
}

interface AdvantageDisadvantageCanvasProps {
  advantageCards: CardData[];
  disadvantageCards: CardData[];
}

export function AdvantageDisadvantageCanvas({
  advantageCards,
  disadvantageCards,
}: AdvantageDisadvantageCanvasProps) {
  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      <DroppableZone id="advantage" title="優勢區域" cards={advantageCards} />
      <DroppableZone id="disadvantage" title="劣勢區域" cards={disadvantageCards} />
    </div>
  );
}
