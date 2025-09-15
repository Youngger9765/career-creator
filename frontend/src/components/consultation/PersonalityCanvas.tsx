'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card } from '../Card';
import { CardData } from '@/types/cards';

interface PersonalityZoneProps {
  id: string;
  title: string;
  cards: CardData[];
  color: 'green' | 'yellow' | 'red';
}

function PersonalityZone({ id, title, cards, color }: PersonalityZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const colorClasses = {
    green: 'bg-green-50 border-green-400',
    yellow: 'bg-yellow-50 border-yellow-400',
    red: 'bg-red-50 border-red-400',
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
      <h3 className="text-lg font-bold mb-4 text-center">{title}</h3>
      <div className="flex flex-col gap-3">
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
            scale={0.95}
          />
        ))}
      </div>
    </div>
  );
}

interface PersonalityCanvasProps {
  likeCards: CardData[];
  neutralCards: CardData[];
  dislikeCards: CardData[];
}

export function PersonalityCanvas({
  likeCards,
  neutralCards,
  dislikeCards,
}: PersonalityCanvasProps) {
  return (
    <div className="h-full">
      <h3 className="text-2xl font-bold mb-6 text-center">六大性格分析</h3>
      <div className="grid grid-cols-3 gap-4">
        <PersonalityZone id="like" title="喜歡" cards={likeCards} color="green" />
        <PersonalityZone id="neutral" title="中立" cards={neutralCards} color="yellow" />
        <PersonalityZone id="dislike" title="討厭" cards={dislikeCards} color="red" />
      </div>
    </div>
  );
}
