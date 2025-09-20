/**
 * useCardSync Hook
 * 卡牌同步 Hook - 處理卡牌狀態同步的 React Hook (Polling Only for MVP)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { CardSyncService, SyncedCardState, createCardSyncService } from '@/lib/services/card-sync';
import { CardEventType } from '@/lib/api/card-events';
import { GameCard } from '@/types/cards';

export interface UseCardSyncOptions {
  roomId: string;
  enabled?: boolean;
  syncInterval?: number;
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
    optimisticUpdates = true,
    smartPolling = true,
    idleTimeout = 30000, // Stop polling after 30s of inactivity
    performerInfo,
  } = options;

  const [syncedCards, setSyncedCards] = useState<SyncedCardState[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(
    new Map()
  );
  const lastActivityRef = useRef<number>(Date.now());

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncServiceRef = useRef<CardSyncService | null>(null);

  // Initialize sync service (polling only)
  useEffect(() => {
    if (!roomId || !enabled) {
      return;
    }

    syncServiceRef.current = createCardSyncService({
      roomId,
      syncInterval,
      optimisticUpdates,
      smartPolling,
      performerInfo,
    });

    return () => {
      syncServiceRef.current?.destroy();
      syncServiceRef.current = null;
    };
  }, [roomId, enabled, syncInterval, optimisticUpdates, smartPolling, performerInfo]);

  // Smart polling implementation
  const startSmartPolling = useCallback(() => {
    if (!syncServiceRef.current || !smartPolling) return;

    const pollAndCheck = async () => {
      try {
        setIsPolling(true);
        const result = await syncServiceRef.current!.pollChanges();

        if (result.changed) {
          setSyncedCards(result.cards);
          setLastSyncTime(new Date().toISOString());
          lastActivityRef.current = Date.now();
        }

        // Check if idle timeout reached
        if (Date.now() - lastActivityRef.current > idleTimeout) {
          stopPolling();
          setIsActive(false);
          return;
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Polling failed'));
      } finally {
        setIsPolling(false);
      }
    };

    // Start immediately
    pollAndCheck();

    // Then poll at intervals
    pollingIntervalRef.current = setInterval(pollAndCheck, syncInterval);
    setIsActive(true);
  }, [syncInterval, smartPolling, idleTimeout]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    setIsPolling(false);
    setIsActive(false);
  }, []);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && syncServiceRef.current) {
      startSmartPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startSmartPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const syncCardEvent = useCallback(
    async (cardId: string, eventType: CardEventType, eventData?: Record<string, any>) => {
      if (!syncServiceRef.current) return;

      const operationId = `${cardId}-${eventType}-${Date.now()}`;
      const operation: PendingOperation = {
        id: operationId,
        cardId,
        eventType,
        eventData,
        timestamp: Date.now(),
        status: 'pending',
      };

      setPendingOperations((prev) => new Map(prev).set(operationId, operation));

      try {
        await syncServiceRef.current.submitCardEvent(cardId, eventType, eventData);

        setPendingOperations((prev) => {
          const updated = new Map(prev);
          const op = updated.get(operationId);
          if (op) {
            updated.set(operationId, { ...op, status: 'resolved' });
          }
          return updated;
        });

        // Trigger activity
        triggerUserActivity();
      } catch (error) {
        setPendingOperations((prev) => {
          const updated = new Map(prev);
          const op = updated.get(operationId);
          if (op) {
            updated.set(operationId, { ...op, status: 'failed' });
          }
          return updated;
        });
        throw error;
      }
    },
    []
  );

  const updateLocalCard = useCallback((cardId: string, updates: Partial<SyncedCardState>) => {
    setSyncedCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
    );
  }, []);

  const applyToGameCards = useCallback(
    (gameCards: GameCard[]): GameCard[] => {
      return gameCards.map((gameCard) => {
        const syncedCard = syncedCards.find((sc) => sc.id === gameCard.id);
        if (syncedCard) {
          return {
            ...gameCard,
            ...syncedCard,
          };
        }
        return gameCard;
      });
    },
    [syncedCards]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const triggerUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Restart polling if idle
    if (!isActive && enabled) {
      startSmartPolling();
    }

    // Reset idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastActivityRef.current >= idleTimeout) {
        stopPolling();
      }
    }, idleTimeout);
  }, [isActive, enabled, startSmartPolling, stopPolling, idleTimeout]);

  return {
    syncedCards,
    isActive,
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
 * Default hook for MVP - polling only
 */
export function useCardSyncPolling(roomId: string, enabled = true) {
  return useCardSync({
    roomId,
    enabled,
    smartPolling: true, // Use smart polling for MVP
  });
}
