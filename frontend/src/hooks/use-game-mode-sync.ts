/**
 * useGameModeSync Hook
 * 遊戲模式同步 Hook - 使用 Supabase Broadcast 同步遊戲模式
 * Owner 切換模式時，所有參與者即時同步
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { DECK_TYPES, GAMEPLAY_IDS, getDefaultGameplay } from '@/constants/game-modes';

export interface GameModeState {
  deck: string;
  gameRule: string;
  gameMode: string;
}

export interface UseGameModeSyncOptions {
  roomId: string;
  isOwner: boolean; // 是否為房間擁有者（諮詢師）
  initialState?: GameModeState;
  onStateChange?: (state: GameModeState) => void;
}

export interface UseGameModeSyncReturn {
  // 同步的遊戲狀態
  syncedState: GameModeState;
  // Owner 是否在線
  ownerOnline: boolean;
  // 房間是否可互動
  canInteract: boolean;
  // 連線狀態
  isConnected: boolean;
  // 錯誤訊息
  error: string | null;
  // 切換遊戲模式（只有 Owner 能用）
  changeGameMode: (deck: string, gameRule: string, gameMode: string) => void;
  // 開始遊戲（只有 Owner 能用）
  startGame: () => void;
  // 退出遊戲（只有 Owner 能用）
  exitGame: () => void;
  // 遊戲是否已開始
  gameStarted: boolean;
}

const DEFAULT_STATE: GameModeState = {
  deck: DECK_TYPES.TRAVELER,
  gameRule: '',
  gameMode: '', // 空字串表示諮詢師尚未選擇遊戲模式
};

// LocalStorage key for owner state persistence
const STORAGE_KEY = 'career_creator_game_mode';

export function useGameModeSync(options: UseGameModeSyncOptions): UseGameModeSyncReturn {
  const { roomId, isOwner, initialState = DEFAULT_STATE, onStateChange } = options;

  const [syncedState, setSyncedState] = useState<GameModeState>(initialState);
  const [ownerOnline, setOwnerOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Use ref to store latest syncedState for listeners (prevents closure stale state)
  const syncedStateRef = useRef<GameModeState>(initialState);

  // Use ref for onStateChange to prevent effect re-subscription on every render
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Helper to update both state and ref
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
      if (!isOwner || !channel) {
        console.warn('[GameModeSync] Only owner can change game mode');
        return;
      }

      const newState: GameModeState = { deck, gameRule, gameMode };

      // Update local state immediately
      updateSyncedState(newState);
      persistState(newState);
      onStateChangeRef.current?.(newState);

      // Broadcast to others
      channel
        .send({
          type: 'broadcast',
          event: 'mode_changed',
          payload: newState,
        })
        .then(() => {})
        .catch((err) => {
          console.error('[GameModeSync] Failed to broadcast:', err);
          setError('無法同步遊戲模式');
        });
    },
    [isOwner, channel, persistState, updateSyncedState]
  );

  // Start game (Owner only)
  const startGame = useCallback(() => {
    if (!isOwner || !channel) {
      console.warn('[GameModeSync] Only owner can start game');
      return;
    }

    // Broadcast game start
    channel
      .send({
        type: 'broadcast',
        event: 'game_started',
        payload: { timestamp: new Date().toISOString() },
      })
      .then(() => {
        setGameStarted(true);
      })
      .catch((err) => {
        console.error('[GameModeSync] Failed to start game:', err);
        setError('無法開始遊戲');
      });
  }, [isOwner, channel]);

  // Exit game (Owner only) - 退出玩法，廣播給所有訪客回到等待中
  const exitGame = useCallback(() => {
    if (!isOwner || !channel) {
      console.warn('[GameModeSync] Only owner can exit game');
      return;
    }

    const resetState: GameModeState = {
      deck: DECK_TYPES.TRAVELER,
      gameRule: '',
      gameMode: '', // 重置為空字串 = 等待中
    };

    // Update local state
    updateSyncedState(resetState);
    persistState(resetState);
    setGameStarted(false);
    onStateChangeRef.current?.(resetState);

    // Broadcast to all participants
    channel
      .send({
        type: 'broadcast',
        event: 'game_exit',
        payload: resetState,
      })
      .then(() => {
        console.log('[GameModeSync] Successfully broadcasted game exit');
      })
      .catch((err) => {
        console.error('[GameModeSync] Failed to broadcast game exit:', err);
        setError('無法退出遊戲');
      });
  }, [isOwner, channel, persistState, updateSyncedState]);

  // Setup channel and listeners
  useEffect(() => {
    if (!supabase || !roomId) return;

    // Create channel (必須使用 realtime: 前綴)
    const gameChannel = supabase.channel(`realtime:room:${roomId}:gamemode`);

    // Retry logic for state request (visitors only)
    let stateReceived = false;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let periodicSyncIntervalId: NodeJS.Timeout | null = null;

    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    const periodicSyncInterval = 10000; // 10 seconds

    const requestStateWithRetry = (attempt: number) => {
      if (stateReceived || attempt > maxRetries) {
        if (attempt > maxRetries) {
          console.warn('[GameModeSync] Max retries reached, will rely on periodic sync');
        }
        return;
      }

      console.log(`[GameModeSync] Requesting state from owner (attempt ${attempt}/${maxRetries})`);

      gameChannel.send({
        type: 'broadcast',
        event: 'request_state',
        payload: { timestamp: new Date().toISOString(), attempt },
      });

      // Schedule retry
      if (attempt < maxRetries) {
        retryTimeoutId = setTimeout(() => {
          if (!stateReceived) {
            requestStateWithRetry(attempt + 1);
          }
        }, retryDelay);
      }
    };

    // Periodic state sync for visitors (fallback mechanism)
    const startPeriodicSync = () => {
      periodicSyncIntervalId = setInterval(() => {
        // If visitor still has empty gameMode, request state again
        if (!isOwner && !syncedStateRef.current.gameMode) {
          console.log('[GameModeSync] Periodic sync: gameMode still empty, requesting state');
          gameChannel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: { timestamp: new Date().toISOString(), periodic: true },
          });
        }
      }, periodicSyncInterval);
    };

    // Listen for mode changes
    gameChannel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
      console.log('[GameModeSync] Received mode_changed:', payload);
      updateSyncedState(payload as GameModeState);
      onStateChangeRef.current?.(payload as GameModeState);
      stateReceived = true; // Mark as received
    });

    // Listen for game start
    gameChannel.on('broadcast', { event: 'game_started' }, ({ payload }) => {
      console.log('[GameModeSync] Received game_started');
      setGameStarted(true);
    });

    // Listen for game exit - 訪客收到後回到等待中
    gameChannel.on('broadcast', { event: 'game_exit' }, ({ payload }) => {
      console.log('[GameModeSync] Received game_exit');
      updateSyncedState(payload as GameModeState);
      setGameStarted(false);
      onStateChangeRef.current?.(payload as GameModeState);
    });

    // Request current state (for non-owners joining)
    gameChannel.on('broadcast', { event: 'request_state' }, ({ payload }) => {
      if (isOwner) {
        console.log('[GameModeSync] Owner received request_state, responding with current state:', syncedStateRef.current);
        // Use ref to get latest state (prevents closure stale state bug)
        gameChannel.send({
          type: 'broadcast',
          event: 'current_state',
          payload: syncedStateRef.current,
        });
      }
    });

    // Receive current state (for non-owners)
    gameChannel.on('broadcast', { event: 'current_state' }, ({ payload }) => {
      if (!isOwner) {
        console.log('[GameModeSync] Visitor received current_state:', payload);
        updateSyncedState(payload as GameModeState);
        onStateChangeRef.current?.(payload as GameModeState);
        stateReceived = true; // Mark as received
      }
    });

    // Owner presence tracking
    gameChannel.on('presence', { event: 'sync' }, () => {
      const state = gameChannel.presenceState();
      const users = Object.values(state).flat();
      const ownerExists = users.some((u: any) => u.role === 'owner');
      console.log('[GameModeSync] Presence sync, owner online:', ownerExists);
      setOwnerOnline(ownerExists);
    });

    // Subscribe to channel
    gameChannel.subscribe(async (status, err) => {
      if (err) {
        console.error('[GameModeSync] Subscribe error:', err);
        setError('無法連接到遊戲同步服務');
        setIsConnected(false);
      } else if (status === 'SUBSCRIBED') {
        console.log('[GameModeSync] Successfully subscribed, isOwner:', isOwner);
        setIsConnected(true);
        setError(null);
        setChannel(gameChannel);

        // Track presence
        if (isOwner) {
          await gameChannel.track({ role: 'owner', id: `owner-${roomId}` });
        } else {
          await gameChannel.track({ role: 'participant', id: `user-${Date.now()}` });

          // Start retry logic for initial state request
          requestStateWithRetry(1);

          // Start periodic sync as fallback
          startPeriodicSync();
        }
      }
    });

    return () => {
      // Cleanup timers
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      if (periodicSyncIntervalId) {
        clearInterval(periodicSyncIntervalId);
      }

      gameChannel.unsubscribe();
    };
  }, [roomId, isOwner, updateSyncedState]); // Add updateSyncedState to prevent stale closure

  // Determine if room can be interacted with
  const canInteract = isOwner || ownerOnline;

  return {
    syncedState,
    ownerOnline,
    canInteract,
    isConnected,
    error,
    changeGameMode,
    startGame,
    exitGame,
    gameStarted,
  };
}
