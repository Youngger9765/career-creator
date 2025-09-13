/**
 * useCardSync Hook
 * 卡牌同步 Hook - 處理卡牌狀態同步的 React Hook
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { CardSyncService, SyncedCardState, createCardSyncService } from '@/lib/services/card-sync';
import { CardEventType } from '@/lib/api/card-events';
import { GameCard } from '@/types/cards';
import wsClient from '@/lib/websocket-client';

export interface UseCardSyncOptions {
  roomId: string;
  enabled?: boolean;
  syncInterval?: number;
  useWebSocket?: boolean;
  performerInfo?: {
    id?: string;
    name?: string;
    type?: string;
  };
}

export interface UseCardSyncReturn {
  syncedCards: SyncedCardState[];
  isActive: boolean;
  isWebSocketConnected: boolean;
  lastSyncTime: string | null;
  error: Error | null;
  syncCardEvent: (
    cardId: string,
    eventType: CardEventType,
    eventData?: Record<string, any>
  ) => Promise<void>;
  updateLocalCard: (cardId: string, updates: Partial<SyncedCardState>) => void;
  applyToGameCards: (gameCards: GameCard[]) => GameCard[];
  clearError: () => void;
}

export function useCardSync(options: UseCardSyncOptions): UseCardSyncReturn {
  const {
    roomId,
    enabled = true,
    syncInterval = 2000,
    useWebSocket = true,
    performerInfo,
  } = options;

  const [syncedCards, setSyncedCards] = useState<SyncedCardState[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const syncServiceRef = useRef<CardSyncService | null>(null);

  // Create sync service
  useEffect(() => {
    if (!enabled || !roomId) {
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
        syncServiceRef.current = null;
        setIsActive(false);
      }
      return;
    }

    const syncService = createCardSyncService({
      roomId,
      syncInterval,
      useWebSocket,
      wsClient: useWebSocket ? wsClient : undefined,
      onStateUpdate: (cards) => {
        setSyncedCards(cards);
        setLastSyncTime(new Date().toISOString());
      },
      onError: (err) => {
        setError(err);
        console.error('Card sync error:', err);
      },
    });

    syncServiceRef.current = syncService;

    // Start sync service
    syncService
      .start()
      .then(() => setIsActive(true))
      .catch(setError);

    return () => {
      syncService.stop();
      setIsActive(false);
    };
  }, [roomId, enabled, syncInterval, useWebSocket]);

  // Monitor WebSocket connection status
  useEffect(() => {
    if (!useWebSocket) {
      setIsWebSocketConnected(false);
      return;
    }

    const checkConnection = () => {
      setIsWebSocketConnected(wsClient.isConnected());
    };

    // Check initial connection
    checkConnection();

    // Set up event listeners
    const handleConnected = () => setIsWebSocketConnected(true);
    const handleDisconnected = () => setIsWebSocketConnected(false);

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);

    // Check connection periodically
    const interval = setInterval(checkConnection, 1000);

    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      clearInterval(interval);
    };
  }, [useWebSocket]);

  // Sync card event
  const syncCardEvent = useCallback(
    async (
      cardId: string,
      eventType: CardEventType,
      eventData?: Record<string, any>
    ): Promise<void> => {
      if (!syncServiceRef.current) {
        throw new Error('Sync service not initialized');
      }

      try {
        await syncServiceRef.current.syncCardEvent(cardId, eventType, eventData, performerInfo);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to sync card event');
        setError(error);
        throw error;
      }
    },
    [performerInfo]
  );

  // Update local card
  const updateLocalCard = useCallback((cardId: string, updates: Partial<SyncedCardState>): void => {
    if (!syncServiceRef.current) return;

    syncServiceRef.current.updateLocalCard(cardId, updates);
  }, []);

  // Apply synced state to game cards
  const applyToGameCards = useCallback(
    (gameCards: GameCard[]): GameCard[] => {
      if (syncedCards.length === 0) return gameCards;

      const syncMap = new Map(syncedCards.map((card) => [card.id, card]));

      return gameCards.map((gameCard) => {
        const syncedCard = syncMap.get(gameCard.id);
        if (!syncedCard) return gameCard;

        // Apply synced state to game card
        return {
          ...gameCard,
          ...CardSyncService.toGameCardUpdates(syncedCard),
        };
      });
    },
    [syncedCards]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    syncedCards,
    isActive,
    isWebSocketConnected,
    lastSyncTime,
    error,
    syncCardEvent,
    updateLocalCard,
    applyToGameCards,
    clearError,
  };
}

/**
 * Hook for simplified card sync in read-only mode
 */
export function useCardSyncReadOnly(roomId: string, enabled = true) {
  return useCardSync({
    roomId,
    enabled,
    syncInterval: 3000, // Longer interval for read-only
    useWebSocket: true, // Enable WebSocket for real-time updates
    performerInfo: { type: 'observer' },
  });
}
