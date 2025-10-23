/**
 * useCardManagement hook
 * Manages card selection, dealing, and filtering logic for consultation games
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { mockCardsData, CardData } from '@/data/mockCards';
import { CardEventType } from '@/lib/api/card-events';

interface UseCardManagementProps {
  selectedDeck: string;
  selectedGameRule: string;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  isReadOnly?: boolean;
}

interface GameCard {
  id: string;
  data: CardData;
  position: { x: number; y: number };
  isFaceUp: boolean;
  isSelected: boolean;
  rotation: number;
  scale: number;
  zIndex: number;
  zone?: string;
}

// RIASEC auxiliary cards for personality analysis
const auxiliaryCardsData = {
  六大性格分析: [
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
  ],
};

export function useCardManagement({
  selectedDeck,
  selectedGameRule,
  onCardEvent,
  isReadOnly = false,
}: UseCardManagementProps) {
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedAuxCardId, setSelectedAuxCardId] = useState<string | null>(null);

  // Mock cards data
  const mockCards = useMemo(() => mockCardsData, []);

  // Auxiliary cards (RIASEC personality cards)
  const auxiliaryCards = useMemo(() => auxiliaryCardsData, []);

  // Get current available cards (excluding used cards)
  const getCurrentCards = useCallback(() => {
    const allCards = mockCards[selectedDeck as keyof typeof mockCards] || [];
    return allCards.filter((card) => !usedCardIds.has(card.id));
  }, [selectedDeck, usedCardIds, mockCards]);

  // Get auxiliary cards based on game rule
  const getAuxiliaryCards = useCallback(() => {
    return auxiliaryCards[selectedGameRule as keyof typeof auxiliaryCards] || [];
  }, [selectedGameRule, auxiliaryCards]);

  // Get selected card
  const getSelectedCard = useCallback(() => {
    const cards = getCurrentCards();
    return cards.find((card) => card.id === selectedCardId) || cards[0];
  }, [getCurrentCards, selectedCardId]);

  // Get selected auxiliary card
  const getSelectedAuxCard = useCallback(() => {
    const auxCards = getAuxiliaryCards();
    return auxCards.find((card) => card.id === selectedAuxCardId) || auxCards[0];
  }, [getAuxiliaryCards, selectedAuxCardId]);

  // Check if auxiliary cards should be shown
  const shouldShowAuxiliaryCards = useCallback(() => {
    return selectedGameRule === '六大性格分析' && selectedDeck === '職游旅人卡';
  }, [selectedGameRule, selectedDeck]);

  // Handle dealing a card
  const handleDealCard = useCallback(
    (cardData: CardData) => {
      // Mark card as used
      setUsedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(cardData.id);
        return newSet;
      });

      // Auto-select next available card
      const allCards = mockCards[selectedDeck as keyof typeof mockCards] || [];
      const remainingCards = allCards.filter(
        (card) => card.id !== cardData.id && !usedCardIds.has(card.id)
      );
      if (remainingCards.length > 0) {
        setSelectedCardId(remainingCards[0].id);
      } else {
        setSelectedCardId(null);
      }

      // Trigger card dealt event
      if (!isReadOnly && onCardEvent) {
        const gameCardId = `game-${cardData.id}-${Date.now()}`;
        onCardEvent(gameCardId, CardEventType.CARD_DEALT, {
          position: { x: 100, y: 100 },
          card_data: cardData,
          from_deck: true,
        });
      }
    },
    [selectedDeck, usedCardIds, mockCards, isReadOnly, onCardEvent]
  );

  // Reset used cards when deck or game rule changes
  useEffect(() => {
    setUsedCardIds(new Set());
    setSelectedCardId(null);
    setSelectedAuxCardId(null);
  }, [selectedDeck, selectedGameRule]);

  // Initialize selected card
  useEffect(() => {
    const cards = getCurrentCards();
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [getCurrentCards, selectedCardId]);

  // Initialize selected auxiliary card
  useEffect(() => {
    const auxCards = getAuxiliaryCards();
    if (auxCards.length > 0 && !selectedAuxCardId) {
      setSelectedAuxCardId(auxCards[0].id);
    }
  }, [getAuxiliaryCards, selectedAuxCardId]);

  return {
    // State
    usedCardIds,
    selectedCardId,
    selectedAuxCardId,

    // Functions
    getCurrentCards,
    getAuxiliaryCards,
    getSelectedCard,
    getSelectedAuxCard,
    shouldShowAuxiliaryCards,
    handleDealCard,

    // Setters (for manual control if needed)
    setSelectedCardId,
    setSelectedAuxCardId,
  };
}
