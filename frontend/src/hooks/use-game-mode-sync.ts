/**
 * useGameModeSync Hook
 * 遊戲模式同步 Hook - 使用 Supabase Broadcast 同步遊戲模式
 * Owner 切換模式時，所有參與者即時同步
 *
 * Implements exponential backoff to prevent quota exhaustion
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { DECK_TYPES, GAMEPLAY_IDS, getDefaultGameplay } from '@/constants/game-modes';
import { RealtimeRetryManager, classifyRealtimeError, RealtimeErrorType } from '@/lib/realtime-retry';

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
  // 錯誤類型（用於細粒度處理）
  errorType: RealtimeErrorType | null;
  // 是否正在重試
  isRetrying: boolean;
  // 剩餘重試次數
  remainingRetries: number;
  // 手動重新連線
  reconnect: () => void;
  // 切換遊戲模式（只有 Owner 能用）
  changeGameMode: (deck: string, gameRule: string, gameMode: string) => void;
  // 開始遊戲（只有 Owner 能用）
  startGame: () => void;
  // 退出遊戲（只有 Owner 能用）
  exitGame: () => void;
  // 遊戲是否已開始
  gameStarted: boolean;
  // 重試是否已耗盡
  retryExhausted: boolean;
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

  // Retry manager ref
  const retryManagerRef = useRef<RealtimeRetryManager | null>(null);
  const [retryExhausted, setRetryExhausted] = useState(false);
  const [errorType, setErrorType] = useState<RealtimeErrorType | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [remainingRetries, setRemainingRetries] = useState(0);

  // Keep isOwner in a ref to avoid dependency issues
  const isOwnerRef = useRef(isOwner);
  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  // Track setupChannel for reconnect
  const setupChannelRef = useRef<(() => void) | null>(null);

  // Setup channel and listeners
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !roomId) return;

    // Initialize retry manager
    if (!retryManagerRef.current) {
      retryManagerRef.current = new RealtimeRetryManager({
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
      });
    }

    const retryManager = retryManagerRef.current;
    let isCleanedUp = false;
    let currentChannel: RealtimeChannel | null = null;

    const setupChannel = async () => {
      if (isCleanedUp) return;
      setupChannelRef.current = setupChannel;

      // Clean up existing channel
      if (currentChannel) {
        await currentChannel.unsubscribe();
        currentChannel = null;
      }

      // Create channel (必須使用 realtime: 前綴)
      const gameChannel = supabase!.channel(`realtime:room:${roomId}:gamemode`);
      currentChannel = gameChannel;

      // Listen for mode changes
      gameChannel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
        updateSyncedState(payload as GameModeState);
        onStateChangeRef.current?.(payload as GameModeState);
      });

      // Listen for game start
      gameChannel.on('broadcast', { event: 'game_started' }, ({ payload }) => {
        setGameStarted(true);
      });

      // Listen for game exit - 訪客收到後回到等待中
      gameChannel.on('broadcast', { event: 'game_exit' }, ({ payload }) => {
        updateSyncedState(payload as GameModeState);
        setGameStarted(false);
        onStateChangeRef.current?.(payload as GameModeState);
        console.log('[GameModeSync] Received game exit, returning to waiting state');
      });

      // Request current state (for non-owners joining)
      gameChannel.on('broadcast', { event: 'request_state' }, ({ payload }) => {
        if (isOwnerRef.current) {
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
        if (!isOwnerRef.current) {
          updateSyncedState(payload as GameModeState);
          onStateChangeRef.current?.(payload as GameModeState);
        }
      });

      // NOTE: Presence tracking removed to avoid duplicate with usePresence hook
      // ownerOnline is provided by usePresence in GameModeIntegration.tsx

      // Subscribe to channel
      gameChannel.subscribe(async (status, err) => {
        if (isCleanedUp) return;

        if (status === 'SUBSCRIBED') {
          // Success! Reset retry counter
          retryManager.reset();
          setRetryExhausted(false);
          setIsRetrying(false);
          setErrorType(null);
          setRemainingRetries(0);
          setIsConnected(true);
          setError(null);
          setChannel(gameChannel);

          // NOTE: Presence tracking (channel.track) removed to avoid duplicate with usePresence hook
          // Only request current state for non-owners
          if (!isOwnerRef.current) {
            // Request current state from owner
            gameChannel.send({
              type: 'broadcast',
              event: 'request_state',
              payload: { timestamp: new Date().toISOString() },
            });
          }
        } else if (status === 'TIMED_OUT') {
          // Handle timeout specifically - always retryable
          console.warn('[GameModeSync] Connection timed out');
          setIsConnected(false);
          setChannel(null);
          setError('連線逾時，正在重新連線...');
          setErrorType('TIMED_OUT');

          if (!isCleanedUp && retryManager.canRetry()) {
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log('[GameModeSync] Attempting reconnection after timeout...');
              setupChannel();
            });
          } else {
            setRetryExhausted(true);
            setIsRetrying(false);
            setError('無法連接到即時服務，請重新整理頁面');
          }
        } else if (err || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.error('[GameModeSync] Subscribe error:', err || status);
          setIsConnected(false);
          setChannel(null);

          // Classify the error for appropriate handling
          const classifiedError = classifyRealtimeError(status, err);
          setError(classifiedError.userMessage);
          setErrorType(classifiedError.type);

          // Handle based on error classification
          if (!classifiedError.isRetryable) {
            // Non-retryable errors: graceful degradation
            console.warn(`[GameModeSync] Non-retryable error (${classifiedError.type}), degrading gracefully`);
            setRetryExhausted(true);
            setIsRetrying(false);
          } else if (!isCleanedUp && retryManager.canRetry()) {
            // Retryable error with attempts remaining
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log('[GameModeSync] Attempting reconnection...');
              setupChannel();
            });
          } else {
            // Retryable but exhausted
            setRetryExhausted(true);
            setIsRetrying(false);
            setError('無法連接到即時服務，請重新整理頁面');
          }
        }
      });
    };

    setupChannel();

    return () => {
      isCleanedUp = true;
      if (retryManagerRef.current) {
        retryManagerRef.current.cleanup();
      }
      if (currentChannel) {
        currentChannel.unsubscribe();
      }
      setChannel(null);
    };
  }, [roomId, updateSyncedState]); // Only essential deps - use refs for others

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('[GameModeSync] Manual reconnect requested');

    // Reset retry manager
    if (retryManagerRef.current) {
      retryManagerRef.current.reset();
    }

    // Reset state
    setRetryExhausted(false);
    setIsRetrying(false);
    setRemainingRetries(5);
    setError(null);
    setErrorType(null);

    // Trigger reconnection
    if (setupChannelRef.current) {
      setupChannelRef.current();
    }
  }, []);

  // Determine if room can be interacted with
  const canInteract = isOwner || ownerOnline;

  return {
    syncedState,
    ownerOnline,
    canInteract,
    isConnected,
    error,
    errorType,
    isRetrying,
    remainingRetries,
    reconnect,
    changeGameMode,
    startGame,
    exitGame,
    gameStarted,
    retryExhausted,
  };
}
