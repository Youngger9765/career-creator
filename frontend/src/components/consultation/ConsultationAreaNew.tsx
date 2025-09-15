'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import { CardList } from './CardList';
import { AdvantageDisadvantageCanvas } from './AdvantageDisadvantageCanvas';
import { ValueGridCanvas } from './ValueGridCanvas';
import { PersonalityCanvas } from './PersonalityCanvas';
import { Card } from '../Card';
import { GameToken } from '../GameToken';
import { CardNotesModal } from '../CardNotesModal';
import { useCardSync } from '@/hooks/use-card-sync';
import { CardData } from '@/types/cards';
import { Button } from '../ui/button';
import { CardEventType } from '@/lib/api/card-events';
import { Search, Save, Trash2 } from 'lucide-react';

interface ConsultationAreaNewProps {
  roomId: string;
  isHost: boolean;
  gameMode: '優劣勢分析' | '價值觀排序' | '六大性格分析';
}

// Card deck data
const SKILL_CARDS: CardData[] = [
  {
    id: 'skill-001',
    title: '溝通協調',
    description: '有效傳達想法並促進團隊合作',
    category: '人際能力',
    tags: [],
  },
  {
    id: 'skill-002',
    title: '分析思考',
    description: '邏輯分析問題並找出解決方案',
    category: '思維能力',
    tags: [],
  },
  {
    id: 'skill-003',
    title: '領導管理',
    description: '帶領團隊達成目標',
    category: '管理能力',
    tags: [],
  },
  {
    id: 'skill-004',
    title: '創新發想',
    description: '提出新穎的想法和方案',
    category: '創造能力',
    tags: [],
  },
  {
    id: 'skill-005',
    title: '時間管理',
    description: '有效安排和利用時間',
    category: '自我管理',
    tags: [],
  },
];

const VALUE_CARDS: CardData[] = [
  {
    id: 'value-001',
    title: '成就感',
    description: '完成目標帶來的滿足',
    category: '內在價值',
    tags: [],
  },
  {
    id: 'value-002',
    title: '工作生活平衡',
    description: '平衡工作與個人生活',
    category: '生活價值',
    tags: [],
  },
  {
    id: 'value-003',
    title: '團隊合作',
    description: '與他人協作的價值',
    category: '人際價值',
    tags: [],
  },
  {
    id: 'value-004',
    title: '學習成長',
    description: '持續學習和進步',
    category: '發展價值',
    tags: [],
  },
  {
    id: 'value-005',
    title: '薪資待遇',
    description: '經濟回報的重要性',
    category: '外在價值',
    tags: [],
  },
];

const PERSONALITY_CARDS: CardData[] = [
  {
    id: 'person-001',
    title: '現實型',
    description: '喜歡具體的任務和動手操作',
    category: 'Holland',
    tags: [],
  },
  {
    id: 'person-002',
    title: '研究型',
    description: '喜歡分析和解決問題',
    category: 'Holland',
    tags: [],
  },
  {
    id: 'person-003',
    title: '藝術型',
    description: '喜歡創造和自我表達',
    category: 'Holland',
    tags: [],
  },
  {
    id: 'person-004',
    title: '社會型',
    description: '喜歡幫助和服務他人',
    category: 'Holland',
    tags: [],
  },
  {
    id: 'person-005',
    title: '企業型',
    description: '喜歡領導和影響他人',
    category: 'Holland',
    tags: [],
  },
  {
    id: 'person-006',
    title: '常規型',
    description: '喜歡有組織和規律的工作',
    category: 'Holland',
    tags: [],
  },
];

export function ConsultationAreaNew({ roomId, isHost, gameMode }: ConsultationAreaNewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotesCard, setSelectedNotesCard] = useState<CardData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = useState<{
    advantage: CardData[];
    disadvantage: CardData[];
    gridCards: Map<string, CardData>;
    like: CardData[];
    neutral: CardData[];
    dislike: CardData[];
  }>({
    advantage: [],
    disadvantage: [],
    gridCards: new Map(),
    like: [],
    neutral: [],
    dislike: [],
  });

  const { syncCardEvent } = useCardSync({ roomId });

  // Get deck based on game mode
  const getDeckCards = () => {
    switch (gameMode) {
      case '優劣勢分析':
        return SKILL_CARDS;
      case '價值觀排序':
        return VALUE_CARDS;
      case '六大性格分析':
        return PERSONALITY_CARDS;
      default:
        return SKILL_CARDS;
    }
  };

  // Handle adding card by double-click
  const handleAddCard = useCallback(
    (card: CardData) => {
      const newCardId = `game-${card.id}-${Date.now()}`;
      const newCard = { ...card, id: newCardId };

      // Add to appropriate default zone based on game mode
      if (gameMode === '優劣勢分析') {
        setGameState((prev) => ({
          ...prev,
          advantage: [...prev.advantage, newCard],
        }));
        syncCardEvent(newCardId, CardEventType.CARD_DEALT, {
          zone: 'advantage',
        });
      } else if (gameMode === '價值觀排序') {
        // Find first empty grid position
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const position = `grid-${row}-${col}`;
            if (!gameState.gridCards.has(position)) {
              setGameState((prev) => ({
                ...prev,
                gridCards: new Map(prev.gridCards).set(position, newCard),
              }));
              syncCardEvent(newCardId, CardEventType.CARD_DEALT, {
                zone: position,
              });
              return;
            }
          }
        }
      } else if (gameMode === '六大性格分析') {
        setGameState((prev) => ({
          ...prev,
          neutral: [...prev.neutral, newCard],
        }));
        syncCardEvent(newCardId, CardEventType.CARD_DEALT, {
          zone: 'neutral',
        });
      }
    },
    [gameMode, gameState.gridCards, syncCardEvent]
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the card being dragged
    let draggedCard: CardData | undefined;
    let sourceZone: string | undefined;

    // Check all zones for the card
    Object.entries(gameState).forEach(([zone, cards]) => {
      if (Array.isArray(cards)) {
        const card = cards.find((c) => c.id === activeId);
        if (card) {
          draggedCard = card;
          sourceZone = zone;
        }
      } else if (cards instanceof Map) {
        cards.forEach((card, position) => {
          if (card.id === activeId) {
            draggedCard = card;
            sourceZone = position;
          }
        });
      }
    });

    if (!draggedCard || sourceZone === overId) {
      setActiveId(null);
      return;
    }

    // Move card to new zone
    setGameState((prev) => {
      const newState = { ...prev };

      // Remove from source
      if (sourceZone && sourceZone.startsWith('grid-')) {
        newState.gridCards = new Map(prev.gridCards);
        newState.gridCards.delete(sourceZone);
      } else if (sourceZone && Array.isArray(prev[sourceZone as keyof typeof prev])) {
        newState[sourceZone as keyof typeof newState] = (
          prev[sourceZone as keyof typeof prev] as CardData[]
        ).filter((c) => c.id !== activeId) as any;
      }

      // Add to target
      if (overId.startsWith('grid-')) {
        newState.gridCards = new Map(newState.gridCards);
        newState.gridCards.set(overId, draggedCard!);
      } else if (overId in newState && Array.isArray(newState[overId as keyof typeof newState])) {
        newState[overId as keyof typeof newState] = [
          ...(newState[overId as keyof typeof newState] as CardData[]),
          draggedCard!,
        ] as any;
      }

      return newState;
    });

    // Sync the move
    syncCardEvent(activeId, CardEventType.CARD_ARRANGED, {
      zone: overId,
    });

    setActiveId(null);
  };

  // Get active card for drag overlay
  const getActiveCard = () => {
    if (!activeId) return null;

    // Check all zones
    for (const cards of Object.values(gameState)) {
      if (Array.isArray(cards)) {
        const card = cards.find((c) => c.id === activeId);
        if (card) return card;
      } else if (cards instanceof Map) {
        for (const card of Array.from(cards.values())) {
          if (card.id === activeId) return card;
        }
      }
    }

    // Check deck cards (when dragging from list)
    if (activeId.startsWith('list-')) {
      const deckId = activeId.replace('list-', '');
      return getDeckCards().find((c) => c.id === deckId);
    }

    return null;
  };

  // Clear canvas
  const handleClearCanvas = () => {
    setGameState({
      advantage: [],
      disadvantage: [],
      gridCards: new Map(),
      like: [],
      neutral: [],
      dislike: [],
    });
    syncCardEvent('', CardEventType.AREA_CLEARED, {});
  };

  // Save canvas (placeholder)
  const handleSaveCanvas = () => {
    console.log('Saving canvas state:', gameState);
    // TODO: Implement save functionality
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Card List */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋卡片..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <CardList
            title={
              gameMode === '優劣勢分析'
                ? '職能盤點卡'
                : gameMode === '價值觀排序'
                  ? '價值導航卡'
                  : '職游旅人卡'
            }
            cards={getDeckCards()}
            deckType={gameMode}
            onDoubleClick={handleAddCard}
            searchQuery={searchQuery}
          />

          {/* Game Tokens */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">遊戲籌碼</h3>
            <div className="grid grid-cols-3 gap-2">
              {['star', 'heart', 'diamond', 'circle', 'square', 'triangle'].map((shape) => (
                <div key={shape} className="w-12 h-12 bg-blue-100 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 p-6">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{gameMode}</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleClearCanvas}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空畫面
              </Button>
              <Button
                onClick={handleSaveCanvas}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                儲存畫面
              </Button>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-[calc(100%-80px)]">
            {gameMode === '優劣勢分析' && (
              <AdvantageDisadvantageCanvas
                advantageCards={gameState.advantage}
                disadvantageCards={gameState.disadvantage}
              />
            )}
            {gameMode === '價值觀排序' && <ValueGridCanvas cards={gameState.gridCards} />}
            {gameMode === '六大性格分析' && (
              <PersonalityCanvas
                likeCards={gameState.like}
                neutralCards={gameState.neutral}
                dislikeCards={gameState.dislike}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 transform scale-105">
            {getActiveCard() ? (
              <Card
                card={getActiveCard()!}
                isFaceUp={true}
                isSelected={false}
                isDragging={true}
                position={{ x: 0, y: 0 }}
                rotation={0}
                scale={1.1}
              />
            ) : null}
          </div>
        ) : null}
      </DragOverlay>

      {/* Card Notes Modal */}
      {selectedNotesCard && (
        <CardNotesModal
          isOpen={true}
          card={selectedNotesCard}
          roomId={roomId}
          onClose={() => setSelectedNotesCard(null)}
        />
      )}
    </DndContext>
  );
}
