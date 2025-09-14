/**
 * Card Events hook for managing card operations
 * 卡牌事件管理 Hook
 */
import { useState, useCallback } from 'react';
import { CardEvent, CardEventCreate, CardEventType } from '@/types/api';
import { cardEventsAPI } from '@/lib/api/card-events';
import { useWebSocket } from './use-websocket';

interface UseCardEventsOptions {
  roomId: string;
  realtime?: boolean;
}

export function useCardEvents({ roomId, realtime = true }: UseCardEventsOptions) {
  const [events, setEvents] = useState<CardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const latestEvents = await cardEventsAPI.getLatestRoomEvents(roomId);
      setEvents(latestEvents as any);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const createEvent = useCallback(
    async (eventData: Omit<CardEventCreate, 'room_id'>) => {
      try {
        const event = await cardEventsAPI.createEvent({
          ...eventData,
          room_id: roomId,
        });

        // Add to local state if not using realtime (realtime will handle via WebSocket)
        if (!realtime) {
          setEvents((prev) =>
            [...prev, event].sort((a, b) => a.sequence_number - b.sequence_number)
          );
        }

        return event;
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to create event');
        throw err;
      }
    },
    [roomId, realtime]
  );

  // Real-time event handling
  const handleRealtimeEvent = useCallback((event: CardEvent) => {
    setEvents((prev) => {
      // Check if event already exists
      if (prev.some((e) => e.id === event.id)) {
        return prev;
      }

      return [...prev, event].sort((a, b) => a.sequence_number - b.sequence_number);
    });
  }, []);

  // Convenience methods for specific event types
  const dealCard = useCallback(
    (cardId: string, position?: { x: number; y: number }, cardData?: any) => {
      return createEvent({
        event_type: CardEventType.CARD_DEALT,
        card_id: cardId,
        event_data: {
          position,
          ...cardData,
        },
      });
    },
    [createEvent]
  );

  const flipCard = useCallback(
    (cardId: string, faceUp: boolean) => {
      return createEvent({
        event_type: CardEventType.CARD_FLIPPED,
        card_id: cardId,
        event_data: { face_up: faceUp },
      });
    },
    [createEvent]
  );

  const selectCard = useCallback(
    (cardId: string) => {
      return createEvent({
        event_type: CardEventType.CARD_SELECTED,
        card_id: cardId,
      });
    },
    [createEvent]
  );

  const moveCard = useCallback(
    (
      cardId: string,
      fromPosition: { x: number; y: number },
      toPosition: { x: number; y: number }
    ) => {
      return createEvent({
        event_type: CardEventType.CARD_MOVED,
        card_id: cardId,
        event_data: {
          from_position: fromPosition,
          to_position: toPosition,
        },
      });
    },
    [createEvent]
  );

  const addNotes = useCallback(
    (cardId: string | undefined, notes: string) => {
      return createEvent({
        event_type: CardEventType.NOTES_ADDED,
        card_id: cardId,
        notes,
      });
    },
    [createEvent]
  );

  const recordInsight = useCallback(
    (insight: string, cardIds?: string[]) => {
      return createEvent({
        event_type: CardEventType.INSIGHT_RECORDED,
        notes: insight,
        event_data: {
          related_cards: cardIds,
        },
      });
    },
    [createEvent]
  );

  const getEventsByType = useCallback(
    (eventType: CardEventType) => {
      return events.filter((event) => event.event_type === eventType);
    },
    [events]
  );

  const getEventsByCard = useCallback(
    (cardId: string) => {
      return events.filter((event) => event.card_id === cardId);
    },
    [events]
  );

  const getEventsByPerformer = useCallback(
    (performerId: string) => {
      return events.filter((event) => event.performer_id === performerId);
    },
    [events]
  );

  return {
    events,
    isLoading,
    error,
    loadEvents,
    createEvent,
    handleRealtimeEvent,

    // Convenience methods
    dealCard,
    flipCard,
    selectCard,
    moveCard,
    addNotes,
    recordInsight,

    // Query methods
    getEventsByType,
    getEventsByCard,
    getEventsByPerformer,

    // Utils
    clearError: () => setError(null),
  };
}
