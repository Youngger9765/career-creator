/**
 * Gameplay State Persistence Hook
 *
 * 統一管理狀態持久化：
 * - Room owner (enabled=true): 使用 Backend (PostgreSQL)
 * - Visitor (enabled=false): 使用 localStorage
 * - 30 秒自動存檔 (如果有變更)
 * - 離開 / 切換玩法時存檔
 * - 進入時載入狀態
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStateStore, GameState } from '@/stores/game-state-store';
import { gameplayStatesAPI } from '@/lib/api/gameplay-states';

interface UseGameplayStatePersistenceOptions {
  roomId: string;
  gameplayId: string;
  enabled: boolean; // true = room owner (backend), false = visitor (localStorage)
}

// localStorage key builder
const getLocalStorageKey = (roomId: string, gameplayId: string) =>
  `gameplay-state:${roomId}:${gameplayId}`;

export function useGameplayStatePersistence(options: UseGameplayStatePersistenceOptions) {
  const { roomId, gameplayId, enabled } = options;
  const { getGameState } = useGameStateStore();

  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track if state has changed since last save
  const isDirtyRef = useRef(false);
  const lastStateRef = useRef<GameState | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Save current state (backend for room owner, localStorage for visitor)
   */
  const saveState = useCallback(async () => {
    if (!gameplayId) return;

    // Skip if state hasn't changed
    if (!isDirtyRef.current) return;

    try {
      const currentState = getGameState(roomId, gameplayId);

      // Extract uploadedFile from cardPlacements for backend storage
      // Backend expects: { cardPlacements: {...}, uploadedFile: {...}, metadata: {...} }
      // Frontend has: { cardPlacements: { uploadedFile: {...} }, metadata: {...} }
      const { uploadedFile, ...cardPlacementsWithoutFile } = currentState.cardPlacements;

      const stateToSave = {
        cardPlacements: cardPlacementsWithoutFile,
        uploadedFile: uploadedFile || null,
        metadata: currentState.metadata,
      };

      if (enabled) {
        // Room owner: Save to backend
        await gameplayStatesAPI.upsertGameplayState(roomId, gameplayId, {
          state: stateToSave,
        });
      } else {
        // Visitor: Save to localStorage
        const key = getLocalStorageKey(roomId, gameplayId);
        localStorage.setItem(key, JSON.stringify(stateToSave));
      }

      setLastSavedAt(Date.now());
      isDirtyRef.current = false;
      lastStateRef.current = currentState;
      setError(null);
    } catch (err) {
      console.error('[GameplayStatePersistence] Failed to save state:', err);
      setError(err instanceof Error ? err.message : 'Failed to save state');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, gameplayId, roomId]);

  /**
   * Load state (backend for room owner, localStorage for visitor)
   */
  const loadState = useCallback(async () => {
    if (!gameplayId) return;

    setIsLoading(true);
    setError(null);

    try {
      let savedState = null;

      if (enabled) {
        // Room owner: Load from backend
        const backendState = await gameplayStatesAPI.getGameplayState(roomId, gameplayId);
        if (backendState) {
          // Backend stores: { cardPlacements: {...}, uploadedFile: {...}, metadata: {...} }
          // Frontend needs: { cardPlacements: { uploadedFile: {...} }, metadata: {...} }
          const cardPlacementsFromBackend = backendState.state.cardPlacements || {};
          const uploadedFileFromBackend = backendState.state.uploadedFile;

          savedState = {
            cardPlacements: {
              ...cardPlacementsFromBackend,
              ...(uploadedFileFromBackend ? { uploadedFile: uploadedFileFromBackend } : {}),
            },
            metadata: backendState.state.metadata || {
              version: 1,
              lastModified: new Date(backendState.updated_at).getTime(),
              syncStatus: 'synced',
            },
          };
          setLastSavedAt(new Date(backendState.updated_at).getTime());
        }
      } else {
        // Visitor: Load from localStorage
        const key = getLocalStorageKey(roomId, gameplayId);
        const localData = localStorage.getItem(key);
        if (localData) {
          const parsed = JSON.parse(localData);

          // For localStorage, we might have either format (top-level or nested)
          // Support both for backward compatibility
          const cardPlacementsFromLocal = parsed.cardPlacements || {};
          const uploadedFileFromLocal = parsed.uploadedFile;

          savedState = {
            cardPlacements: {
              ...cardPlacementsFromLocal,
              ...(uploadedFileFromLocal ? { uploadedFile: uploadedFileFromLocal } : {}),
            },
            metadata: parsed.metadata || {
              version: 1,
              lastModified: Date.now(),
              syncStatus: 'local',
            },
          };
          setLastSavedAt(parsed.metadata?.lastModified || Date.now());
        }
      }

      if (savedState) {
        // Update Zustand store with loaded state
        const { setGameState } = useGameStateStore.getState();
        setGameState(roomId, gameplayId, savedState);

        lastStateRef.current = getGameState(roomId, gameplayId);
        isDirtyRef.current = false;
      }
    } catch (err: any) {
      console.error('[GameplayStatePersistence] Failed to load state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load state');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, gameplayId, roomId]);

  /**
   * Mark state as dirty (changed)
   */
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  /**
   * Setup auto-save interval (30 seconds) - for both room owner and visitor
   */
  useEffect(() => {
    if (!gameplayId) return;

    // Clear existing interval
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    // Setup 30-second interval
    saveIntervalRef.current = setInterval(() => {
      if (isDirtyRef.current) {
        saveState();
      }
    }, 30000); // 30 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [enabled, gameplayId, roomId, saveState]);

  /**
   * Load state on mount/gameplay change - for both room owner and visitor
   */
  useEffect(() => {
    if (gameplayId) {
      loadState();
    }
  }, [enabled, gameplayId, loadState]);

  /**
   * Save on unmount/gameplay change - for both room owner and visitor
   */
  useEffect(() => {
    return () => {
      if (gameplayId && isDirtyRef.current) {
        saveState();
      }
    };
  }, [enabled, gameplayId, saveState]);

  /**
   * Save on beforeunload (page close/refresh) - for both room owner and visitor
   */
  useEffect(() => {
    if (!gameplayId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Try to save (best effort)
        saveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, gameplayId, saveState]);

  return {
    isLoading,
    lastSavedAt,
    error,
    saveState,
    loadState,
    markDirty,
  };
}
