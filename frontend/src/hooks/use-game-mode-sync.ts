/**
 * useGameModeSync Hook (Simplified)
 *
 * 遊戲模式同步 - 使用 Supabase Broadcast
 * Owner 切換模式時，所有參與者即時同步
 *
 * 不做複雜的 retry - 讓 Supabase 自動處理重連
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { DECK_TYPES } from '@/constants/game-modes';

export interface GameModeState {
  deck: string;
  gameRule: string;
  gameMode: string;
}

export interface UseGameModeSyncOptions {
  roomId: string;
  isOwner: boolean;
  initialState?: GameModeState;
  onStateChange?: (state: GameModeState) => void;
}

export interface UseGameModeSyncReturn {
  syncedState: GameModeState;
  ownerOnline: boolean; // Always false - use usePresence instead
  canInteract: boolean;
  isConnected: boolean;
  error: string | null;
  errorType: string | null;
  isRetrying: boolean;
  remainingRetries: number;
  reconnect: () => void;
  changeGameMode: (deck: string, gameRule: string, gameMode: string) => void;
  startGame: () => void;
  exitGame: () => void;
  gameStarted: boolean;
  retryExhausted: boolean;
}

const DEFAULT_STATE: GameModeState = {
  deck: DECK_TYPES.TRAVELER,
  gameRule: '',
  gameMode: '',
};

const STORAGE_KEY = 'career_creator_game_mode';

export function useGameModeSync(options: UseGameModeSyncOptions): UseGameModeSyncReturn {
  const { roomId, isOwner, initialState = DEFAULT_STATE, onStateChange } = options;

  const [syncedState, setSyncedState] = useState<GameModeState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const syncedStateRef = useRef<GameModeState>(initialState);
  const onStateChangeRef = useRef(onStateChange);
  const isOwnerRef = useRef(isOwner);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  const updateSyncedState = useCallback((newState: GameModeState) => {
    setSyncedState(newState);
    syncedStateRef.current = newState;
  }, []);

  // Load persisted state for owner
  useEffect(() => {
    if (isOwner && typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY}_${roomId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          updateSyncedState(parsed);
          onStateChangeRef.current?.(parsed);
        } catch (err) {
          console.error('[GameModeSync] Failed to parse saved state:', err);
        }
      }
    }
  }, [isOwner, roomId, updateSyncedState]);

  // Persist state for owner
  const persistState = useCallback(
    (state: GameModeState) => {
      if (isOwner && typeof window !== 'undefined') {
        const storageKey = `${STORAGE_KEY}_${roomId}`;
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    },
    [isOwner, roomId]
  );

  // Change game mode (Owner only)
  const changeGameMode = useCallback(
    (deck: string, gameRule: string, gameMode: string) => {
      if (!isOwner) {
        console.warn('[GameModeSync] Only owner can change game mode');
        return;
      }

      const newState: GameModeState = { deck, gameRule, gameMode };

      updateSyncedState(newState);
      persistState(newState);
      onStateChangeRef.current?.(newState);

      // Broadcast to others
      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'mode_changed',
            payload: newState,
          })
          .catch((err) => {
            console.error('[GameModeSync] Failed to broadcast:', err);
          });
      }
    },
    [isOwner, persistState, updateSyncedState]
  );

  // Start game (Owner only)
  const startGame = useCallback(() => {
    if (!isOwner) return;

    if (channelRef.current) {
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'game_started',
          payload: { timestamp: new Date().toISOString() },
        })
        .then(() => setGameStarted(true))
        .catch((err) => console.error('[GameModeSync] Failed to start game:', err));
    }
  }, [isOwner]);

  // Exit game (Owner only)
  const exitGame = useCallback(() => {
    if (!isOwner) return;

    const resetState: GameModeState = {
      deck: DECK_TYPES.TRAVELER,
      gameRule: '',
      gameMode: '',
    };

    updateSyncedState(resetState);
    persistState(resetState);
    setGameStarted(false);
    onStateChangeRef.current?.(resetState);

    if (channelRef.current) {
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'game_exit',
          payload: resetState,
        })
        .catch((err) => console.error('[GameModeSync] Failed to broadcast game exit:', err));
    }
  }, [isOwner, persistState, updateSyncedState]);

  // Setup channel - NO RETRY LOGIC
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !roomId) return;

    // Clean up existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    let isCleanedUp = false;

    const channel = supabase.channel(`room:${roomId}:gamemode`);
    channelRef.current = channel;

    // Listen for mode changes
    channel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
      if (isCleanedUp) return;
      updateSyncedState(payload as GameModeState);
      onStateChangeRef.current?.(payload as GameModeState);
    });

    // Listen for game start
    channel.on('broadcast', { event: 'game_started' }, () => {
      if (isCleanedUp) return;
      setGameStarted(true);
    });

    // Listen for game exit
    channel.on('broadcast', { event: 'game_exit' }, ({ payload }) => {
      if (isCleanedUp) return;
      updateSyncedState(payload as GameModeState);
      setGameStarted(false);
      onStateChangeRef.current?.(payload as GameModeState);
    });

    // Request current state (for non-owners)
    channel.on('broadcast', { event: 'request_state' }, () => {
      if (isCleanedUp || !isOwnerRef.current) return;
      channel.send({
        type: 'broadcast',
        event: 'current_state',
        payload: syncedStateRef.current,
      });
    });

    // Receive current state (for non-owners)
    channel.on('broadcast', { event: 'current_state' }, ({ payload }) => {
      if (isCleanedUp || isOwnerRef.current) return;
      updateSyncedState(payload as GameModeState);
      onStateChangeRef.current?.(payload as GameModeState);
    });

    // Subscribe - let Supabase handle reconnection
    channel.subscribe((status) => {
      if (isCleanedUp) return;

      console.log('[GameModeSync] Status:', status);

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);

        // Request current state if not owner
        if (!isOwnerRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: { timestamp: new Date().toISOString() },
          });
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // Don't retry - let Supabase handle it
        console.log('[GameModeSync] Channel issue, Supabase will auto-reconnect');
        setIsConnected(false);
      }
    });

    return () => {
      isCleanedUp = true;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomId, updateSyncedState]);

  // Manual reconnect (placeholder - not needed with Supabase auto-reconnect)
  const reconnect = useCallback(() => {
    console.log('[GameModeSync] Manual reconnect requested');
    setIsConnected(false);
  }, []);

  return {
    syncedState,
    ownerOnline: false, // Always false - use usePresence instead
    canInteract: isOwner, // Simplified - UI uses usePresence for owner online check
    isConnected,
    error,
    errorType: null,
    isRetrying: false,
    remainingRetries: 0,
    reconnect,
    changeGameMode,
    startGame,
    exitGame,
    gameStarted,
    retryExhausted: false,
  };
}
