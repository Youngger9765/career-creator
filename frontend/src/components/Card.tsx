'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CardData, CARD_CATEGORIES } from '@/types/cards';
import { CardEventType } from '@/lib/api/card-events';

interface CardProps {
  card: CardData;
  draggableId?: string; // Allow custom draggable ID
  isFaceUp?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: number;
  onFlip?: (cardId: string, faceUp: boolean) => void;
  onSelect?: (cardId: string) => void;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  onAddNote?: (cardId: string) => void;
  onRemove?: (cardId: string) => void;
  hasNotes?: boolean;
}

export function Card({
  card,
  draggableId,
  isFaceUp = false,
  isSelected = false,
  isDragging = false,
  position = { x: 0, y: 0 },
  rotation = 0,
  scale = 1,
  onFlip,
  onSelect,
  onCardEvent,
  onAddNote,
  onRemove,
  hasNotes = false,
}: CardProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id: draggableId || card.id, // Use draggableId if provided
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

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote?.(card.id);
  };

  const cardStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scale}) rotate(${rotation}deg)`
      : `scale(${scale}) rotate(${rotation}deg)`,
    transformStyle: 'preserve-3d' as const,
    position: 'absolute' as const,
    left: position?.x || 0,
    top: position?.y || 0,
    zIndex: isDndDragging ? 9999 : isSelected ? 100 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...cardStyle,
        position: isDndDragging ? 'fixed' : cardStyle.position,
        zIndex: isDndDragging ? 999999 : cardStyle.zIndex,
      }}
      className={`
        relative w-32 h-44 cursor-pointer ${isDndDragging || isDragging ? '' : 'transition-all duration-300'}
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
          card-container w-full h-full rounded-lg shadow-lg ${isDndDragging || isDragging ? '' : 'transition-all duration-500'}
          ${isFaceUp || isFlipping ? 'card-flipped' : ''}
          ${isDndDragging || isDragging ? '' : 'hover:shadow-xl hover:scale-105'}
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
            {card.tags &&
              card.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            {card.tags && card.tags.length > 2 && (
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                +{card.tags.length - 2}
              </span>
            )}
          </div>

          {/* Action buttons on front */}
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

          {/* Remove button */}
          {isFaceUp && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(card.id);
              }}
              className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-600 transition-all duration-200 opacity-80 hover:opacity-100 shadow-md"
              title="移除卡片"
            >
              −
            </button>
          )}

          {/* Note button */}
          {isFaceUp && onAddNote && (
            <button
              onClick={handleAddNote}
              className="absolute bottom-2 right-2 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-yellow-600 transition-all duration-200 opacity-70 hover:opacity-100"
              title="新增註記"
            >
              {hasNotes ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
