/**
 * TDD Tests for Card Events Integration
 * 測試牌卡操作記錄功能
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCardEvents } from '@/hooks/use-card-events';
import { cardEventsAPI } from '@/lib/api/card-events';
import { CardEventType } from '@/types/api';

// Mock the API
vi.mock('@/lib/api/card-events');

describe('Card Events Integration', () => {
  const mockRoomId = 'test-room-123';
  const mockUserId = 'user-456';
  const mockCardId = 'card-789';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for user data
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'user') {
        return JSON.stringify({ id: mockUserId, email: 'test@example.com' });
      }
      return null;
    });
  });

  describe('Recording Card Operations', () => {
    it('should record card flip operation', async () => {
      const mockEvent = {
        id: 'event-1',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_FLIPPED,
        card_id: mockCardId,
        performer_id: mockUserId,
        performer_name: 'Test User',
        sequence_number: 1,
        event_data: { face_up: true },
        created_at: new Date().toISOString(),
      };

      (cardEventsAPI.createEvent as any).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.flipCard(mockCardId, true);
      });

      expect(cardEventsAPI.createEvent).toHaveBeenCalledWith({
        room_id: mockRoomId,
        event_type: CardEventType.CARD_FLIPPED,
        card_id: mockCardId,
        event_data: { face_up: true },
      });

      expect(result.current.events).toContainEqual(mockEvent);
    });

    it('should record card move operation', async () => {
      const fromPosition = { x: 100, y: 200 };
      const toPosition = { x: 300, y: 400 };

      const mockEvent = {
        id: 'event-2',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_MOVED,
        card_id: mockCardId,
        performer_id: mockUserId,
        performer_name: 'Test User',
        sequence_number: 2,
        event_data: { from_position: fromPosition, to_position: toPosition },
        created_at: new Date().toISOString(),
      };

      (cardEventsAPI.createEvent as any).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.moveCard(mockCardId, fromPosition, toPosition);
      });

      expect(cardEventsAPI.createEvent).toHaveBeenCalledWith({
        room_id: mockRoomId,
        event_type: CardEventType.CARD_MOVED,
        card_id: mockCardId,
        event_data: {
          from_position: fromPosition,
          to_position: toPosition,
        },
      });

      expect(result.current.events).toContainEqual(mockEvent);
    });

    it('should record card selection', async () => {
      const mockEvent = {
        id: 'event-3',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_SELECTED,
        card_id: mockCardId,
        performer_id: mockUserId,
        performer_name: 'Test User',
        sequence_number: 3,
        created_at: new Date().toISOString(),
      };

      (cardEventsAPI.createEvent as any).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.selectCard(mockCardId);
      });

      expect(cardEventsAPI.createEvent).toHaveBeenCalledWith({
        room_id: mockRoomId,
        event_type: CardEventType.CARD_SELECTED,
        card_id: mockCardId,
      });
    });

    it('should record notes added to card', async () => {
      const notes = 'This card represents an important career value';

      const mockEvent = {
        id: 'event-4',
        room_id: mockRoomId,
        event_type: CardEventType.NOTES_ADDED,
        card_id: mockCardId,
        performer_id: mockUserId,
        performer_name: 'Test User',
        sequence_number: 4,
        notes: notes,
        created_at: new Date().toISOString(),
      };

      (cardEventsAPI.createEvent as any).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.addNotes(mockCardId, notes);
      });

      expect(cardEventsAPI.createEvent).toHaveBeenCalledWith({
        room_id: mockRoomId,
        event_type: CardEventType.NOTES_ADDED,
        card_id: mockCardId,
        notes: notes,
      });
    });

    it('should record insight without specific card', async () => {
      const insight = 'The visitor shows strong preference for creative roles';

      const mockEvent = {
        id: 'event-5',
        room_id: mockRoomId,
        event_type: CardEventType.INSIGHT_RECORDED,
        performer_id: mockUserId,
        performer_name: 'Test User',
        sequence_number: 5,
        notes: insight,
        event_data: { related_cards: [] },
        created_at: new Date().toISOString(),
      };

      (cardEventsAPI.createEvent as any).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.recordInsight(insight);
      });

      expect(cardEventsAPI.createEvent).toHaveBeenCalledWith({
        room_id: mockRoomId,
        event_type: CardEventType.INSIGHT_RECORDED,
        notes: insight,
        event_data: { related_cards: undefined },
      });
    });
  });

  describe('Loading and Querying Events', () => {
    const mockEvents = [
      {
        id: 'e1',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_FLIPPED,
        card_id: 'card-1',
        performer_id: 'user-1',
        sequence_number: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'e2',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_MOVED,
        card_id: 'card-1',
        performer_id: 'user-2',
        sequence_number: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'e3',
        room_id: mockRoomId,
        event_type: CardEventType.CARD_FLIPPED,
        card_id: 'card-2',
        performer_id: 'user-1',
        sequence_number: 3,
        created_at: new Date().toISOString(),
      },
    ];

    it('should load events for a room', async () => {
      (cardEventsAPI.getLatestRoomEvents as any).mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.loadEvents();
      });

      expect(cardEventsAPI.getLatestRoomEvents).toHaveBeenCalledWith(mockRoomId);
      expect(result.current.events).toEqual(mockEvents);
      expect(result.current.isLoading).toBe(false);
    });

    it('should filter events by type', async () => {
      (cardEventsAPI.getLatestRoomEvents as any).mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.loadEvents();
      });

      const flippedEvents = result.current.getEventsByType(CardEventType.CARD_FLIPPED);
      expect(flippedEvents).toHaveLength(2);
      expect(flippedEvents[0].event_type).toBe(CardEventType.CARD_FLIPPED);
    });

    it('should filter events by card', async () => {
      (cardEventsAPI.getLatestRoomEvents as any).mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.loadEvents();
      });

      const card1Events = result.current.getEventsByCard('card-1');
      expect(card1Events).toHaveLength(2);
      expect(card1Events[0].card_id).toBe('card-1');
    });

    it('should filter events by performer', async () => {
      (cardEventsAPI.getLatestRoomEvents as any).mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.loadEvents();
      });

      const user1Events = result.current.getEventsByPerformer('user-1');
      expect(user1Events).toHaveLength(2);
      expect(user1Events[0].performer_id).toBe('user-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      (cardEventsAPI.createEvent as any).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        try {
          await result.current.flipCard(mockCardId, true);
        } catch (error) {
          // Expected to throw, error should be set in hook state
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain(errorMessage);
    });

    it('should clear error state', async () => {
      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      // Set error state
      (cardEventsAPI.getLatestRoomEvents as any).mockRejectedValueOnce(new Error('Error'));

      await act(async () => {
        try {
          await result.current.loadEvents();
        } catch {
          // Ignore
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Event Ordering', () => {
    it('should maintain events in sequence order', async () => {
      const unorderedEvents = [
        { id: 'e3', sequence_number: 3, created_at: new Date().toISOString() },
        { id: 'e1', sequence_number: 1, created_at: new Date().toISOString() },
        { id: 'e2', sequence_number: 2, created_at: new Date().toISOString() },
      ];

      (cardEventsAPI.getLatestRoomEvents as any).mockResolvedValueOnce(unorderedEvents);

      const { result } = renderHook(() => useCardEvents({ roomId: mockRoomId }));

      await act(async () => {
        await result.current.loadEvents();
      });

      // Events should be sorted by sequence_number
      expect(result.current.events[0].sequence_number).toBe(1);
      expect(result.current.events[1].sequence_number).toBe(2);
      expect(result.current.events[2].sequence_number).toBe(3);
    });
  });
});
