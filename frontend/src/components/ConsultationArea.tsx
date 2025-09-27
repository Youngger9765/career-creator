'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDndMonitor,
  useDroppable,
} from '@dnd-kit/core';
import { Card } from './Card';
import { CardDeck } from './CardDeck';
import { CardNotesModal } from './CardNotesModal';
import { GameToken } from './GameToken';
import { DraggableCardPreview } from './DraggableCardPreview';
import { DroppableGameArea } from './DroppableGameArea';
import { GameCard, CardData, DEFAULT_CAREER_CARDS } from '@/types/cards';
import { CardEventType } from '@/lib/api/card-events';
import { useCardSync } from '@/hooks/use-card-sync';
import { GameStatus } from '@/lib/api/game-sessions';

interface ConsultationAreaProps {
  roomId: string;
  selectedDeck: string;
  selectedGameRule: string;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  isReadOnly?: boolean;
  performerInfo?: {
    id?: string;
    name?: string;
    type?: string;
  };
  onClearAreaReady?: (clearFn: () => void) => void;
  useGameSession?: boolean; // Enable game session mode
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
    id: 'advantage',
    name: '優勢 (5張)',
    description: '我的優勢能力',
    color: 'border-green-400 bg-green-50',
    position: { x: 400, y: 150 },
    width: 250,
    height: 180,
  },
  {
    id: 'disadvantage',
    name: '劣勢 (5張)',
    description: '需要改進的能力',
    color: 'border-red-400 bg-red-50',
    position: { x: 400, y: 350 },
    width: 250,
    height: 180,
  },
  {
    id: 'discussion',
    name: '討論區',
    description: '正在討論的卡片',
    color: 'border-blue-300 bg-blue-50',
    position: { x: 700, y: 250 },
    width: 250,
    height: 180,
  },
];

// Grid Slot Component for 價值觀排序
function GridSlot({
  index,
  cards,
  isActive,
}: {
  index: number;
  cards: GameCard[];
  isActive: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `grid-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={`aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 relative ${
        isActive ? 'border-solid border-blue-500 scale-105' : ''
      }`}
    >
      {cards.length === 0 ? (
        <span>第 {index + 1} 名</span>
      ) : (
        cards.map((card) => (
          <div key={card.id} className="absolute inset-0 p-2">
            <Card
              card={card.data}
              draggableId={card.id}
              isFaceUp={card.isFaceUp}
              isSelected={card.isSelected}
              isDragging={false}
              position={{ x: 0, y: 0 }}
              rotation={0}
              scale={0.7}
            />
          </div>
        ))
      )}
    </div>
  );
}

// Three Zone Component for 六大性格分析
function ThreeZoneDropZone({
  id,
  title,
  emoji,
  cards,
  maxCount,
  bgColor,
  borderColor,
  textColor,
  isActive,
}: {
  id: string;
  title: string;
  emoji: string;
  cards: GameCard[];
  maxCount?: number;
  bgColor: string;
  borderColor: string;
  textColor: string;
  isActive: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="mb-4" ref={setNodeRef}>
      <div
        className={`
          border-2 border-dashed ${borderColor} rounded-lg ${bgColor} min-h-[240px] ${textColor} relative transition-all duration-200
          ${isActive ? 'border-solid scale-105 shadow-lg ring-2 ring-opacity-20' : ''}
        `}
        style={{ minHeight: '240px' }}
      >
        {/* Title inside the drop zone */}
        <div
          className={`absolute top-2 left-3 font-medium ${textColor} flex items-center text-sm z-10`}
        >
          <span className="text-lg mr-1">{emoji}</span>
          {title} ({cards.length}/{maxCount || '∞'})
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-5 gap-2 p-4 pt-10">
          {cards.map((card) => (
            <div key={card.id} className="relative" style={{ aspectRatio: '2/3' }}>
              <Card
                card={card.data}
                isFaceUp={true}
                isSelected={false}
                isDragging={false}
                position={{ x: 0, y: 0 }}
                rotation={0}
                scale={0.9}
              />
            </div>
          ))}
        </div>

        {/* Drop hint in center when empty */}
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400">拖拽卡片到此處</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DropZoneComponent({
  zone,
  isActive,
  cards,
}: {
  zone: DropZone;
  isActive: boolean;
  cards: GameCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: {
      type: 'zone',
      zoneId: zone.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-droppable={zone.id}
      className={`
        w-full border-2 border-dashed rounded-lg p-4 transition-all duration-200
        ${zone.color}
        ${isActive || isOver ? 'border-solid scale-105 shadow-lg' : ''}
      `}
      style={{
        height: zone.height,
        minHeight: '120px',
      }}
    >
      <div className="grid grid-cols-5 gap-2">
        {/* Render up to 5 cards */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="relative border border-dashed border-gray-300 rounded-lg bg-white/50 flex items-center justify-center"
            style={{ aspectRatio: '2/3' }}
          >
            {cards[index] ? (
              <div className="absolute inset-0">
                <Card
                  card={cards[index].data}
                  isFaceUp={true}
                  isSelected={false}
                  isDragging={false}
                  position={{ x: 0, y: 0 }}
                  rotation={0}
                  scale={0.9}
                />
              </div>
            ) : (
              <div className="text-xs text-gray-400">空位</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsultationArea({
  roomId,
  selectedDeck,
  selectedGameRule,
  onCardEvent,
  isReadOnly = false,
  performerInfo,
  onClearAreaReady,
}: ConsultationAreaProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [noteModalCard, setNoteModalCard] = useState<CardData | null>(null);
  const [cardNotes, setCardNotes] = useState<Record<string, string[]>>({});
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  // 牌卡瀏覽狀態
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedAuxCardId, setSelectedAuxCardId] = useState<string | null>(null);

  // 已使用的卡片ID列表（從列表中移除）
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());

  // 籌碼狀態
  const [gameTokens, setGameTokens] = useState<
    Array<{
      id: string;
      type: 'chip' | 'marker';
      color: string;
      value?: number;
      position: { x: number; y: number };
      zIndex: number;
    }>
  >([]);

  // Mock 牌卡數據 - 擴展為更多卡片
  const mockCards = {
    職游旅人卡: [
      // 科技類
      {
        id: 'career-1',
        title: '軟體工程師',
        description: '負責軟體開發與維護',
        category: 'technology',
        tags: ['程式', '邏輯'],
      },
      {
        id: 'career-2',
        title: '資料科學家',
        description: '分析大數據並建立模型',
        category: 'technology',
        tags: ['數據', '分析'],
      },
      {
        id: 'career-3',
        title: '網路安全專家',
        description: '保護資訊系統安全',
        category: 'technology',
        tags: ['安全', '防護'],
      },
      {
        id: 'career-4',
        title: 'UI/UX設計師',
        description: '設計使用者介面和體驗',
        category: 'technology',
        tags: ['設計', '美學'],
      },
      {
        id: 'career-5',
        title: '系統管理員',
        description: '維護和管理電腦系統',
        category: 'technology',
        tags: ['維護', '管理'],
      },

      // 醫療類
      {
        id: 'career-6',
        title: '醫生',
        description: '診斷和治療疾病',
        category: 'healthcare',
        tags: ['醫療', '診斷'],
      },
      {
        id: 'career-7',
        title: '護理師',
        description: '提供醫療護理服務',
        category: 'healthcare',
        tags: ['照護', '服務'],
      },
      {
        id: 'career-8',
        title: '藥師',
        description: '配製和管理藥物',
        category: 'healthcare',
        tags: ['藥物', '專業'],
      },
      {
        id: 'career-9',
        title: '物理治療師',
        description: '幫助患者恢復身體功能',
        category: 'healthcare',
        tags: ['復健', '治療'],
      },
      {
        id: 'career-10',
        title: '心理諮商師',
        description: '提供心理健康諮詢',
        category: 'healthcare',
        tags: ['心理', '諮詢'],
      },

      // 教育類
      {
        id: 'career-11',
        title: '小學老師',
        description: '教育小學生基礎知識',
        category: 'education',
        tags: ['教學', '兒童'],
      },
      {
        id: 'career-12',
        title: '中學老師',
        description: '教授中學課程',
        category: 'education',
        tags: ['教育', '青少年'],
      },
      {
        id: 'career-13',
        title: '大學教授',
        description: '進行高等教育和研究',
        category: 'education',
        tags: ['研究', '學術'],
      },
      {
        id: 'career-14',
        title: '幼兒園老師',
        description: '照顧和教育幼兒',
        category: 'education',
        tags: ['幼教', '照顧'],
      },
      {
        id: 'career-15',
        title: '補習班老師',
        description: '提供課外輔導',
        category: 'education',
        tags: ['輔導', '教學'],
      },

      // 更多職業...
      {
        id: 'career-16',
        title: '律師',
        description: '提供法律諮詢和服務',
        category: 'law',
        tags: ['法律', '諮詢'],
      },
      {
        id: 'career-17',
        title: '會計師',
        description: '處理財務和稅務事務',
        category: 'finance',
        tags: ['財務', '稅務'],
      },
      {
        id: 'career-18',
        title: '建築師',
        description: '設計建築物和空間',
        category: 'design',
        tags: ['建築', '空間'],
      },
      {
        id: 'career-19',
        title: '廚師',
        description: '製作美味料理',
        category: 'service',
        tags: ['烹飪', '美食'],
      },
      {
        id: 'career-20',
        title: '記者',
        description: '報導新聞和事件',
        category: 'media',
        tags: ['新聞', '報導'],
      },
    ],
    職能盤點卡: [
      {
        id: 'skill-1',
        title: '溝通協調',
        description: '與他人有效溝通的能力',
        category: 'communication',
        tags: ['溝通', '協調'],
      },
      {
        id: 'skill-2',
        title: '分析思考',
        description: '邏輯分析和批判性思考',
        category: 'analytical',
        tags: ['分析', '邏輯'],
      },
      {
        id: 'skill-3',
        title: '領導管理',
        description: '領導團隊和管理能力',
        category: 'leadership',
        tags: ['領導', '管理'],
      },
      {
        id: 'skill-4',
        title: '創新發想',
        description: '創造性思維和解決問題',
        category: 'creative',
        tags: ['創新', '思維'],
      },
      {
        id: 'skill-5',
        title: '時間管理',
        description: '有效規劃和控制時間',
        category: 'organizational',
        tags: ['時間', '規劃'],
      },
      {
        id: 'skill-6',
        title: '團隊合作',
        description: '與他人協作達成目標',
        category: 'collaboration',
        tags: ['團隊', '合作'],
      },
      {
        id: 'skill-7',
        title: '學習能力',
        description: '快速學習新知識和技能',
        category: 'learning',
        tags: ['學習', '成長'],
      },
      {
        id: 'skill-8',
        title: '抗壓能力',
        description: '在壓力下保持表現',
        category: 'resilience',
        tags: ['抗壓', '韌性'],
      },
      {
        id: 'skill-9',
        title: '適應能力',
        description: '面對變化的調適能力',
        category: 'adaptability',
        tags: ['適應', '彈性'],
      },
      {
        id: 'skill-10',
        title: '解決問題',
        description: '識別和解決各種問題',
        category: 'problem-solving',
        tags: ['解決', '問題'],
      },
    ],
    價值導航卡: [
      {
        id: 'value-1',
        title: '成就感',
        description: '追求個人成就和認可',
        category: 'achievement',
        tags: ['成就', '認可'],
      },
      {
        id: 'value-2',
        title: '穩定性',
        description: '尋求安全和穩定',
        category: 'security',
        tags: ['穩定', '安全'],
      },
      {
        id: 'value-3',
        title: '自主性',
        description: '獨立自主的工作環境',
        category: 'autonomy',
        tags: ['自主', '獨立'],
      },
      {
        id: 'value-4',
        title: '社會貢獻',
        description: '為社會做出貢獻',
        category: 'service',
        tags: ['貢獻', '服務'],
      },
      {
        id: 'value-5',
        title: '創意發揮',
        description: '能夠展現創意和想像力',
        category: 'creativity',
        tags: ['創意', '想像'],
      },
      {
        id: 'value-6',
        title: '工作平衡',
        description: '工作與生活的平衡',
        category: 'balance',
        tags: ['平衡', '生活'],
      },
      {
        id: 'value-7',
        title: '學習成長',
        description: '持續學習和個人發展',
        category: 'growth',
        tags: ['學習', '成長'],
      },
      {
        id: 'value-8',
        title: '人際關係',
        description: '建立良好的人際網絡',
        category: 'relationships',
        tags: ['人際', '關係'],
      },
      {
        id: 'value-9',
        title: '經濟報酬',
        description: '獲得合理的經濟回報',
        category: 'financial',
        tags: ['經濟', '報酬'],
      },
      {
        id: 'value-10',
        title: '地位聲望',
        description: '獲得社會認可和尊重',
        category: 'status',
        tags: ['地位', '聲望'],
      },
    ],
  };

  // 輔助卡數據（解釋卡）
  const auxiliaryCards = {
    六大性格分析: [
      {
        id: 'aux-r',
        title: 'R - 實務型',
        description: '喜歡具體操作和實際工作',
        category: 'personality',
      },
      {
        id: 'aux-i',
        title: 'I - 研究型',
        description: '喜歡分析研究和思考',
        category: 'personality',
      },
      {
        id: 'aux-a',
        title: 'A - 藝術型',
        description: '喜歡創作和藝術表達',
        category: 'personality',
      },
      {
        id: 'aux-s',
        title: 'S - 社會型',
        description: '喜歡幫助他人和社交',
        category: 'personality',
      },
      {
        id: 'aux-e',
        title: 'E - 企業型',
        description: '喜歡領導和說服他人',
        category: 'personality',
      },
      {
        id: 'aux-c',
        title: 'C - 事務型',
        description: '喜歡有序和規範的工作',
        category: 'personality',
      },
    ],
  };

  // 取得當前牌卡數據（排除已使用的卡片）
  const getCurrentCards = () => {
    const allCards = mockCards[selectedDeck as keyof typeof mockCards] || [];
    return allCards.filter((card) => !usedCardIds.has(card.id));
  };

  // 取得輔助卡數據
  const getAuxiliaryCards = () => {
    return auxiliaryCards[selectedGameRule as keyof typeof auxiliaryCards] || [];
  };

  // 取得選中的卡片
  const getSelectedCard = () => {
    const cards = getCurrentCards();
    return cards.find((card) => card.id === selectedCardId) || cards[0];
  };

  // 取得選中的輔助卡
  const getSelectedAuxCard = () => {
    const auxCards = getAuxiliaryCards();
    return auxCards.find((card) => card.id === selectedAuxCardId) || auxCards[0];
  };

  // 檢查是否需要顯示輔助卡
  const shouldShowAuxiliaryCards = () => {
    return selectedGameRule === '六大性格分析' && selectedDeck === '職游旅人卡';
  };

  // 新增籌碼到畫布
  const addTokenToCanvas = useCallback(
    (tokenType: 'chip' | 'marker', color: string, value?: number) => {
      const newToken = {
        id: `token-${Date.now()}-${Math.random()}`,
        type: tokenType,
        color,
        value,
        position: {
          x: 200 + Math.random() * 200,
          y: 200 + Math.random() * 200,
        },
        zIndex: 1,
      };
      setGameTokens((prev) => [...prev, newToken]);
    },
    []
  );

  // 清空桌面的函數
  const resetGameArea = useCallback(() => {
    setCards([]);
    setGameTokens([]);
    setActiveCard(null);
    setActiveDropZone(null);
    setCardNotes({});
    setUsedCardIds(new Set()); // 清空已使用卡片列表
  }, []);

  // 當牌卡或玩法改變時，重置桌面
  useEffect(() => {
    resetGameArea();
  }, [selectedDeck, selectedGameRule, resetGameArea]);

  // 初始化選中卡片
  useEffect(() => {
    const cards = getCurrentCards();
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [selectedDeck, selectedCardId]);

  useEffect(() => {
    const auxCards = getAuxiliaryCards();
    if (auxCards.length > 0 && !selectedAuxCardId) {
      setSelectedAuxCardId(auxCards[0].id);
    }
  }, [selectedGameRule, selectedAuxCardId]);

  // 玩法與卡片類型的映射關係
  const gameRuleCardMapping = {
    優劣勢分析: ['職游旅人卡', '職能盤點卡', '價值導航卡'], // 不限制，任何牌卡都可以
    價值觀排序: ['價值導航卡'], // 只能使用價值卡
    六大性格分析: ['職游旅人卡'], // 需要解釋卡+職業卡
  };

  // 根據選擇的玩法，篩選可用的卡片
  const getAvailableDecks = (gameRule: string) => {
    return gameRuleCardMapping[gameRule as keyof typeof gameRuleCardMapping] || [];
  };

  // Disable card synchronization for single-machine mode
  const {
    syncedCards,
    isActive: isSyncActive,
    error: syncError,
    syncCardEvent,
    updateLocalCard,
    applyToGameCards,
    clearError: clearSyncError,
  } = useCardSync({
    roomId,
    enabled: false, // Disable polling for single-machine mode
    performerInfo,
  });

  // Apply synchronized state to local cards
  useEffect(() => {
    if (syncedCards.length === 0) return;

    setCards((prevCards) => {
      // Only update if there are actual changes
      const updatedCards = applyToGameCards(prevCards);
      // Check if cards actually changed to prevent unnecessary re-renders
      if (JSON.stringify(prevCards) === JSON.stringify(updatedCards)) {
        return prevCards;
      }
      return updatedCards;
    });
  }, [syncedCards, applyToGameCards]);

  const handleDealCard = useCallback(
    (cardData: CardData) => {
      const newCard: GameCard = {
        id: `game-${cardData.id}-${Date.now()}`,
        data: cardData,
        position: {
          x: 100 + Math.random() * 200 - 100, // Place cards in the game area
          y: 100 + Math.random() * 200 - 100,
        },
        isFaceUp: false,
        isSelected: false,
        rotation: Math.random() * 10 - 5, // Random rotation between -5 and 5 degrees
        scale: 1,
        zIndex: cards.length + 1,
      };

      setCards((prev) => [...prev, newCard]);

      // 將卡片ID加入已使用列表
      setUsedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(cardData.id);
        return newSet;
      });

      // 自動選擇下一張可用卡片
      const allCards = mockCards[selectedDeck as keyof typeof mockCards] || [];
      const remainingCards = allCards.filter(
        (card) => card.id !== cardData.id && !usedCardIds.has(card.id)
      );
      if (remainingCards.length > 0) {
        setSelectedCardId(remainingCards[0].id);
      } else {
        setSelectedCardId(null);
      }

      // Sync card dealt event
      if (!isReadOnly) {
        syncCardEvent(newCard.id, 'card_dealt' as CardEventType, {
          position: newCard.position,
          card_data: cardData,
          from_deck: true,
        }).catch(console.error);
      }
    },
    [cards.length, isReadOnly, syncCardEvent, selectedDeck, usedCardIds]
  );

  const handleCardFlip = useCallback(
    (cardId: string, faceUp: boolean) => {
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, isFaceUp: faceUp } : card))
      );

      // Sync card flip event
      if (!isReadOnly) {
        syncCardEvent(cardId, 'card_flipped' as CardEventType, {
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
    const activeId = event.active.id as string;
    setActiveCard(activeId);
    setActiveDragItem(event.active);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setActiveDropZone((over?.id as string) || null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      const draggedId = active.id as string;

      setActiveCard(null);
      setActiveDropZone(null);
      setActiveDragItem(null);

      // Check if it's a card preview being dragged
      if (draggedId.startsWith('preview-') && active.data.current?.card) {
        const cardData = active.data.current.card;

        // Only add card if dropped on the game canvas
        if (over && over.id === 'game-canvas') {
          // Create new card at the drop position
          const newCard: GameCard = {
            id: `game-${cardData.id}-${Date.now()}`,
            data: cardData,
            position: {
              x: Math.max(50, Math.min(800, delta.x + 400)), // Constrain to canvas area
              y: Math.max(50, Math.min(600, delta.y + 300)),
            },
            isFaceUp: false,
            isSelected: false,
            rotation: Math.random() * 10 - 5,
            scale: 1,
            zIndex: cards.length + 1,
          };

          setCards((prev) => [...prev, newCard]);

          // Add to used cards list
          setUsedCardIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(cardData.id);
            return newSet;
          });

          // Auto select next card
          const allCards = mockCards[selectedDeck as keyof typeof mockCards] || [];
          const remainingCards = allCards.filter(
            (card) => card.id !== cardData.id && !usedCardIds.has(card.id)
          );
          if (remainingCards.length > 0) {
            setSelectedCardId(remainingCards[0].id);
          } else {
            setSelectedCardId(null);
          }
        }
        return;
      }

      // Check if it's a token being dragged
      if (draggedId.startsWith('token-')) {
        const draggedToken = gameTokens.find((token) => token.id === draggedId);
        if (!draggedToken) return;

        const newPosition = {
          x: draggedToken.position.x + delta.x,
          y: draggedToken.position.y + delta.y,
        };

        setGameTokens((prev) =>
          prev.map((token) =>
            token.id === draggedId ? { ...token, position: newPosition } : token
          )
        );
        return;
      }

      // Find the game card by its ID
      const draggedCard = cards.find((card) => card.id === draggedId);
      if (!draggedCard) return;

      if (over) {
        // Check if it's one of the three zones for 六大性格分析
        if (
          selectedGameRule === '六大性格分析' &&
          (over.id === 'like' || over.id === 'neutral' || over.id === 'dislike')
        ) {
          // Simply assign to zone, position doesn't matter anymore
          setCards((prev) =>
            prev.map((card) =>
              card.id === draggedId
                ? {
                    ...card,
                    zone: over.id as string,
                    isSelected: false,
                    isFaceUp: true,
                    rotation: 0,
                    // Position doesn't matter for cards in zones
                    position: { x: 0, y: 0 },
                  }
                : card
            )
          );

          // Sync card arranged event
          if (!isReadOnly) {
            syncCardEvent(draggedId, 'card_arranged' as CardEventType, {
              drop_zone: over.id,
              zone: over.id,
            }).catch(console.error);
          }

          onCardEvent?.(draggedId, CardEventType.CARD_ARRANGED, {
            drop_zone: over.id,
            zone: over.id,
          });
        }
        // Check for 優劣勢分析 zones
        else if (
          selectedGameRule === '優劣勢分析' &&
          (over.id === 'advantage' || over.id === 'disadvantage')
        ) {
          // Get cards already in this zone
          const cardsInZone = cards.filter((c) => c.zone === over.id);

          // Check if zone is full (max 5 cards)
          if (cardsInZone.length >= 5) {
            console.warn(`Zone ${over.id} is full (max 5 cards)`);
            return;
          }

          // Simply assign to zone, position doesn't matter anymore
          setCards((prev) =>
            prev.map((card) =>
              card.id === draggedId
                ? {
                    ...card,
                    zone: over.id as string,
                    isSelected: false,
                    isFaceUp: true,
                    rotation: 0,
                    // Position doesn't matter for cards in zones
                    position: { x: 0, y: 0 },
                  }
                : card
            )
          );

          // Sync card arranged event
          if (!isReadOnly) {
            syncCardEvent(draggedId, 'card_arranged' as CardEventType, {
              drop_zone: over.id,
              zone: over.id,
            }).catch(console.error);
          }

          onCardEvent?.(draggedId, CardEventType.CARD_ARRANGED, {
            drop_zone: over.id,
            zone: over.id,
          });
        }
        // Check for 價值觀排序 grid positions
        else if (
          selectedGameRule === '價值觀排序' &&
          over.id &&
          over.id.toString().startsWith('grid-')
        ) {
          // Check if slot already has a card
          const cardsInSlot = cards.filter((c) => c.zone === over.id);
          if (cardsInSlot.length > 0) {
            console.warn(`Grid slot ${over.id} already has a card`);
            return;
          }

          // Simply assign to zone, position doesn't matter anymore
          setCards((prev) =>
            prev.map((card) =>
              card.id === draggedId
                ? {
                    ...card,
                    zone: over.id as string,
                    isSelected: false,
                    isFaceUp: true,
                    rotation: 0,
                    // Position doesn't matter for cards in zones
                    position: { x: 0, y: 0 },
                  }
                : card
            )
          );

          // Sync card arranged event
          if (!isReadOnly) {
            syncCardEvent(draggedId, 'card_arranged' as CardEventType, {
              drop_zone: over.id,
              zone: over.id,
            }).catch(console.error);
          }

          onCardEvent?.(draggedId, CardEventType.CARD_ARRANGED, {
            drop_zone: over.id,
            zone: over.id,
          });
        }
      } else {
        // Free drag
        const newPosition = {
          x: draggedCard.position.x + delta.x,
          y: draggedCard.position.y + delta.y,
        };

        setCards((prev) =>
          prev.map((card) =>
            card.id === draggedId ? { ...card, position: newPosition, isSelected: false } : card
          )
        );

        // Sync card move event
        if (!isReadOnly) {
          syncCardEvent(draggedId, 'card_moved' as CardEventType, {
            from_position: draggedCard.position,
            to_position: newPosition,
          }).catch(console.error);
        }

        onCardEvent?.(draggedId, CardEventType.CARD_MOVED, {
          from_position: draggedCard.position,
          to_position: newPosition,
        });
      }
    },
    [
      cards,
      gameTokens,
      isReadOnly,
      syncCardEvent,
      onCardEvent,
      selectedDeck,
      usedCardIds,
      mockCards,
    ]
  );

  const handleCardEvent = useCallback(
    (cardId: string, eventType: CardEventType, data?: any) => {
      onCardEvent?.(cardId, eventType, data);
    },
    [onCardEvent]
  );

  const handleAddNote = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        setNoteModalCard(card.data);
      }
    },
    [cards]
  );

  const handleNoteSaved = useCallback((cardId: string, notes: string) => {
    setCardNotes((prev) => ({
      ...prev,
      [cardId]: [...(prev[cardId] || []), notes],
    }));
    setNoteModalCard(null);
  }, []);

  // Register clear area callback - only once on mount
  useEffect(() => {
    if (onClearAreaReady) {
      const clearFn = () => {
        setCards([]);
        setCardNotes({});
      };
      onClearAreaReady(clearFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - register only once on mount

  // Get cards in specific zone
  const getCardsInZone = useCallback(
    (zoneId: string) => {
      return cards.filter((card) => card.zone === zoneId);
    },
    [cards]
  );

  // Count cards in each zone
  const getZoneCardCount = useCallback(
    (zoneId: string) => {
      return getCardsInZone(zoneId).length;
    },
    [getCardsInZone]
  );

  return (
    <div className="consultation-area w-full h-full flex flex-col bg-gray-50">
      {/* Compact Single Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title and Controls */}
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-gray-800">
              {selectedDeck} ({selectedGameRule})
            </h1>
            <select
              className="px-3 py-1.5 bg-teal-100 border border-teal-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={selectedGameRule}
              disabled
            >
              <option value="優劣勢分析">優劣勢分析 ▼</option>
              <option value="價值觀排序">價值觀排序 ▼</option>
              <option value="六大性格分析">六大性格分析 ▼</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                style={{ width: '180px' }}
              />
              <svg
                className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right: Action Buttons and Help */}
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 bg-teal-500 text-white rounded text-sm hover:bg-teal-600 transition-colors">
              回到牌卡選擇
            </button>
            <button className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors">
              還原
            </button>
            <button className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors">
              取消還原
            </button>
            <button
              className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              onClick={resetGameArea}
            >
              清空畫面
            </button>
            <button className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              儲存畫面
            </button>
            <button className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors ml-2">
              <span className="text-gray-600 text-sm font-bold">?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Left Side - Card Selection */}
          <div className="w-1/3 p-4 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {selectedDeck} - {selectedGameRule}
            </h3>

            {/* 輔助卡區域 (如果需要的話) */}
            {shouldShowAuxiliaryCards() && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">解釋卡 (6張)</h4>
                <div className="flex space-x-4">
                  {/* 左側：解釋卡列表 */}
                  <div className="w-1/2">
                    <div className="bg-gray-50 rounded-lg p-2 h-80 overflow-y-auto">
                      {getAuxiliaryCards().map((card) => (
                        <div
                          key={card.id}
                          className={`p-2 cursor-pointer text-sm rounded hover:bg-blue-100 ${
                            selectedAuxCardId === card.id ? 'bg-blue-200 font-medium' : ''
                          }`}
                          onClick={() => setSelectedAuxCardId(card.id)}
                        >
                          {card.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 右側：選中的解釋卡樣式 - 直立長方形 */}
                  <div className="w-1/2">
                    <div className="w-full h-80 bg-blue-600 rounded-lg shadow-lg flex flex-col items-center justify-center text-white">
                      <div className="text-center px-3">
                        <div className="text-lg font-bold mb-3">
                          {getSelectedAuxCard()?.title || 'R - 實務型'}
                        </div>
                        <div className="text-sm leading-relaxed">
                          {getSelectedAuxCard()?.description || '喜歡具體操作和實際工作'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 主要牌卡區域 */}
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                {selectedDeck} ({getCurrentCards().length}張)
              </h4>

              <div className="flex space-x-4 flex-1 min-h-0">
                {/* 左側：牌卡名稱列表 */}
                <div className="w-1/2 flex flex-col">
                  <div className="bg-gray-50 rounded-lg p-2 h-80 overflow-y-auto">
                    {getCurrentCards().map((card) => (
                      <div
                        key={card.id}
                        className={`p-2 cursor-pointer text-sm rounded hover:bg-gray-200 transition-colors ${
                          selectedCardId === card.id ? 'bg-blue-200 font-medium' : ''
                        }`}
                        onClick={() => setSelectedCardId(card.id)}
                        onDoubleClick={() => handleDealCard(card)}
                        title="雙擊新增到畫布"
                      >
                        {card.title}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右側：可拖拽的卡片預覽 */}
                <div className="w-1/2">
                  <DraggableCardPreview
                    card={getSelectedCard()}
                    selectedDeck={selectedDeck}
                    onAddToCanvas={handleDealCard}
                  />
                </div>
              </div>
            </div>

            {/* 道具區域 - 只在價值導航卡的價值觀排序玩法中顯示 */}
            {selectedDeck === '價值導航卡' && selectedGameRule === '價值觀排序' && (
              <div className="bg-gray-100 p-3 rounded-lg mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">遊戲道具</h5>
                <div className="flex space-x-3">
                  <button
                    onClick={() => addTokenToCanvas('chip', 'red', 1)}
                    className="flex flex-col items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                    title="紅色籌碼"
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <span className="text-xs text-gray-600 mt-1">紅籌</span>
                  </button>
                  <button
                    onClick={() => addTokenToCanvas('chip', 'blue', 5)}
                    className="flex flex-col items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                    title="藍色籌碼"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                      5
                    </div>
                    <span className="text-xs text-gray-600 mt-1">藍籌</span>
                  </button>
                  <button
                    onClick={() => addTokenToCanvas('marker', 'yellow')}
                    className="flex flex-col items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                    title="黃色標記"
                  >
                    <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                      ●
                    </div>
                    <span className="text-xs text-gray-600 mt-1">標記</span>
                  </button>
                </div>
              </div>
            )}

            {/* 操作提示 */}
            <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 mt-4">
              <div className="font-medium mb-1">操作說明：</div>
              <div>• 點擊左側列表選擇要查看的卡片</div>
              <div>• 右側顯示選中卡片的樣式</div>
              <div>• 雙擊卡片名稱新增到畫布</div>
              <div>• 拖拽畫布上的卡片到分類區域</div>
              {selectedDeck === '價值導航卡' && selectedGameRule === '價值觀排序' && (
                <div>• 點擊道具按鈕新增到畫布</div>
              )}
            </div>
          </div>

          {/* Right Side - Game Area */}
          <div className="flex-1 p-6 relative">
            {/* Game Board */}
            <DroppableGameArea
              isActive={!!activeCard && activeCard.startsWith('preview-')}
              selectedGameRule={selectedGameRule}
            >
              {/* 根據玩法顯示不同的遊戲區域 */}
              {selectedGameRule === '優劣勢分析' && (
                <div className="p-6 h-full flex flex-col space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 text-center mb-2">優劣勢分析</h3>

                  {/* Advantage Zone */}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-md font-bold text-green-700 flex items-center justify-center">
                      優勢 (5 張)
                      <span className="ml-2 text-sm text-gray-500">
                        ({getZoneCardCount('advantage')}/5)
                      </span>
                    </h4>
                    <DropZoneComponent
                      zone={{
                        ...DROP_ZONES.find((z) => z.id === 'advantage')!,
                        position: { x: 0, y: 0 },
                        width: '100%' as any,
                        height: 160,
                      }}
                      isActive={activeDropZone === 'advantage'}
                      cards={getCardsInZone('advantage')}
                    />
                  </div>

                  {/* Disadvantage Zone */}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-md font-bold text-red-700 flex items-center justify-center">
                      劣勢 (5 張)
                      <span className="ml-2 text-sm text-gray-500">
                        ({getZoneCardCount('disadvantage')}/5)
                      </span>
                    </h4>
                    <DropZoneComponent
                      zone={{
                        ...DROP_ZONES.find((z) => z.id === 'disadvantage')!,
                        position: { x: 0, y: 0 },
                        width: '100%' as any,
                        height: 160,
                      }}
                      isActive={activeDropZone === 'disadvantage'}
                      cards={getCardsInZone('disadvantage')}
                    />
                  </div>
                </div>
              )}

              {selectedGameRule === '價值觀排序' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                    價值觀排序 (3×3 九宮格)
                  </h3>
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <GridSlot
                        key={index}
                        index={index}
                        cards={cards.filter((c) => c.zone === `grid-${index}`)}
                        isActive={activeDropZone === `grid-${index}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedGameRule === '六大性格分析' && (
                <div className="p-4 h-full overflow-y-auto">
                  {/* 分類區域 - Row by Row */}
                  <div className="space-y-2">
                    {/* 喜歡區域 */}
                    <ThreeZoneDropZone
                      id="like"
                      title="喜歡"
                      emoji="😍"
                      cards={getCardsInZone('like')}
                      maxCount={20}
                      bgColor="bg-green-50"
                      borderColor="border-green-300"
                      textColor="text-green-600"
                      isActive={activeDropZone === 'like'}
                    />

                    {/* 中立區域 */}
                    <ThreeZoneDropZone
                      id="neutral"
                      title="中立"
                      emoji="😐"
                      cards={getCardsInZone('neutral')}
                      bgColor="bg-gray-50"
                      borderColor="border-gray-300"
                      textColor="text-gray-600"
                      isActive={activeDropZone === 'neutral'}
                    />

                    {/* 討厭區域 */}
                    <ThreeZoneDropZone
                      id="dislike"
                      title="討厭"
                      emoji="😤"
                      cards={getCardsInZone('dislike')}
                      maxCount={20}
                      bgColor="bg-red-50"
                      borderColor="border-red-300"
                      textColor="text-red-500"
                      isActive={activeDropZone === 'dislike'}
                    />
                  </div>
                </div>
              )}

              {/* Game Cards (only show cards not in zones - they're rendered inside zones now) */}
              {cards
                .filter((card) => !card.zone)
                .map((card) => (
                  <Card
                    key={card.id}
                    card={card.data}
                    isFaceUp={card.isFaceUp}
                    isSelected={card.isSelected}
                    isDragging={activeCard === card.id}
                    position={card.position}
                    rotation={card.rotation}
                    scale={card.scale}
                    onFlip={handleCardFlip}
                    onSelect={handleCardSelect}
                    onCardEvent={handleCardEvent}
                    onAddNote={!isReadOnly ? handleAddNote : undefined}
                    hasNotes={!!cardNotes[card.data.id]?.length}
                  />
                ))}

              {/* Game Tokens */}
              {gameTokens.map((token) => (
                <GameToken
                  key={token.id}
                  id={token.id}
                  type={token.type}
                  color={token.color}
                  value={token.value}
                  position={token.position}
                  isDragging={activeCard === token.id}
                />
              ))}
            </DroppableGameArea>
          </div>

          <DragOverlay style={{ zIndex: 9999999 }}>
            {activeDragItem &&
              (activeDragItem.data?.current?.card ? (
                <div className="w-32 h-44 opacity-90">
                  <Card
                    card={activeDragItem.data.current.card}
                    isFaceUp={false}
                    isSelected={false}
                    isDragging={true}
                    position={{ x: 0, y: 0 }}
                    rotation={5}
                    scale={1.1}
                  />
                </div>
              ) : (
                <div className="w-32 h-44 opacity-90">
                  <Card
                    card={cards.find((c) => c.id === activeDragItem.id)?.data || ({} as CardData)}
                    draggableId={activeDragItem.id}
                    isFaceUp={cards.find((c) => c.id === activeDragItem.id)?.isFaceUp || false}
                    isSelected={false}
                    isDragging={true}
                    position={{ x: 0, y: 0 }}
                    rotation={5}
                    scale={1.1}
                  />
                </div>
              ))}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card Notes Modal */}
      <CardNotesModal
        card={noteModalCard}
        isOpen={!!noteModalCard}
        onClose={() => setNoteModalCard(null)}
        roomId={roomId}
        performerInfo={performerInfo}
        onNoteSaved={handleNoteSaved}
      />
    </div>
  );
}
