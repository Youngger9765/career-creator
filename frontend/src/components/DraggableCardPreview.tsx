'use client';

import React, { useState } from 'react';
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
  const [isFlipped, setIsFlipped] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `preview-${card?.id || 'empty'}`,
    data: {
      type: 'card-preview',
      card,
    },
  });

  // Reset flip state when card changes
  React.useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

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

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full h-80 preserve-3d">
      <div
        className={`absolute inset-0 transition-transform duration-700 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front side of card */}
        <div
          ref={setNodeRef}
          style={{ ...cardStyle, backfaceVisibility: 'hidden' }}
          className={`absolute inset-0 rounded-lg shadow-lg flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-200 ${deckColor} ${
            isDragging ? 'opacity-50 scale-105 shadow-2xl' : 'hover:shadow-xl hover:scale-[1.02]'
          }`}
          onClick={handleCardClick}
        >
          <div className="text-center px-4 relative z-10">
            <div className="text-2xl font-bold mb-3">{card.title}</div>
            <div className="text-xs opacity-75 mb-4">類型: {card.category}</div>
          </div>

          {/* Click indicator */}
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white/80"
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
          </div>

          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>

          {/* Instructions text */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs opacity-60 text-center">
            查看詳細說明
          </div>
        </div>

        {/* Back side of card */}
        <div
          className={`absolute inset-0 rounded-lg shadow-lg flex flex-col p-6 text-white cursor-pointer transition-all duration-200 rotate-y-180 ${deckColor}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={handleCardClick}
        >
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-bold mb-3">{card.title}</h3>
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm leading-relaxed mb-4">{card.description}</p>
              {card.tags && card.tags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold opacity-75">相關技能：</p>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drag instruction on back */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60">查看職業名稱</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCanvas(card);
                  }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                  {...listeners}
                  {...attributes}
                >
                  拖拽到畫布
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
