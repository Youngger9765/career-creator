'use client';

import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CardData } from '@/types/cards';

// Simple draggable card without absolute positioning
function DraggableCard({ card }: { card: CardData }) {
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
      className="w-32 h-44 bg-white border-2 border-gray-300 rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition-shadow"
    >
      <div className="text-sm font-bold mb-1">{card.title}</div>
      <div className="text-xs text-gray-600 line-clamp-3">{card.description}</div>
      {card.category && <div className="text-xs text-blue-600 mt-2">{card.category}</div>}
    </div>
  );
}

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
          <DraggableCard key={card.id} card={card} />
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
