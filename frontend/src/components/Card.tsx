'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CardData, CARD_CATEGORIES } from '@/types/cards';
import { CardEventType } from '@/types/api';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: number;
  onFlip?: (cardId: string, faceUp: boolean) => void;
  onSelect?: (cardId: string) => void;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
}

export function Card({
  card,
  isFaceUp = false,
  isSelected = false,
  isDragging = false,
  position = { x: 0, y: 0 },
  rotation = 0,
  scale = 1,
  onFlip,
  onSelect,
  onCardEvent,
}: CardProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const categoryInfo = CARD_CATEGORIES[card.category as keyof typeof CARD_CATEGORIES] || {
    name: card.category,
    color: 'bg-gray-500',
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipping(true);

    setTimeout(() => {
      onFlip?.(card.id, !isFaceUp);
      onCardEvent?.(card.id, CardEventType.CARD_FLIPPED, { face_up: !isFaceUp });
      setIsFlipping(false);
    }, 150);
  };

  const handleSelect = () => {
    onSelect?.(card.id);
    onCardEvent?.(card.id, CardEventType.CARD_SELECTED);
  };

  const cardStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scale}) rotate(${rotation}deg)`
      : `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
    transformStyle: 'preserve-3d' as const,
    zIndex: isDndDragging ? 1000 : isSelected ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={`
        relative w-32 h-44 cursor-pointer transition-all duration-300
        ${isDndDragging || isDragging ? 'dragging' : ''}
        ${isSelected ? 'selected' : ''}
        ${isFlipping ? 'scale-105' : ''}
      `}
      onClick={handleSelect}
      {...listeners}
      {...attributes}
    >
      <div
        className={`
          card-container w-full h-full rounded-lg shadow-lg transition-all duration-500
          ${isFaceUp || isFlipping ? 'card-flipped' : ''}
          hover:shadow-xl hover:scale-105
        `}
      >
        {/* Card Back */}
        <div className="card-face back absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-xl font-bold mb-2">Career</div>
            <div className="text-sm opacity-75">Consultation</div>
            <div className="mt-4 w-8 h-8 mx-auto border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Flip button on back */}
          <button onClick={handleFlip} className="card-flip-button" title="翻牌">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Card Front */}
        <div className="card-face front absolute inset-0 rounded-lg bg-white p-3 flex flex-col">
          {/* Category badge */}
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mb-2 self-start ${categoryInfo.color}`}
          >
            {categoryInfo.name}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-800 text-sm mb-2 leading-tight">{card.title}</h3>

          {/* Description */}
          <p className="text-xs text-gray-600 flex-1 leading-relaxed mb-3">{card.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {card.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 2 && (
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                +{card.tags.length - 2}
              </span>
            )}
          </div>

          {/* Flip button on front */}
          <button onClick={handleFlip} className="card-flip-button" title="翻牌">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
