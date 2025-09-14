'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableGameAreaProps {
  children: React.ReactNode;
  isActive?: boolean;
  selectedGameRule: string;
}

export function DroppableGameArea({ children, isActive = false, selectedGameRule }: DroppableGameAreaProps) {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: 'game-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      data-droppable-id="game-canvas"
      className={`
        w-full h-full border-2 rounded-lg bg-white relative overflow-y-auto overflow-x-visible transition-all duration-200
        ${isOver || isActive ?
          'border-teal-400 bg-teal-50/30 shadow-lg ring-2 ring-teal-400/20' :
          'border-gray-300'
        }
      `}
      style={{ zIndex: 1, minHeight: '600px' }}
    >
      {/* Drop zone visual indicator */}
      {(isOver || isActive) && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 border-2 border-dashed border-teal-400 rounded-lg bg-teal-100/20 flex items-center justify-center">
            <div className="text-center text-teal-600">
              <div className="text-lg font-medium mb-2">
                放開以添加卡片到畫布
              </div>
              <div className="text-sm opacity-75">
                {selectedGameRule}遊戲區域
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
