'use client';

import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Card } from './Card';
import { CardDeck } from './CardDeck';
import { GameCard, CardData, DEFAULT_CAREER_CARDS } from '@/types/cards';
import { CardEventType } from '@/types/api';

interface ConsultationAreaProps {
  roomId: string;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  isReadOnly?: boolean;
}

interface DropZone {
  id: string;
  name: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

const DROP_ZONES: DropZone[] = [
  {
    id: 'interested',
    name: '有興趣',
    description: '我覺得有興趣的職業',
    color: 'border-green-300 bg-green-50',
    position: { x: 100, y: 100 },
    width: 200,
    height: 150
  },
  {
    id: 'maybe',
    name: '可能考慮',
    description: '需要更多了解的選項',
    color: 'border-yellow-300 bg-yellow-50',
    position: { x: 350, y: 100 },
    width: 200,
    height: 150
  },
  {
    id: 'not-interested',
    name: '不感興趣',
    description: '目前不考慮的選項',
    color: 'border-red-300 bg-red-50',
    position: { x: 600, y: 100 },
    width: 200,
    height: 150
  },
  {
    id: 'discussion',
    name: '討論區',
    description: '正在討論的卡片',
    color: 'border-blue-300 bg-blue-50',
    position: { x: 250, y: 300 },
    width: 300,
    height: 200
  }
];

function DropZoneComponent({ zone, isActive }: { zone: DropZone; isActive: boolean }) {
  const { setNodeRef } = useDroppable({ id: zone.id });

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute border-2 border-dashed rounded-lg p-4 transition-all duration-200
        ${zone.color}
        ${isActive ? 'border-solid scale-105 shadow-lg' : ''}
      `}
      style={{
        left: zone.position.x,
        top: zone.position.y,
        width: zone.width,
        height: zone.height
      }}
    >
      <div className="text-center">
        <h3 className="font-bold text-gray-700 mb-1">{zone.name}</h3>
        <p className="text-xs text-gray-600">{zone.description}</p>
      </div>
    </div>
  );
}

export function ConsultationArea({ roomId, onCardEvent, isReadOnly = false }: ConsultationAreaProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  const handleDealCard = useCallback((cardData: CardData) => {
    const newCard: GameCard = {
      id: `game-${cardData.id}-${Date.now()}`,
      data: cardData,
      position: { 
        x: 400 + Math.random() * 100 - 50, 
        y: 300 + Math.random() * 100 - 50 
      },
      isFaceUp: false,
      isSelected: false,
      rotation: Math.random() * 10 - 5, // Random rotation between -5 and 5 degrees
      scale: 1,
      zIndex: cards.length + 1
    };

    setCards(prev => [...prev, newCard]);
  }, [cards.length]);

  const handleCardFlip = useCallback((cardId: string, faceUp: boolean) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFaceUp: faceUp } : card
    ));
  }, []);

  const handleCardSelect = useCallback((cardId: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      isSelected: card.id === cardId ? !card.isSelected : false
    })));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCard(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setActiveDropZone(over?.id as string || null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    const cardId = active.id as string;

    setActiveCard(null);
    setActiveDropZone(null);

    if (over) {
      // Dropped on a drop zone
      const dropZone = DROP_ZONES.find(zone => zone.id === over.id);
      if (dropZone) {
        const newPosition = {
          x: dropZone.position.x + dropZone.width / 2 - 64, // Center the card
          y: dropZone.position.y + dropZone.height / 2 - 88
        };

        setCards(prev => prev.map(card => 
          card.id === cardId 
            ? { ...card, position: newPosition, isSelected: false }
            : card
        ));

        onCardEvent?.(cardId, CardEventType.CARD_ARRANGED, {
          drop_zone: over.id,
          position: newPosition
        });
      }
    } else {
      // Free drag
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          const newPosition = {
            x: card.position.x + delta.x,
            y: card.position.y + delta.y
          };
          
          onCardEvent?.(cardId, CardEventType.CARD_MOVED, {
            from_position: card.position,
            to_position: newPosition
          });

          return { ...card, position: newPosition, isSelected: false };
        }
        return card;
      }));
    }
  }, [onCardEvent]);

  const handleCardEvent = useCallback((cardId: string, eventType: CardEventType, data?: any) => {
    onCardEvent?.(cardId, eventType, data);
  }, [onCardEvent]);

  return (
    <div className="consultation-area relative w-full h-screen overflow-hidden">
      <DndContext 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        {/* Drop Zones */}
        {DROP_ZONES.map(zone => (
          <DropZoneComponent 
            key={zone.id} 
            zone={zone} 
            isActive={activeDropZone === zone.id}
          />
        ))}

        {/* Card Deck */}
        <div className="absolute top-4 left-4 z-20">
          <CardDeck
            cards={DEFAULT_CAREER_CARDS}
            onDealCard={handleDealCard}
            onCardEvent={handleCardEvent}
          />
        </div>

        {/* Game Cards */}
        {cards.map(card => (
          <div
            key={card.id}
            className="absolute"
            style={{ 
              left: card.position.x, 
              top: card.position.y,
              zIndex: card.zIndex + (card.isSelected ? 100 : 0)
            }}
          >
            <Card
              card={card.data}
              isFaceUp={card.isFaceUp}
              isSelected={card.isSelected}
              isDragging={activeCard === card.id}
              rotation={card.rotation}
              scale={card.scale}
              onFlip={handleCardFlip}
              onSelect={handleCardSelect}
              onCardEvent={handleCardEvent}
            />
          </div>
        ))}

        {/* Instructions */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <h3 className="font-bold text-gray-800 mb-2">操作說明</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• 點擊發牌按鈕獲取卡片</div>
            <div>• 點擊卡片右上角翻面</div>
            <div>• 拖拽卡片到分類區域</div>
            <div>• 點擊卡片選中/取消選中</div>
            <div>• 在討論區放置正在討論的卡片</div>
          </div>
        </div>

        {/* Card Counter */}
        <div className="absolute bottom-4 left-4 card-counter z-20">
          <div className="text-sm text-gray-600">
            桌上卡片: <span className="font-bold text-gray-800">{cards.length}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            翻面: {cards.filter(c => c.isFaceUp).length} 張
          </div>
        </div>

        {/* Clear button */}
        {cards.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() => setCards([])}
              className="clear-button text-sm"
            >
              清空桌面
            </button>
          </div>
        )}
      </DndContext>
    </div>
  );
}