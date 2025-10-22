/**
 * TDD Red Phase: Tests for useCardManagement hook
 * These tests define expected behavior before implementation
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCardManagement } from '../useCardManagement';
import { mockCardsData } from '@/data/mockCards';
import { CardEventType } from '@/lib/api/card-events';

describe('useCardManagement', () => {
  const mockOnCardEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentCards', () => {
    it('should return all cards when no cards are used', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const currentCards = result.current.getCurrentCards();
      expect(currentCards).toHaveLength(mockCardsData.職游旅人卡.length);
      expect(currentCards[0].id).toBe('career-1');
    });

    it('should exclude used cards from available cards', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      // Deal a card (mark as used)
      act(() => {
        const card = mockCardsData.職游旅人卡[0];
        result.current.handleDealCard(card);
      });

      // Check that card is excluded
      const currentCards = result.current.getCurrentCards();
      expect(currentCards.find((c) => c.id === 'career-1')).toBeUndefined();
      expect(currentCards).toHaveLength(mockCardsData.職游旅人卡.length - 1);
    });

    it('should return empty array for invalid deck', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: 'invalid-deck',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const currentCards = result.current.getCurrentCards();
      expect(currentCards).toEqual([]);
    });
  });

  describe('getAuxiliaryCards', () => {
    it('should return RIASEC cards for 六大性格分析', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '六大性格分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const auxCards = result.current.getAuxiliaryCards();
      expect(auxCards).toHaveLength(6);
      expect(auxCards[0].id).toBe('aux-r');
      expect(auxCards[0].title).toBe('R - 實務型');
    });

    it('should return empty array for non-personality game rules', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const auxCards = result.current.getAuxiliaryCards();
      expect(auxCards).toEqual([]);
    });
  });

  describe('handleDealCard', () => {
    it('should add card to used cards list', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const card = mockCardsData.職游旅人卡[0];

      act(() => {
        result.current.handleDealCard(card);
      });

      // Verify card is marked as used
      const currentCards = result.current.getCurrentCards();
      expect(currentCards.find((c) => c.id === card.id)).toBeUndefined();
    });

    it('should trigger onCardEvent callback', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const card = mockCardsData.職游旅人卡[0];

      act(() => {
        result.current.handleDealCard(card);
      });

      expect(mockOnCardEvent).toHaveBeenCalledWith(
        expect.stringContaining('game-career-1'),
        CardEventType.CARD_DEALT,
        expect.objectContaining({
          card_data: card,
          from_deck: true,
        })
      );
    });

    it('should not trigger onCardEvent when isReadOnly is true', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: true,
        })
      );

      const card = mockCardsData.職游旅人卡[0];

      act(() => {
        result.current.handleDealCard(card);
      });

      expect(mockOnCardEvent).not.toHaveBeenCalled();
    });

    it('should auto-select next available card after dealing', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const firstCard = mockCardsData.職游旅人卡[0];

      act(() => {
        result.current.handleDealCard(firstCard);
      });

      // Selected card should be the second card now
      expect(result.current.selectedCardId).toBe(mockCardsData.職游旅人卡[1].id);
    });
  });

  describe('card selection management', () => {
    it('should initialize with first card selected', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      expect(result.current.selectedCardId).toBe(mockCardsData.職游旅人卡[0].id);
    });

    it('should get selected card data', () => {
      const { result } = renderHook(() =>
        useCardManagement({
          selectedDeck: '職游旅人卡',
          selectedGameRule: '優劣勢分析',
          onCardEvent: mockOnCardEvent,
          isReadOnly: false,
        })
      );

      const selectedCard = result.current.getSelectedCard();
      expect(selectedCard?.id).toBe(mockCardsData.職游旅人卡[0].id);
    });
  });

  describe('reset functionality', () => {
    it('should reset used cards when deck changes', () => {
      const { result, rerender } = renderHook(
        (props) => useCardManagement(props),
        {
          initialProps: {
            selectedDeck: '職游旅人卡',
            selectedGameRule: '優劣勢分析',
            onCardEvent: mockOnCardEvent,
            isReadOnly: false,
          },
        }
      );

      // Deal a card
      act(() => {
        result.current.handleDealCard(mockCardsData.職游旅人卡[0]);
      });

      // Change deck
      rerender({
        selectedDeck: '職能盤點卡',
        selectedGameRule: '優劣勢分析',
        onCardEvent: mockOnCardEvent,
        isReadOnly: false,
      });

      // Used cards should be reset
      const currentCards = result.current.getCurrentCards();
      expect(currentCards).toHaveLength(mockCardsData.職能盤點卡.length);
    });
  });
});
