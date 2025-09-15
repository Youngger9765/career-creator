'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableCardPreviewProps {
  card: any;
  selectedDeck: string;
  onAddToCanvas: (card: any) => void;
}

export function DraggableCardPreview({
  card,
  selectedDeck,
  onAddToCanvas,
}: DraggableCardPreviewProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `preview-${card?.id || 'empty'}`,
    data: {
      type: 'card-preview',
      card,
    },
  });

  if (!card) {
    return (
      <div className="w-full h-80 rounded-lg shadow-lg flex flex-col items-center justify-center text-white bg-gray-400">
        <div className="text-center px-4">
          <div className="text-lg font-bold mb-3">無卡片</div>
          <div className="text-sm leading-relaxed mb-4">請從左側列表選擇卡片</div>
        </div>
      </div>
    );
  }

  const cardStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05)`
      : undefined,
  };

  const deckColor =
    selectedDeck === '職游旅人卡'
      ? 'bg-teal-600'
      : selectedDeck === '職能盤點卡'
        ? 'bg-blue-600'
        : 'bg-purple-600';

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={`w-full h-80 rounded-lg shadow-lg flex flex-col items-center justify-center text-white cursor-grab active:cursor-grabbing transition-all duration-200 relative ${deckColor} ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl' : 'hover:shadow-xl hover:scale-[1.02]'
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="text-center px-4 relative z-10">
        <div className="text-lg font-bold mb-3">{card.title}</div>
        <div className="text-sm leading-relaxed mb-4">{card.description}</div>
        <div className="text-xs opacity-75">類型: {card.category}</div>
      </div>

      {/* Drag indicator */}
      <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white/80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16l-4-4m0 0l4-4m-4 4h18"
          />
        </svg>
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>

      {/* Instructions text */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs opacity-60 text-center">
        拖拽到畫布添加卡片
      </div>
    </div>
  );
}
