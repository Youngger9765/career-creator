'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CardData } from '@/types/cards';
import { useCardEvents } from '@/hooks/use-card-events';

interface DraggableCardProps {
  card: CardData;
  idPrefix: string; // 'list' for main cards, 'aux' for auxiliary cards
  cardColor?: string; // Custom color class for the card
  cardStyle?: 'default' | 'auxiliary'; // Visual style variant
  roomId?: string; // Room ID for event tracking
}

export function DraggableCard({
  card,
  idPrefix,
  cardColor = 'bg-gray-600',
  cardStyle = 'default',
  roomId,
}: DraggableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize card events hook - always call but only use if roomId is provided
  const cardEvents = useCardEvents({
    roomId: roomId || 'dummy',
    realtime: false,
  });

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${idPrefix}-${card.id}`,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Handle click to flip
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);

    // Record card flip event only if roomId is provided
    if (roomId) {
      try {
        await cardEvents.flipCard(card.id, newFlippedState);
        console.log(
          `Card flip recorded: ${card.id} -> ${newFlippedState ? 'face up' : 'face down'}`
        );
      } catch (error) {
        console.error('Failed to record card flip:', error);
      }
    }
  };

  // Auxiliary card style (smaller, yellow)
  if (cardStyle === 'auxiliary') {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        {...listeners}
        {...attributes}
        className="relative w-28 h-36"
        onClick={handleClick}
      >
        <div
          className={`absolute inset-0 transition-transform duration-700 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of auxiliary card */}
          <div
            className={`absolute inset-0 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 cursor-pointer transition-all ${
              isDragging ? 'opacity-50 scale-105' : 'hover:shadow-lg'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-sm font-bold mb-2 text-gray-800">{card.title}</div>
            <div className="text-xs text-gray-600 line-clamp-3">{card.description}</div>
            <div className="absolute bottom-1 right-1 text-[9px] text-gray-500">點擊翻轉</div>
          </div>

          {/* Back of auxiliary card */}
          <div
            className={`absolute inset-0 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 cursor-pointer rotate-y-180`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-xs font-semibold mb-2 text-gray-800">詳細說明</div>
            <div className="text-xs text-gray-700 overflow-y-auto">{card.description}</div>
            {card.tags && card.tags.length > 0 && (
              <div className="mt-2">
                <div className="text-[9px] text-gray-600 mb-1">標籤:</div>
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1 py-0.5 bg-yellow-200 rounded text-[9px] text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="absolute bottom-1 right-1 text-[9px] text-gray-500">點擊返回</div>
          </div>
        </div>
      </div>
    );
  }

  // Default card style (for main deck cards)
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      {...listeners}
      {...attributes}
      className="relative w-full h-32"
      onClick={handleClick}
    >
      <div
        className={`absolute inset-0 transition-transform duration-700 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className={`absolute inset-0 rounded-lg shadow-md p-3 border-2 cursor-pointer transition-all ${
            cardColor
          } text-white ${isDragging ? 'opacity-50 scale-105' : 'hover:shadow-lg'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-sm font-bold mb-1">{card.title}</div>
          <div className="text-xs opacity-90 line-clamp-2">{card.description}</div>
          {card.category && <div className="text-xs opacity-75 mt-2">{card.category}</div>}
          <div className="absolute bottom-1 right-1 text-[10px] opacity-60">
            點擊翻轉 | 拖曳加入
          </div>
        </div>

        {/* Back of card */}
        <div
          className={`absolute inset-0 rounded-lg shadow-md p-3 border-2 cursor-pointer ${
            cardColor
          } text-white rotate-y-180`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="text-xs font-semibold mb-2">詳細說明</div>
          <div className="text-xs opacity-90">{card.description}</div>
          {card.tags && card.tags.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] opacity-75 mb-1">標籤:</div>
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag, idx) => (
                  <span key={idx} className="px-1 py-0.5 bg-white/20 rounded text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 right-1 text-[10px] opacity-60">
            點擊返回 | 拖曳加入
          </div>
        </div>
      </div>
    </div>
  );
}
