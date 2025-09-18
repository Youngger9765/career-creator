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
  optimisticUpdates?: boolean;
  smartPolling?: boolean;
  idleTimeout?: number;
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
  isPolling: boolean;
  pendingOperations: Map<string, PendingOperation>;
  syncCardEvent: (
    cardId: string,
    eventType: CardEventType,
    eventData?: Record<string, any>
  ) => Promise<void>;
  updateLocalCard: (cardId: string, updates: Partial<SyncedCardState>) => void;
  applyToGameCards: (gameCards: GameCard[]) => GameCard[];
  clearError: () => void;
  triggerUserActivity: () => void;
}

interface PendingOperation {
  id: string;
  cardId: string;
  eventType: CardEventType;
  eventData?: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'resolved' | 'failed';
}

export function useCardSync(options: UseCardSyncOptions): UseCardSyncReturn {
  const {
    roomId,
    enabled = true,
    syncInterval = 4000, // Default to 4 seconds for smart polling
    useWebSocket = false, // Default to polling for MVP
    optimisticUpdates = true,
    smartPolling = true,
    idleTimeout = 30000, // Stop polling after 30s of inactivity
    performerInfo,
  } = options;

  const [syncedCards, setSyncedCards] = useState<SyncedCardState[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(
    new Map()
  );
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncServiceRef = useRef<CardSyncService | null>(null);

  // Smart polling with idle detection
  const startSmartPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsPolling(true);

    const poll = async () => {
      try {
        // Check if we should stop due to inactivity
        if (smartPolling && Date.now() - lastActivity > idleTimeout) {
          console.log('Stopping polling due to inactivity');
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }

        // Create sync service if not exists
        if (!syncServiceRef.current) {
          const syncService = createCardSyncService({
            roomId,
            syncInterval,
            useWebSocket,
            wsClient: useWebSocket ? wsClient : undefined,
            onStateUpdate: (cards) => {
              setSyncedCards(cards);
              setLastSyncTime(new Date().toISOString());

              // Resolve pending operations based on server state
              if (optimisticUpdates) {
                resolvePendingOperations(cards);
              }
            },
            onError: (err) => {
              setError(err);
              console.error('Card sync error:', err);
            },
          });
          syncServiceRef.current = syncService;
        }

        // Fetch latest state
        await syncServiceRef.current.fetchState();
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollingIntervalRef.current = setInterval(poll, syncInterval);
  }, [
    roomId,
    syncInterval,
    useWebSocket,
    smartPolling,
    lastActivity,
    idleTimeout,
    optimisticUpdates,
  ]);

  // Create sync service
  useEffect(() => {
    if (!enabled || !roomId) {
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
        syncServiceRef.current = null;
        setIsActive(false);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }
      return;
    }

    if (useWebSocket) {
      // WebSocket mode
      const syncService = createCardSyncService({
        roomId,
        syncInterval,
        useWebSocket,
        wsClient: wsClient,
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
    } else {
      // Smart polling mode
      setIsActive(true);
      startSmartPolling();
    }

    return () => {
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      setIsActive(false);
      setIsPolling(false);
    };
  }, [roomId, enabled, useWebSocket, startSmartPolling]);

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

  // Resolve pending operations based on server state
  const resolvePendingOperations = useCallback((serverCards: SyncedCardState[]) => {
    setPendingOperations((prev) => {
      const updated = new Map(prev);
      const serverCardIds = new Set(serverCards.map((c) => c.id));

      // Mark operations as resolved if card exists on server
      for (const [opId, operation] of Array.from(updated.entries())) {
        if (operation.status === 'pending') {
          if (serverCardIds.has(operation.cardId)) {
            updated.set(opId, { ...operation, status: 'resolved' });
          } else if (Date.now() - operation.timestamp > 10000) {
            // Mark as failed if pending for > 10s
            updated.set(opId, { ...operation, status: 'failed' });
          }
        }
      }

      // Clean up resolved/failed operations older than 30s
      const cutoff = Date.now() - 30000;
      for (const [opId, operation] of Array.from(updated.entries())) {
        if (operation.status !== 'pending' && operation.timestamp < cutoff) {
          updated.delete(opId);
        }
      }

      return updated;
    });
  }, []);

  // Trigger user activity (resets idle timer)
  const triggerUserActivity = useCallback(() => {
    setLastActivity(Date.now());

    // Restart polling if it was stopped due to inactivity
    if (smartPolling && !isPolling && enabled) {
      startSmartPolling();
    }
  }, [smartPolling, isPolling, enabled, startSmartPolling]);

  // Sync card event with optimistic updates
  const syncCardEvent = useCallback(
    async (
      cardId: string,
      eventType: CardEventType,
      eventData?: Record<string, any>
    ): Promise<void> => {
      // Trigger user activity
      triggerUserActivity();

      const operationId = `${cardId}-${eventType}-${Date.now()}`;

      if (optimisticUpdates) {
        // Add optimistic operation
        const pendingOp: PendingOperation = {
          id: operationId,
          cardId,
          eventType,
          eventData,
          timestamp: Date.now(),
          status: 'pending',
        };

        setPendingOperations((prev) => new Map(prev).set(operationId, pendingOp));

        // Apply optimistic update immediately
        if (syncServiceRef.current) {
          syncServiceRef.current.updateLocalCard(cardId, {
            id: cardId,
            lastModified: new Date().toISOString(),
            isModified: true,
            pending: true,
            ...eventData,
          });
        }
      }

      try {
        if (syncServiceRef.current) {
          await syncServiceRef.current.syncCardEvent(cardId, eventType, eventData, performerInfo);
        } else {
          console.log('Sync service not ready, operation queued:', {
            cardId,
            eventType,
            eventData,
          });
        }
        setError(null);
      } catch (err) {
        // Mark operation as failed
        if (optimisticUpdates) {
          setPendingOperations((prev) => {
            const updated = new Map(prev);
            const op = updated.get(operationId);
            if (op) {
              updated.set(operationId, { ...op, status: 'failed' });
            }
            return updated;
          });
        }

        const error = err instanceof Error ? err : new Error('Failed to sync card event');
        setError(error);
        throw error;
      }
    },
    [performerInfo, optimisticUpdates, triggerUserActivity]
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
    isPolling,
    pendingOperations,
    syncCardEvent,
    updateLocalCard,
    applyToGameCards,
    clearError,
    triggerUserActivity,
  };
}

/**
 * Hook for simplified card sync in read-only mode
 */
export function useCardSyncReadOnly(roomId: string, enabled = true) {
  return useCardSync({
    roomId,
    enabled,
    syncInterval: 5000, // 5s for read-only
    useWebSocket: false, // Use smart polling for MVP
    optimisticUpdates: false, // No optimistic updates for observers
    smartPolling: true,
    performerInfo: { type: 'observer' },
  });
}
