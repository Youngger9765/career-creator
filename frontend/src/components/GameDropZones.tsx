/**
 * Game Drop Zones Component
 * 遊戲卡片放置區域組件
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DropZone } from '@/lib/api/game-rules';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DroppableZoneProps {
  zone: DropZone;
  cards: Array<{ id: string; name: string }>;
  isActive?: boolean;
}

function DroppableZone({ zone, cards, isActive }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: { zone },
  });

  const isNearLimit = zone.max_cards && cards.length >= zone.max_cards - 1;
  const isFull = zone.max_cards && cards.length >= zone.max_cards;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative p-4 rounded-lg border-2 border-dashed transition-all
        ${isOver ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50'}
        ${isFull ? 'opacity-50 cursor-not-allowed' : ''}
        ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
      style={{
        backgroundColor: zone.bg_color || undefined,
        minHeight: '120px',
      }}
    >
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{zone.name}</h3>
        <div className="flex items-center gap-2">
          {zone.show_counter && (
            <Badge variant={isNearLimit ? 'destructive' : 'secondary'}>
              {cards.length}{zone.max_cards ? `/${zone.max_cards}` : ''}
            </Badge>
          )}
          {zone.min_cards && cards.length < zone.min_cards && (
            <Badge variant="outline" className="text-orange-600">
              最少 {zone.min_cards} 張
            </Badge>
          )}
        </div>
      </div>

      {/* Cards in Zone */}
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <Card key={card.id} className="p-2 text-sm bg-white">
            <div className="truncate">{card.name}</div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          拖放卡片到此區域
        </div>
      )}
    </div>
  );
}

interface GameDropZonesProps {
  zones: DropZone[];
  gameState?: any;
  onCardDrop?: (cardId: string, zoneId: string) => void;
}

export function GameDropZones({ zones, gameState, onCardDrop }: GameDropZonesProps) {
  // Parse game state to get cards in each zone
  const getCardsInZone = (zoneId: string) => {
    if (!gameState?.zones?.[zoneId]) return [];
    
    return gameState.zones[zoneId].cards || [];
  };

  // Organize zones by position for layout
  const organizeZones = () => {
    // For skill assessment: 2 zones side by side
    if (zones.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {zones.map((zone) => (
            <DroppableZone
              key={zone.id}
              zone={zone}
              cards={getCardsInZone(zone.id)}
            />
          ))}
        </div>
      );
    }

    // For value navigation: 3x3 grid
    if (zones.length === 9) {
      return (
        <div className="grid grid-cols-3 gap-4">
          {zones.map((zone) => (
            <DroppableZone
              key={zone.id}
              zone={zone}
              cards={getCardsInZone(zone.id)}
            />
          ))}
        </div>
      );
    }

    // For career personality: 3 zones horizontally
    if (zones.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-4">
          {zones.map((zone) => (
            <DroppableZone
              key={zone.id}
              zone={zone}
              cards={getCardsInZone(zone.id)}
            />
          ))}
        </div>
      );
    }

    // Default layout: responsive grid
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <DroppableZone
            key={zone.id}
            zone={zone}
            cards={getCardsInZone(zone.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">遊戲區域</h2>
      {organizeZones()}
    </div>
  );
}