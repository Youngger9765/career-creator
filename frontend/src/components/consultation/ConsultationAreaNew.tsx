'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  useDraggable,
} from '@dnd-kit/core';
import { CardList } from './CardList';
import { AdvantageDisadvantageCanvas } from './AdvantageDisadvantageCanvas';
import { ValueGridCanvas } from './ValueGridCanvas';
import { ResponsiveValueGrid } from './ResponsiveValueGrid';
import { PersonalityCanvas } from './PersonalityCanvas';
import { Card } from '../Card';
import { CardNotesModal } from '../CardNotesModal';
import { useCardSync } from '@/hooks/use-card-sync';
import { CardData } from '@/types/cards';
import { Button } from '../ui/button';
import { CardEventType } from '@/lib/api/card-events';
import { Search, Save, Trash2 } from 'lucide-react';
import { getTokensForMode, shouldShowTokens, type GameToken } from '@/config/gameTokens';

interface ConsultationAreaNewProps {
  roomId: string;
  isHost: boolean;
  gameMode: '優劣勢分析' | '價值觀排序' | '六大性格分析';
  selectedDeck: '職游旅人卡' | '職能盤點卡' | '價值導航卡';
}

// 輔助卡數據（Holland 六大性格類型解釋卡）
const AUXILIARY_CARDS: CardData[] = [
  {
    id: 'aux-r',
    title: 'R - 實務型',
    description: '喜歡具體操作和實際工作',
    category: 'personality',
    tags: [],
  },
  {
    id: 'aux-i',
    title: 'I - 研究型',
    description: '喜歡分析研究和思考',
    category: 'personality',
    tags: [],
  },
  {
    id: 'aux-a',
    title: 'A - 藝術型',
    description: '喜歡創作和藝術表達',
    category: 'personality',
    tags: [],
  },
  {
    id: 'aux-s',
    title: 'S - 社會型',
    description: '喜歡幫助他人和社交',
    category: 'personality',
    tags: [],
  },
  {
    id: 'aux-e',
    title: 'E - 企業型',
    description: '喜歡領導和說服他人',
    category: 'personality',
    tags: [],
  },
  {
    id: 'aux-c',
    title: 'C - 事務型',
    description: '喜歡有序和規範的工作',
    category: 'personality',
    tags: [],
  },
];

// Draggable Token Component (價值觀排序專用)
function DraggableToken({ token }: { token: GameToken }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: token.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    triangle: 'clip-path-triangle',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-12 h-12 ${token.color} ${shapeClasses[token.shape]} flex items-center justify-center cursor-move hover:scale-110 transition-transform shadow-md`}
    >
      <span className="text-lg font-bold">{token.label}</span>
    </div>
  );
}

// Draggable Auxiliary Card Component
function DraggableAuxCard({
  card,
  onDoubleClick,
}: {
  card: CardData;
  onDoubleClick: (card: CardData) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `aux-${card.id}`,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onDoubleClick(card)}
      className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 cursor-move hover:shadow-lg transition-shadow"
    >
      <div className="text-sm font-bold mb-1">{card.title}</div>
      <div className="text-xs text-gray-600">{card.description}</div>
    </div>
  );
}

// Card deck data - 職游旅人卡（職業卡）
const CAREER_CARDS: CardData[] = [
  // 實際的職業卡片
  {
    id: 'career-001',
    title: '軟體工程師',
    description: '開發軟體應用程式',
    category: '資訊科技',
    tags: [],
  },
  {
    id: 'career-002',
    title: '產品經理',
    description: '規劃產品策略與發展',
    category: '管理',
    tags: [],
  },
  {
    id: 'career-003',
    title: '行銷專員',
    description: '推廣產品與品牌',
    category: '行銷',
    tags: [],
  },
  {
    id: 'career-004',
    title: '會計師',
    description: '處理財務報表與稅務',
    category: '財務',
    tags: [],
  },
  {
    id: 'career-005',
    title: '人資專員',
    description: '招募與管理人才',
    category: '人力資源',
    tags: [],
  },
  {
    id: 'career-006',
    title: '業務代表',
    description: '開發客戶與銷售',
    category: '業務',
    tags: [],
  },
  {
    id: 'career-007',
    title: '設計師',
    description: '視覺設計與創意發想',
    category: '設計',
    tags: [],
  },
  {
    id: 'career-008',
    title: '數據分析師',
    description: '分析數據提供洞察',
    category: '數據',
    tags: [],
  },
  {
    id: 'career-009',
    title: '專案經理',
    description: '管理專案進度與資源',
    category: '管理',
    tags: [],
  },
  {
    id: 'career-010',
    title: '客服專員',
    description: '處理客戶問題與需求',
    category: '服務',
    tags: [],
  },
  { id: 'career-011', title: '教師', description: '教育與培養學生', category: '教育', tags: [] },
  { id: 'career-012', title: '護理師', description: '照護病患健康', category: '醫療', tags: [] },
  { id: 'career-013', title: '律師', description: '提供法律諮詢服務', category: '法律', tags: [] },
  { id: 'career-014', title: '建築師', description: '設計建築空間', category: '建築', tags: [] },
  { id: 'career-015', title: '廚師', description: '烹飪美食料理', category: '餐飲', tags: [] },
];

// 職能盤點卡（技能卡）
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
  {
    id: 'skill-006',
    title: '問題解決',
    description: '找出問題根源並解決',
    category: '思維能力',
    tags: [],
  },
  {
    id: 'skill-007',
    title: '團隊合作',
    description: '與他人協作達成目標',
    category: '人際能力',
    tags: [],
  },
  {
    id: 'skill-008',
    title: '專案管理',
    description: '規劃執行專案進度',
    category: '管理能力',
    tags: [],
  },
  {
    id: 'skill-009',
    title: '簡報技巧',
    description: '清楚表達與說服他人',
    category: '溝通能力',
    tags: [],
  },
  {
    id: 'skill-010',
    title: '數據分析',
    description: '解讀數據找出洞察',
    category: '分析能力',
    tags: [],
  },
];

// 價值導航卡
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
    title: '團隊歸屬',
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
  {
    id: 'value-006',
    title: '工作穩定',
    description: '穩定的職涯發展',
    category: '安全價值',
    tags: [],
  },
  {
    id: 'value-007',
    title: '社會貢獻',
    description: '對社會產生正面影響',
    category: '意義價值',
    tags: [],
  },
  {
    id: 'value-008',
    title: '自主彈性',
    description: '工作的自由度與彈性',
    category: '自主價值',
    tags: [],
  },
  {
    id: 'value-009',
    title: '創新挑戰',
    description: '追求創新與突破',
    category: '成長價值',
    tags: [],
  },
];

export function ConsultationAreaNew({
  roomId,
  isHost,
  gameMode,
  selectedDeck,
}: ConsultationAreaNewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotesCard, setSelectedNotesCard] = useState<CardData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'auxiliary' | 'tokens'>('cards');

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

  // Track used cards (cards that are on the canvas)
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());

  const { syncCardEvent } = useCardSync({ roomId });

  // Handle game mode changes
  useEffect(() => {
    // Clear the canvas when game mode changes
    setGameState({
      advantage: [],
      disadvantage: [],
      gridCards: new Map(),
      like: [],
      neutral: [],
      dislike: [],
    });

    // Reset to cards tab when game mode or deck changes
    // This prevents showing empty tab content
    setActiveTab('cards');
  }, [gameMode, selectedDeck]);

  // Validate current tab when conditions change
  useEffect(() => {
    // If current tab is auxiliary but it's not available anymore
    if (activeTab === 'auxiliary' && !shouldShowAuxiliaryCards()) {
      setActiveTab('cards');
    }
    // If current tab is tokens but it's not available anymore
    if (activeTab === 'tokens' && !shouldShowTokens(gameMode, selectedDeck)) {
      setActiveTab('cards');
    }
  }, [activeTab, gameMode, selectedDeck]);

  // Check if should show auxiliary cards
  const shouldShowAuxiliaryCards = () => {
    return selectedDeck === '職游旅人卡' && gameMode === '六大性格分析';
  };

  // Get game tokens for current game mode
  const getGameTokens = () => {
    return getTokensForMode(gameMode, selectedDeck);
  };

  // Get deck based on selected deck type
  const getDeckCards = () => {
    switch (selectedDeck) {
      case '職游旅人卡':
        return CAREER_CARDS; // 返回職業卡
      case '職能盤點卡':
        return SKILL_CARDS; // 返回技能卡
      case '價值導航卡':
        return VALUE_CARDS; // 返回價值卡
      default:
        return CAREER_CARDS;
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

    // Check all zones for existing cards
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

    // If card not found in zones, it's a new card from the list or auxiliary cards
    let isNewCard = false;
    if (!draggedCard) {
      if (activeId.startsWith('list-')) {
        const deckId = activeId.replace('list-', '');
        const deckCard = getDeckCards().find((c) => c.id === deckId);
        if (deckCard) {
          // Create new game card with unique ID
          draggedCard = { ...deckCard, id: `game-${deckCard.id}-${Date.now()}` };
          isNewCard = true;
        }
      } else if (activeId.startsWith('aux-')) {
        const auxId = activeId.replace('aux-', '');
        const auxCard = AUXILIARY_CARDS.find((c) => c.id === auxId);
        if (auxCard) {
          // Create new game card with unique ID
          draggedCard = { ...auxCard, id: `game-${auxCard.id}-${Date.now()}` };
          isNewCard = true;
        }
      }
    }

    if (!draggedCard) {
      setActiveId(null);
      return;
    }

    // Don't move if dropping on same zone
    if (sourceZone === overId) {
      setActiveId(null);
      return;
    }

    // Move card to new zone
    setGameState((prev) => {
      const newState = { ...prev };

      // Remove from source (only if not a new card)
      if (!isNewCard) {
        if (sourceZone && sourceZone.startsWith('grid-')) {
          newState.gridCards = new Map(prev.gridCards);
          newState.gridCards.delete(sourceZone);
        } else if (sourceZone && Array.isArray(prev[sourceZone as keyof typeof prev])) {
          newState[sourceZone as keyof typeof newState] = (
            prev[sourceZone as keyof typeof prev] as CardData[]
          ).filter((c) => c.id !== draggedCard!.id) as any;
        }
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

    // Track the original card ID as used (for hiding from left panel)
    if (isNewCard) {
      const originalId = activeId.startsWith('list-')
        ? activeId.replace('list-', '')
        : activeId.startsWith('aux-')
          ? activeId.replace('aux-', '')
          : activeId;
      setUsedCardIds((prev) => new Set(Array.from(prev).concat(originalId)));
    }

    // Sync the move (use the new card ID if it's a new card)
    syncCardEvent(draggedCard.id, CardEventType.CARD_ARRANGED, {
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

    // Check auxiliary cards (when dragging from aux cards)
    if (activeId.startsWith('aux-')) {
      const auxId = activeId.replace('aux-', '');
      return AUXILIARY_CARDS.find((c) => c.id === auxId);
    }

    return null;
  };

  // Remove card from canvas and return it to the deck
  const handleRemoveCard = (cardId: string) => {
    // Find and remove the card from game state
    setGameState((prev) => {
      const newState = { ...prev };

      // Remove from advantage/disadvantage
      newState.advantage = prev.advantage.filter((c) => c.id !== cardId);
      newState.disadvantage = prev.disadvantage.filter((c) => c.id !== cardId);

      // Remove from like/neutral/dislike
      newState.like = prev.like.filter((c) => c.id !== cardId);
      newState.neutral = prev.neutral.filter((c) => c.id !== cardId);
      newState.dislike = prev.dislike.filter((c) => c.id !== cardId);

      // Remove from grid
      const newGrid = new Map(prev.gridCards);
      for (const [key, card] of Array.from(newGrid.entries())) {
        if (card.id === cardId) {
          newGrid.delete(key);
          break;
        }
      }
      newState.gridCards = newGrid;

      return newState;
    });

    // Extract original card ID from game card ID
    // Format is "game-{originalId}-{timestamp}"
    const match = cardId.match(/^game-(.+)-\d+$/);
    if (match) {
      const originalId = match[1];
      setUsedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(originalId);
        return newSet;
      });
    }

    syncCardEvent(cardId, CardEventType.CARD_MOVED, { zone: 'removed' });
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
    setUsedCardIds(new Set()); // Clear all used cards
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
        {/* Left Sidebar with Tabs */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tab Headers */}
          <div className="flex bg-gray-100 border-b-2 border-gray-300">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 px-4 py-3 font-semibold transition-all relative ${
                activeTab === 'cards'
                  ? 'text-blue-700 bg-white border-l-2 border-t-2 border-r-2 border-gray-300 rounded-t-lg shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🃏</span>
                <span>牌卡</span>
              </div>
              {activeTab === 'cards' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            {shouldShowAuxiliaryCards() && (
              <button
                onClick={() => setActiveTab('auxiliary')}
                className={`flex-1 px-4 py-3 font-semibold transition-all relative ${
                  activeTab === 'auxiliary'
                    ? 'text-blue-700 bg-white border-l-2 border-t-2 border-r-2 border-gray-300 rounded-t-lg shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📚</span>
                  <span>輔助卡</span>
                </div>
                {activeTab === 'auxiliary' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            )}
            {shouldShowTokens(gameMode, selectedDeck) && (
              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex-1 px-4 py-3 font-semibold transition-all relative ${
                  activeTab === 'tokens'
                    ? 'text-blue-700 bg-white border-l-2 border-t-2 border-r-2 border-gray-300 rounded-t-lg shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">💰</span>
                  <span>籌碼</span>
                </div>
                {activeTab === 'tokens' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {/* Search Bar - Only show for cards tab */}
            {activeTab === 'cards' && (
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
            )}

            {/* Cards Tab */}
            {activeTab === 'cards' && (
              <CardList
                title={selectedDeck}
                cards={getDeckCards()}
                deckType={gameMode}
                onDoubleClick={handleAddCard}
                searchQuery={searchQuery}
                usedCardIds={usedCardIds}
              />
            )}

            {/* Auxiliary Cards Tab */}
            {activeTab === 'auxiliary' && shouldShowAuxiliaryCards() && (
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Holland 性格解釋卡</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AUXILIARY_CARDS.map((card) => (
                    <DraggableAuxCard key={card.id} card={card} onDoubleClick={handleAddCard} />
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    這些輔助卡用於解釋六大性格類型，可以拖曳到畫布上作為參考。
                  </p>
                </div>
              </div>
            )}

            {/* Tokens Tab */}
            {activeTab === 'tokens' && shouldShowTokens(gameMode, selectedDeck) && (
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">遊戲籌碼</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {getGameTokens().map((token) => (
                    <DraggableToken key={token.id} token={token} />
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 mb-2">籌碼說明：</p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• 紅色圓形 = 10分（最重要）</li>
                    <li>• 藍色方形 = 5分（重要）</li>
                    <li>• 綠色三角 = 1分（一般）</li>
                  </ul>
                </div>
              </div>
            )}
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
                onRemoveCard={handleRemoveCard}
              />
            )}
            {gameMode === '價值觀排序' && (
              <ResponsiveValueGrid cards={gameState.gridCards} onRemoveCard={handleRemoveCard} />
            )}
            {gameMode === '六大性格分析' && (
              <PersonalityCanvas
                likeCards={gameState.like}
                neutralCards={gameState.neutral}
                dislikeCards={gameState.dislike}
                onRemoveCard={handleRemoveCard}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && getActiveCard() ? (
          <div className="w-32 h-44 bg-blue-100 border-2 border-blue-400 rounded-lg shadow-xl p-4 opacity-90">
            <div className="text-sm font-semibold">{getActiveCard()?.title}</div>
            <div className="text-xs text-gray-600 mt-2">{getActiveCard()?.description}</div>
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
