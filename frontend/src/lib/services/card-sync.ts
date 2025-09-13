/**
 * Card Synchronization Service
 * 卡牌同步服務 - 管理卡牌狀態的同步
 */
import { CardEvent, CardEventType, cardEventsAPI } from '@/lib/api/card-events';
import { GameCard } from '@/types/cards';
import wsClient from '@/lib/websocket-client';

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
}

export interface CardSyncOptions {
  roomId: string;
  onStateUpdate: (cards: SyncedCardState[]) => void;
  onError: (error: Error) => void;
  syncInterval?: number; // ms
  useWebSocket?: boolean; // Enable real-time sync via WebSocket
  wsClient?: typeof wsClient; // WebSocket client instance
}

export class CardSyncService {
  private roomId: string;
  private onStateUpdate: (cards: SyncedCardState[]) => void;
  private onError: (error: Error) => void;
  private syncInterval: number;
  private syncTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;
  private isActive = false;
  private localCards = new Map<string, SyncedCardState>();
  private useWebSocket: boolean;
  private ws: typeof wsClient | null = null;
  private wsEventCleanup: (() => void) | null = null;

  constructor(options: CardSyncOptions) {
    this.roomId = options.roomId;
    this.onStateUpdate = options.onStateUpdate;
    this.onError = options.onError;
    this.syncInterval = options.syncInterval || 2000; // Default 2 seconds
    this.useWebSocket = options.useWebSocket || false;
    this.ws = options.wsClient || (this.useWebSocket ? wsClient : null);
  }

  /**
   * Start synchronization
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;

    try {
      // Initial sync
      await this.performSync();

      if (this.useWebSocket && this.ws) {
        // Set up WebSocket event listener for real-time updates
        this.setupWebSocketListener();

        // Use longer sync interval when WebSocket is active (as a fallback)
        this.syncTimer = setInterval(() => {
          this.performSync().catch(this.onError);
        }, this.syncInterval * 3); // 3x longer interval with WebSocket
      } else {
        // Set up regular polling when WebSocket is not available
        this.syncTimer = setInterval(() => {
          this.performSync().catch(this.onError);
        }, this.syncInterval);
      }
    } catch (error) {
      this.isActive = false;
      this.onError(error instanceof Error ? error : new Error('Failed to start sync'));
    }
  }

  /**
   * Stop synchronization
   */
  stop(): void {
    this.isActive = false;

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Clean up WebSocket listener
    if (this.wsEventCleanup) {
      this.wsEventCleanup();
      this.wsEventCleanup = null;
    }
  }

  /**
   * Send card event to server and update local state
   */
  async syncCardEvent(
    cardId: string,
    eventType: CardEventType,
    eventData?: Record<string, any>,
    performerInfo?: {
      id?: string;
      name?: string;
      type?: string;
    }
  ): Promise<void> {
    try {
      if (this.useWebSocket && this.ws && this.ws.isConnected()) {
        // Send via WebSocket for real-time sync
        this.ws.sendCardEvent({
          room_id: this.roomId,
          event_type: eventType,
          card_id: cardId,
          event_data: eventData,
          performer_id: performerInfo?.id,
          performer_name: performerInfo?.name,
          performer_type: (performerInfo?.type as 'user' | 'visitor' | undefined) || 'visitor',
        });

        // Update local state immediately for responsive UI
        const mockEvent: CardEvent = {
          id: `temp-${Date.now()}`,
          room_id: this.roomId,
          event_type: eventType,
          card_id: cardId,
          event_data: eventData,
          performer_id: performerInfo?.id,
          performer_type: performerInfo?.type || 'visitor',
          performer_name: performerInfo?.name,
          created_at: new Date().toISOString(),
        };
        this.applyEventToLocalState(mockEvent);
      } else {
        // Fall back to API call
        const event = await cardEventsAPI.createEvent({
          room_id: this.roomId,
          event_type: eventType,
          card_id: cardId,
          event_data: eventData,
          performer_id: performerInfo?.id,
          performer_name: performerInfo?.name,
          performer_type: performerInfo?.type || 'visitor',
        });

        // Update local state immediately for responsive UI
        this.applyEventToLocalState(event);
      }
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error('Failed to sync card event'));
    }
  }

  /**
   * Update local card state (for immediate UI feedback)
   */
  updateLocalCard(cardId: string, updates: Partial<SyncedCardState>): void {
    const existing = this.localCards.get(cardId);
    const updated: SyncedCardState = {
      id: cardId,
      position: { x: 0, y: 0 },
      isFaceUp: false,
      isSelected: false,
      rotation: 0,
      scale: 1,
      zIndex: 1,
      lastUpdated: new Date().toISOString(),
      ...existing,
      ...updates,
    };

    this.localCards.set(cardId, updated);
    this.emitStateUpdate();
  }

  /**
   * Get current synchronized card states
   */
  getCardStates(): SyncedCardState[] {
    return Array.from(this.localCards.values());
  }

  /**
   * Perform synchronization with server
   */
  private async performSync(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Get latest events since last sync
      const events = await cardEventsAPI.getLatestRoomEvents(
        this.roomId,
        100 // Get last 100 events
      );

      // Filter events newer than last sync
      const newEvents = this.lastSyncTime
        ? events.filter((event) => event.created_at > this.lastSyncTime!)
        : events;

      if (newEvents.length === 0) return;

      // Apply new events to local state
      newEvents.forEach((event) => this.applyEventToLocalState(event));

      // Update last sync time
      if (events.length > 0) {
        this.lastSyncTime = events[0].created_at;
      }

      this.emitStateUpdate();
    } catch (error) {
      console.error('Sync failed:', error);
      // Don't call onError for periodic sync failures to avoid spam
      // Only log them
    }
  }

  /**
   * Apply a card event to local state
   */
  private applyEventToLocalState(event: CardEvent): void {
    if (!event.card_id) return;

    const cardId = event.card_id;
    const existing = this.localCards.get(cardId) || {
      id: cardId,
      position: { x: 0, y: 0 },
      isFaceUp: false,
      isSelected: false,
      rotation: 0,
      scale: 1,
      zIndex: 1,
      lastUpdated: event.created_at,
    };

    let updated = { ...existing };

    switch (event.event_type) {
      case CardEventType.CARD_DEALT:
        updated = {
          ...updated,
          position: event.event_data?.position || { x: 400, y: 300 },
          lastUpdated: event.created_at,
          lastEventId: event.id,
        };
        break;

      case CardEventType.CARD_FLIPPED:
        updated = {
          ...updated,
          isFaceUp: event.event_data?.face_up ?? !updated.isFaceUp,
          lastUpdated: event.created_at,
          lastEventId: event.id,
        };
        break;

      case CardEventType.CARD_MOVED:
        if (event.event_data?.to_position) {
          updated = {
            ...updated,
            position: event.event_data.to_position,
            lastUpdated: event.created_at,
            lastEventId: event.id,
          };
        }
        break;

      case CardEventType.CARD_ARRANGED:
        if (event.event_data?.position) {
          updated = {
            ...updated,
            position: event.event_data.position,
            lastUpdated: event.created_at,
            lastEventId: event.id,
          };
        }
        break;

      case CardEventType.CARD_SELECTED:
        // For selection events, we might want different behavior
        // For now, we'll ignore selection sync to avoid conflicts
        break;

      default:
        // Unknown event type, just update timestamp
        updated = {
          ...updated,
          lastUpdated: event.created_at,
          lastEventId: event.id,
        };
    }

    this.localCards.set(cardId, updated);
  }

  /**
   * Emit state update to callback
   */
  private emitStateUpdate(): void {
    const cards = Array.from(this.localCards.values()).sort((a, b) => a.zIndex - b.zIndex);

    this.onStateUpdate(cards);
  }

  /**
   * Set up WebSocket event listener for real-time updates
   */
  private setupWebSocketListener(): void {
    if (!this.ws) return;

    const handleCardEvent = (eventData: any) => {
      // Convert WebSocket event data to CardEvent format
      const event: CardEvent = {
        id: eventData.id || `ws-${Date.now()}`,
        room_id: eventData.room_id || this.roomId,
        event_type: eventData.event_type,
        card_id: eventData.card_id,
        event_data: eventData.event_data,
        notes: eventData.notes,
        performer_id: eventData.performer_id,
        performer_type: eventData.performer_type || 'visitor',
        performer_name: eventData.performer_name,
        created_at: eventData.created_at || new Date().toISOString(),
      };

      // Apply the event to local state
      this.applyEventToLocalState(event);
      this.emitStateUpdate();
    };

    // Listen for card events from WebSocket
    this.ws.on('card_event', handleCardEvent);

    // Store cleanup function
    this.wsEventCleanup = () => {
      if (this.ws) {
        this.ws.off('card_event', handleCardEvent);
      }
    };
  }

  /**
   * Convert GameCard to SyncedCardState
   */
  static fromGameCard(gameCard: GameCard): SyncedCardState {
    return {
      id: gameCard.id,
      position: gameCard.position,
      isFaceUp: gameCard.isFaceUp,
      isSelected: gameCard.isSelected,
      rotation: gameCard.rotation,
      scale: gameCard.scale,
      zIndex: gameCard.zIndex,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Convert SyncedCardState to GameCard partial
   */
  static toGameCardUpdates(syncedCard: SyncedCardState): Partial<GameCard> {
    return {
      position: syncedCard.position,
      isFaceUp: syncedCard.isFaceUp,
      isSelected: syncedCard.isSelected,
      rotation: syncedCard.rotation,
      scale: syncedCard.scale,
      zIndex: syncedCard.zIndex,
    };
  }
}

/**
 * Create a card synchronization service instance
 */
export function createCardSyncService(options: CardSyncOptions): CardSyncService {
  return new CardSyncService(options);
}
