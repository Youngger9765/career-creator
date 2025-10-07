/**
 * Card Events API
 * 卡牌事件相關 API
 */
import { apiClient, handleApiError } from './client';

export enum CardEventType {
  CARD_DEALT = 'card_dealt',
  CARD_FLIPPED = 'card_flipped',
  CARD_SELECTED = 'card_selected',
  CARD_MOVED = 'card_moved',
  CARD_ARRANGED = 'card_arranged',
  CARD_DISCUSSED = 'card_discussed',
  NOTES_ADDED = 'notes_added',
  INSIGHT_RECORDED = 'insight_recorded',
  AREA_CLEARED = 'area_cleared',
}

export interface CardEvent {
  id: string;
  room_id: string;
  event_type: CardEventType;
  card_id?: string;
  event_data?: Record<string, any>;
  notes?: string;
  performer_id?: string;
  performer_type: 'user' | 'visitor';
  performer_name?: string;
  sequence_number: number;
  created_at: string;
}

export interface CreateCardEventData {
  room_id: string;
  event_type: CardEventType;
  card_id?: string;
  event_data?: Record<string, any>;
  notes?: string;
  performer_id?: string;
  performer_type?: string;
  performer_name?: string;
}

export interface CardEventSummary {
  room_id: string;
  total_events: number;
  event_breakdown: Record<string, number>;
  recent_events: CardEvent[];
  active_cards: string[];
}

class CardEventsAPI {
  /**
   * Create a new card event
   */
  async createEvent(data: CreateCardEventData): Promise<CardEvent> {
    try {
      const response = await apiClient.post<CardEvent>('/api/card-events/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all events for a room
   */
  async getRoomEvents(
    roomId: string,
    params?: {
      event_type?: CardEventType;
      performer_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CardEvent[]> {
    try {
      const response = await apiClient.get<CardEvent[]>(`/api/card-events/room/${roomId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get latest events for a room
   */
  async getLatestRoomEvents(roomId: string, limit: number = 50): Promise<CardEvent[]> {
    // Card events API is disabled - return empty array
    return [];
  }

  /**
   * Get event summary for a room
   */
  async getRoomEventSummary(roomId: string): Promise<CardEventSummary> {
    try {
      const response = await apiClient.get<CardEventSummary>(
        `/api/card-events/room/${roomId}/summary`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(eventId: string): Promise<CardEvent> {
    try {
      const response = await apiClient.get<CardEvent>(`/api/card-events/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/card-events/${eventId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Helper: Create card flip event
   */
  async flipCard(
    roomId: string,
    cardId: string,
    performerInfo?: {
      id?: string;
      name?: string;
      type?: string;
    }
  ): Promise<CardEvent> {
    return this.createEvent({
      room_id: roomId,
      event_type: CardEventType.CARD_FLIPPED,
      card_id: cardId,
      event_data: { flipped: true },
      performer_id: performerInfo?.id,
      performer_name: performerInfo?.name,
      performer_type: performerInfo?.type || 'visitor',
    });
  }

  /**
   * Helper: Create card move event
   */
  async moveCard(
    roomId: string,
    cardId: string,
    position: { x: number; y: number; zone?: string },
    performerInfo?: {
      id?: string;
      name?: string;
      type?: string;
    }
  ): Promise<CardEvent> {
    return this.createEvent({
      room_id: roomId,
      event_type: CardEventType.CARD_MOVED,
      card_id: cardId,
      event_data: position,
      performer_id: performerInfo?.id,
      performer_name: performerInfo?.name,
      performer_type: performerInfo?.type || 'visitor',
    });
  }

  /**
   * Helper: Add notes to card
   */
  async addNotes(
    roomId: string,
    cardId: string,
    notes: string,
    performerInfo?: {
      id?: string;
      name?: string;
      type?: string;
    }
  ): Promise<CardEvent> {
    return this.createEvent({
      room_id: roomId,
      event_type: CardEventType.NOTES_ADDED,
      card_id: cardId,
      notes,
      performer_id: performerInfo?.id,
      performer_name: performerInfo?.name,
      performer_type: performerInfo?.type || 'counselor',
    });
  }
}

export const cardEventsAPI = new CardEventsAPI();
export default cardEventsAPI;
