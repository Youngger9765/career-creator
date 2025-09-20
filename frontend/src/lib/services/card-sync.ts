/**
 * Card Synchronization Service
 * 卡牌同步服務 - 管理卡牌狀態的同步 (Polling Only for MVP)
 */
import { CardEvent, CardEventType, cardEventsAPI } from '@/lib/api/card-events';
import { GameCard } from '@/types/cards';

export interface SyncedCardState {
  id: string;
  position: { x: number; y: number };
  isFaceUp: boolean;
  isSelected: boolean;
  rotation: number;
  scale: number;
  zIndex: number;
  lastUpdated: string;
  lastEventId?: string;
  lastModified?: string;
  isModified?: boolean;
  pending?: boolean;
}

export interface CardSyncOptions {
  roomId: string;
  syncInterval?: number; // ms
  optimisticUpdates?: boolean;
  smartPolling?: boolean;
  performerInfo?: {
    id?: string;
    name?: string;
    type?: string;
  };
}

export interface SyncResult {
  cards: SyncedCardState[];
  changed: boolean;
  lastSyncTime: string;
}

export class CardSyncService {
  private roomId: string;
  private syncInterval: number;
  private optimisticUpdates: boolean;
  private smartPolling: boolean;
  private performerInfo: { id?: string; name?: string; type?: string };

  private lastSyncTime: string | null = null;
  private localCards = new Map<string, SyncedCardState>();
  private lastSequenceNumber = 0;

  constructor(options: CardSyncOptions) {
    this.roomId = options.roomId;
    this.syncInterval = options.syncInterval || 4000; // Default 4 seconds
    this.optimisticUpdates = options.optimisticUpdates ?? true;
    this.smartPolling = options.smartPolling ?? true;
    this.performerInfo = options.performerInfo || {};
  }

  /**
   * Poll for changes from the server
   */
  async pollChanges(): Promise<SyncResult> {
    try {
      // Get latest events (simple polling approach for MVP)
      const events = await cardEventsAPI.getLatestRoomEvents(this.roomId, 50);

      const currentTime = new Date().toISOString();
      let hasChanges = false;

      // Process new events (only those with sequence number > our last seen)
      for (const event of events) {
        if (event.sequence_number > this.lastSequenceNumber) {
          this.applyEvent(event);
          this.lastSequenceNumber = event.sequence_number;
          hasChanges = true;
        }
      }

      this.lastSyncTime = currentTime;

      return {
        cards: Array.from(this.localCards.values()),
        changed: hasChanges,
        lastSyncTime: currentTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to poll changes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Submit a card event to the server
   */
  async submitCardEvent(
    cardId: string,
    eventType: CardEventType,
    eventData?: Record<string, any>
  ): Promise<CardEvent> {
    try {
      // Apply optimistic update if enabled
      if (this.optimisticUpdates) {
        this.applyOptimisticUpdate(cardId, eventType, eventData);
      }

      const event = await cardEventsAPI.createEvent({
        room_id: this.roomId,
        event_type: eventType,
        card_id: cardId,
        event_data: eventData,
        performer_id: this.performerInfo.id,
        performer_type: this.performerInfo.type as 'user' | 'visitor' | undefined,
        performer_name: this.performerInfo.name,
      });

      // Update sequence number
      if (event.sequence_number > this.lastSequenceNumber) {
        this.lastSequenceNumber = event.sequence_number;
      }

      // Apply the actual server response
      this.applyEvent(event);

      return event;
    } catch (error) {
      // Revert optimistic update on error
      if (this.optimisticUpdates) {
        this.revertOptimisticUpdate(cardId);
      }
      throw error;
    }
  }

  /**
   * Get current synced card states
   */
  getCards(): SyncedCardState[] {
    return Array.from(this.localCards.values());
  }

  /**
   * Update local card state
   */
  updateLocalCard(cardId: string, updates: Partial<SyncedCardState>): void {
    const existing = this.localCards.get(cardId);
    if (existing) {
      this.localCards.set(cardId, {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString(),
        isModified: true,
      });
    } else {
      // Create new card if it doesn't exist
      this.localCards.set(cardId, {
        id: cardId,
        position: { x: 0, y: 0 },
        isFaceUp: false,
        isSelected: false,
        rotation: 0,
        scale: 1,
        zIndex: 0,
        lastUpdated: new Date().toISOString(),
        isModified: true,
        ...updates,
      });
    }
  }

  /**
   * Clear all local state
   */
  clear(): void {
    this.localCards.clear();
    this.lastSyncTime = null;
    this.lastSequenceNumber = 0;
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.clear();
  }

  /**
   * Apply a card event to local state
   */
  private applyEvent(event: CardEvent): void {
    if (!event.card_id) return;

    const cardId = event.card_id;
    const existing = this.localCards.get(cardId) || this.createDefaultCardState(cardId);

    switch (event.event_type) {
      case CardEventType.CARD_FLIPPED:
        existing.isFaceUp = event.event_data?.isFaceUp ?? !existing.isFaceUp;
        break;

      case CardEventType.CARD_MOVED:
        if (event.event_data?.position) {
          existing.position = event.event_data.position;
        }
        break;

      case CardEventType.CARD_SELECTED:
        existing.isSelected = event.event_data?.isSelected ?? true;
        break;

      case CardEventType.CARD_ARRANGED:
        if (event.event_data) {
          Object.assign(existing, {
            position: event.event_data.position || existing.position,
            rotation: event.event_data.rotation ?? existing.rotation,
            scale: event.event_data.scale ?? existing.scale,
            zIndex: event.event_data.zIndex ?? existing.zIndex,
          });
        }
        break;

      case CardEventType.AREA_CLEARED:
        // Remove all cards or reset their positions based on event data
        if (event.event_data?.resetToDefault) {
          this.localCards.clear();
          return;
        }
        break;
    }

    existing.lastUpdated = event.created_at;
    existing.lastEventId = event.id;
    existing.pending = false;
    existing.isModified = false;

    this.localCards.set(cardId, existing);
  }

  /**
   * Apply optimistic update for immediate UI feedback
   */
  private applyOptimisticUpdate(
    cardId: string,
    eventType: CardEventType,
    eventData?: Record<string, any>
  ): void {
    const existing = this.localCards.get(cardId) || this.createDefaultCardState(cardId);

    // Mark as pending
    existing.pending = true;
    existing.lastUpdated = new Date().toISOString();

    // Apply the update based on event type
    switch (eventType) {
      case CardEventType.CARD_FLIPPED:
        existing.isFaceUp = eventData?.isFaceUp ?? !existing.isFaceUp;
        break;

      case CardEventType.CARD_MOVED:
        if (eventData?.position) {
          existing.position = eventData.position;
        }
        break;

      case CardEventType.CARD_SELECTED:
        existing.isSelected = eventData?.isSelected ?? true;
        break;

      case CardEventType.CARD_ARRANGED:
        if (eventData) {
          Object.assign(existing, {
            position: eventData.position || existing.position,
            rotation: eventData.rotation ?? existing.rotation,
            scale: eventData.scale ?? existing.scale,
            zIndex: eventData.zIndex ?? existing.zIndex,
          });
        }
        break;
    }

    this.localCards.set(cardId, existing);
  }

  /**
   * Revert optimistic update on error
   */
  private revertOptimisticUpdate(cardId: string): void {
    const card = this.localCards.get(cardId);
    if (card && card.pending) {
      // For now, just mark as not pending
      // In a more sophisticated implementation, we'd store the previous state
      card.pending = false;
    }
  }

  /**
   * Create default card state
   */
  private createDefaultCardState(cardId: string): SyncedCardState {
    return {
      id: cardId,
      position: { x: 0, y: 0 },
      isFaceUp: false,
      isSelected: false,
      rotation: 0,
      scale: 1,
      zIndex: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create a card sync service
 */
export function createCardSyncService(options: CardSyncOptions): CardSyncService {
  return new CardSyncService(options);
}

/**
 * Helper function to apply synced state to game cards
 */
export function applySyncedState(
  gameCards: GameCard[],
  syncedCards: SyncedCardState[]
): GameCard[] {
  const syncedMap = new Map(syncedCards.map((card) => [card.id, card]));

  return gameCards.map((gameCard) => {
    const synced = syncedMap.get(gameCard.id);
    if (synced) {
      return {
        ...gameCard,
        position: synced.position,
        isFaceUp: synced.isFaceUp,
        isSelected: synced.isSelected,
        rotation: synced.rotation,
        scale: synced.scale,
        zIndex: synced.zIndex,
      };
    }
    return gameCard;
  });
}
