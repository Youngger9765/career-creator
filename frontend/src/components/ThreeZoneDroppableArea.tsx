'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface ThreeZoneDroppableAreaProps {
  children: React.ReactNode;
  activeZone: string | null;
  selectedGameRule: string;
}

interface Zone {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ZONES: Zone[] = [
  {
    id: 'like',
    title: '喜歡',
    color: 'text-green-600',
    bgColor: 'bg-green-50/30',
    borderColor: 'border-green-400'
  },
  {
    id: 'neutral',
    title: '中立',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50/30',
    borderColor: 'border-yellow-400'
  },
  {
    id: 'dislike',
    title: '討厭',
    color: 'text-red-600',
    bgColor: 'bg-red-50/30',
    borderColor: 'border-red-400'
  }
];

export function ThreeZoneDroppableArea({ children, activeZone, selectedGameRule }: ThreeZoneDroppableAreaProps) {
  const likeDroppable = useDroppable({ id: 'like' });
  const neutralDroppable = useDroppable({ id: 'neutral' });
  const dislikeDroppable = useDroppable({ id: 'dislike' });

  const getZoneProps = (zone: Zone, droppable: any) => {
    const isActive = activeZone === zone.id;
    const isOver = droppable.isOver;

    return {
      ref: droppable.setNodeRef,
      className: `
        flex-1 h-full border-2 rounded-lg relative overflow-hidden transition-all duration-200
        ${isOver || isActive ?
          `${zone.borderColor} ${zone.bgColor} shadow-lg ring-2 ring-${zone.borderColor.split('-')[1]}-400/20` :
          'border-gray-300 bg-white'
        }
      `
    };
  };

  return (
    <div className="w-full h-full flex gap-4 p-4">
      {ZONES.map((zone, index) => {
        const droppable = [likeDroppable, neutralDroppable, dislikeDroppable][index];
        const zoneProps = getZoneProps(zone, droppable);

        return (
          <div key={zone.id} {...zoneProps}>
            {/* Zone header */}
            <div className={`text-center p-3 border-b border-gray-200 ${zone.color} font-semibold`}>
              {zone.title}
            </div>

            {/* Drop zone visual indicator */}
            {(droppable.isOver || activeZone === zone.id) && (
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute inset-4 top-16 border-2 border-dashed ${zone.borderColor} rounded-lg ${zone.bgColor} flex items-center justify-center`}>
                  <div className={`text-center ${zone.color}`}>
                    <div className="text-lg font-medium mb-2">
                      放開以添加到{zone.title}區域
                    </div>
                    <div className="text-sm opacity-75">
                      {selectedGameRule}遊戲
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zone content */}
            {zone.id === 'like' && <div className="flex-1 relative">{children}</div>}
          </div>
        );
      })}
    </div>
  );
}
