'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface GameTokenProps {
  id: string;
  type: 'chip' | 'marker';
  color: string;
  value?: number;
  position: { x: number; y: number };
  isDragging?: boolean;
  onClick?: () => void;
}

export function GameToken({
  id,
  type,
  color,
  value,
  position,
  isDragging = false,
  onClick,
}: GameTokenProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id,
    data: {
      type: 'token',
      tokenType: type,
      color,
      value,
    },
  });

  const tokenStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    zIndex: isDndDragging ? 1000 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={tokenStyle}
      className={`
        w-12 h-12 rounded-full cursor-pointer transition-all duration-200
        ${isDndDragging || isDragging ? 'scale-110 shadow-xl' : 'shadow-md hover:shadow-lg hover:scale-105'}
        ${
          color === 'red'
            ? 'bg-red-500'
            : color === 'blue'
              ? 'bg-blue-500'
              : color === 'green'
                ? 'bg-green-500'
                : color === 'yellow'
                  ? 'bg-yellow-500'
                  : color === 'purple'
                    ? 'bg-purple-500'
                    : 'bg-gray-500'
        }
        border-2 border-white
      `}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm">
        {type === 'chip' && value ? value : type === 'marker' ? '●' : '○'}
      </div>

      {/* Inner shadow for 3D effect */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
    </div>
  );
}
