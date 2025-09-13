'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDndMonitor,
  useDroppable,
} from '@dnd-kit/core';
import { Card } from './Card';
import { CardDeck } from './CardDeck';
import { GameCard, CardData, DEFAULT_CAREER_CARDS } from '@/types/cards';
import { CardEventType } from '@/types/api';
import { useCardSync } from '@/hooks/use-card-sync';

interface ConsultationAreaProps {
  roomId: string;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  isReadOnly?: boolean;
  performerInfo?: {
    id?: string;
    name?: string;
    type?: string;
  };
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
    height: 150,
  },
  {
    id: 'maybe',
    name: '可能考慮',
    description: '需要更多了解的選項',
    color: 'border-yellow-300 bg-yellow-50',
    position: { x: 350, y: 100 },
    width: 200,
    height: 150,
  },
  {
    id: 'not-interested',
    name: '不感興趣',
    description: '目前不考慮的選項',
    color: 'border-red-300 bg-red-50',
    position: { x: 600, y: 100 },
    width: 200,
    height: 150,
  },
  {
    id: 'discussion',
    name: '討論區',
    description: '正在討論的卡片',
    color: 'border-blue-300 bg-blue-50',
    position: { x: 250, y: 300 },
    width: 300,
    height: 200,
  },
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
        height: zone.height,
      }}
    >
      <div className="text-center">
        <h3 className="font-bold text-gray-700 mb-1">{zone.name}</h3>
        <p className="text-xs text-gray-600">{zone.description}</p>
      </div>
    </div>
  );
}

export function ConsultationArea({
  roomId,
  onCardEvent,
  isReadOnly = false,
  performerInfo,
}: ConsultationAreaProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  // Initialize card synchronization
  const {
    syncedCards,
    isActive: isSyncActive,
    isWebSocketConnected,
    error: syncError,
    syncCardEvent,
    updateLocalCard,
    applyToGameCards,
    clearError: clearSyncError,
  } = useCardSync({
    roomId,
    enabled: !isReadOnly,
    useWebSocket: true,
    performerInfo,
  });

  // Apply synchronized state to local cards
  useEffect(() => {
    if (syncedCards.length === 0) return;

    setCards((prevCards) => applyToGameCards(prevCards));
  }, [syncedCards, applyToGameCards]);

  const handleDealCard = useCallback(
    (cardData: CardData) => {
      const newCard: GameCard = {
        id: `game-${cardData.id}-${Date.now()}`,
        data: cardData,
        position: {
          x: 400 + Math.random() * 100 - 50,
          y: 300 + Math.random() * 100 - 50,
        },
        isFaceUp: false,
        isSelected: false,
        rotation: Math.random() * 10 - 5, // Random rotation between -5 and 5 degrees
        scale: 1,
        zIndex: cards.length + 1,
      };

      setCards((prev) => [...prev, newCard]);

      // Sync card dealt event
      if (!isReadOnly) {
        syncCardEvent(newCard.id, CardEventType.CARD_DEALT, {
          position: newCard.position,
          card_data: cardData,
          from_deck: true,
        }).catch(console.error);
      }
    },
    [cards.length, isReadOnly, syncCardEvent]
  );

  const handleCardFlip = useCallback(
    (cardId: string, faceUp: boolean) => {
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, isFaceUp: faceUp } : card))
      );

      // Sync card flip event
      if (!isReadOnly) {
        syncCardEvent(cardId, CardEventType.CARD_FLIPPED, {
          face_up: faceUp,
        }).catch(console.error);
      }
    },
    [isReadOnly, syncCardEvent]
  );

  const handleCardSelect = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        isSelected: card.id === cardId ? !card.isSelected : false,
      }))
    );
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCard(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setActiveDropZone((over?.id as string) || null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      const cardId = active.id as string;

      setActiveCard(null);
      setActiveDropZone(null);

      if (over) {
        // Dropped on a drop zone
        const dropZone = DROP_ZONES.find((zone) => zone.id === over.id);
        if (dropZone) {
          const newPosition = {
            x: dropZone.position.x + dropZone.width / 2 - 64, // Center the card
            y: dropZone.position.y + dropZone.height / 2 - 88,
          };

          setCards((prev) =>
            prev.map((card) =>
              card.id === cardId ? { ...card, position: newPosition, isSelected: false } : card
            )
          );

          // Sync card arranged event
          if (!isReadOnly) {
            syncCardEvent(cardId, CardEventType.CARD_ARRANGED, {
              drop_zone: over.id,
              position: newPosition,
            }).catch(console.error);
          }

          onCardEvent?.(cardId, CardEventType.CARD_ARRANGED, {
            drop_zone: over.id,
            position: newPosition,
          });
        }
      } else {
        // Free drag
        setCards((prev) =>
          prev.map((card) => {
            if (card.id === cardId) {
              const newPosition = {
                x: card.position.x + delta.x,
                y: card.position.y + delta.y,
              };

              // Sync card move event
              if (!isReadOnly) {
                syncCardEvent(cardId, CardEventType.CARD_MOVED, {
                  from_position: card.position,
                  to_position: newPosition,
                }).catch(console.error);
              }

              onCardEvent?.(cardId, CardEventType.CARD_MOVED, {
                from_position: card.position,
                to_position: newPosition,
              });

              return { ...card, position: newPosition, isSelected: false };
            }
            return card;
          })
        );
      }
    },
    [onCardEvent]
  );

  const handleCardEvent = useCallback(
    (cardId: string, eventType: CardEventType, data?: any) => {
      onCardEvent?.(cardId, eventType, data);
    },
    [onCardEvent]
  );

  return (
    <div className="consultation-area relative w-full h-screen overflow-hidden">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Drop Zones */}
        {DROP_ZONES.map((zone) => (
          <DropZoneComponent key={zone.id} zone={zone} isActive={activeDropZone === zone.id} />
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
        {cards.map((card) => (
          <div
            key={card.id}
            className="absolute"
            style={{
              left: card.position.x,
              top: card.position.y,
              zIndex: card.zIndex + (card.isSelected ? 100 : 0),
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

        {/* Instructions and Sync Status */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">操作說明</h3>
            {!isReadOnly && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSyncActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={isSyncActive ? '同步中' : '離線'}
                  ></div>
                  <span className="text-xs text-gray-500">{isSyncActive ? '同步' : '離線'}</span>
                </div>
                {isWebSocketConnected && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                    </svg>
                    <span className="text-xs text-green-600">即時</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>• 點擊發牌按鈕獲取卡片</div>
            <div>• 點擊卡片右上角翻面</div>
            <div>• 拖拽卡片到分類區域</div>
            <div>• 點擊卡片選中/取消選中</div>
            <div>• 在討論區放置正在討論的卡片</div>
            {!isReadOnly && <div className="text-xs text-blue-600 mt-2">• 所有操作將即時同步</div>}
          </div>

          {syncError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              <div className="flex items-center justify-between">
                <span>同步錯誤: {syncError.message}</span>
                <button
                  onClick={clearSyncError}
                  className="text-red-400 hover:text-red-600"
                  title="清除錯誤"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Counter */}
        <div className="absolute bottom-4 left-4 card-counter z-20">
          <div className="text-sm text-gray-600">
            桌上卡片: <span className="font-bold text-gray-800">{cards.length}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            翻面: {cards.filter((c) => c.isFaceUp).length} 張
          </div>
        </div>

        {/* Clear button */}
        {cards.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20">
            <button onClick={() => setCards([])} className="clear-button text-sm">
              清空桌面
            </button>
          </div>
        )}
      </DndContext>
    </div>
  );
}
