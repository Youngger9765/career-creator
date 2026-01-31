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
  // 離開遊戲，返回選擇畫面（只有 Owner 能用）
  exitGame: () => void;
  // 開始遊戲（只有 Owner 能用）
  startGame: () => void;
  // 遊戲是否已開始
  gameStarted: boolean;
  // 訪客是否正在等待 Owner 的狀態
  waitingForOwnerState: boolean;
}

const DEFAULT_STATE: GameModeState = {
  deck: DECK_TYPES.TRAVELER,
  gameRule: '六大性格分析',
  gameMode: GAMEPLAY_IDS.PERSONALITY_ASSESSMENT,
};

// LocalStorage key for owner state persistence
const STORAGE_KEY = 'career_creator_game_mode';

export function useGameModeSync(options: UseGameModeSyncOptions): UseGameModeSyncReturn {
  const { roomId, isOwner, initialState = DEFAULT_STATE, onStateChange } = options;

  // 訪客不使用 DEFAULT_STATE，等待 Owner 的狀態
  const [syncedState, setSyncedState] = useState<GameModeState>(
    isOwner ? initialState : { deck: '', gameRule: '', gameMode: '' }
  );
  const [ownerOnline, setOwnerOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  // 訪客等待 Owner 狀態（避免顯示 DEFAULT_STATE）
  const [waitingForOwnerState, setWaitingForOwnerState] = useState(!isOwner);
  // 追蹤 Owner 是否有主動選擇遊戲（非從 localStorage 載入）
  const hasActiveGameRef = useRef(false);
  const syncedStateRef = useRef(syncedState);

  // Load persisted state for owner
  useEffect(() => {
    if (isOwner && typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY}_${roomId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSyncedState(parsed);
        } catch (err) {
          console.error('[GameModeSync] Failed to parse saved state:', err);
        }
      }
    }
  }, [isOwner, roomId]);

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

  // Update refs when state changes
  useEffect(() => {
    syncedStateRef.current = syncedState;
  }, [syncedState]);

  // Change game mode (Owner only)
  const changeGameMode = useCallback(
    (deck: string, gameRule: string, gameMode: string) => {
      if (!isOwner || !channel) {
        console.warn('[GameModeSync] Only owner can change game mode');
        return;
      }

      const newState: GameModeState = { deck, gameRule, gameMode };

      // Update local state immediately
      setSyncedState(newState);
      persistState(newState);
      hasActiveGameRef.current = true; // ✅ 標記為主動選擇的遊戲
      onStateChange?.(newState);

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
    [isOwner, channel, persistState, onStateChange]
  );

  // Exit game - Return to game selection screen (Owner only)
  const exitGame = useCallback(() => {
    if (!isOwner || !channel) {
      console.warn('[GameModeSync] Only owner can exit game');
      return;
    }

    const emptyState: GameModeState = { deck: '', gameRule: '', gameMode: '' };

    // Update local state
    setSyncedState(emptyState);
    persistState(emptyState);
    hasActiveGameRef.current = false; // Clear active game flag
    onStateChange?.(emptyState);

    // Broadcast to others
    channel
      .send({
        type: 'broadcast',
        event: 'mode_changed',
        payload: emptyState,
      })
      .then(() => {
        console.log('[GameModeSync] Successfully broadcasted game exit');
      })
      .catch((err) => {
        console.error('[GameModeSync] Failed to broadcast game exit:', err);
      });
  }, [isOwner, channel, persistState, onStateChange]);

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

  // Setup channel and listeners
  useEffect(() => {
    if (!supabase || !roomId) return;

    // Create channel (必須使用 realtime: 前綴)
    const gameChannel = supabase.channel(`realtime:room:${roomId}:gamemode`);

    // Listen for mode changes
    gameChannel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
      setSyncedState(payload as GameModeState);
      if (!isOwner) {
        setWaitingForOwnerState(false); // ✅ 收到模式變更，停止等待
      }
      onStateChange?.(payload as GameModeState);
    });

    // Listen for game start
    gameChannel.on('broadcast', { event: 'game_started' }, ({ payload }) => {
      setGameStarted(true);
    });

    // Request current state (for non-owners joining)
    gameChannel.on('broadcast', { event: 'request_state' }, ({ payload }) => {
      if (isOwner) {
        // 只發送主動選擇的遊戲狀態，不發送從 localStorage 載入的舊狀態
        const stateToSend = hasActiveGameRef.current
          ? syncedStateRef.current
          : { deck: '', gameRule: '', gameMode: '' }; // 沒有主動選擇 → 發送空狀態

        console.log('[GameModeSync] Sending state to visitor:', {
          hasActiveGame: hasActiveGameRef.current,
          state: stateToSend,
        });

        gameChannel.send({
          type: 'broadcast',
          event: 'current_state',
          payload: stateToSend,
        });
      }
    });

    // Receive current state (for non-owners)
    gameChannel.on('broadcast', { event: 'current_state' }, ({ payload }) => {
      if (!isOwner) {
        setSyncedState(payload as GameModeState);
        setWaitingForOwnerState(false); // ✅ 收到 Owner 狀態，停止等待
        onStateChange?.(payload as GameModeState);
      }
    });

    // Owner presence tracking
    gameChannel.on('presence', { event: 'sync' }, () => {
      const state = gameChannel.presenceState();
      const users = Object.values(state).flat();
      const ownerExists = users.some((u: any) => u.role === 'owner');
      setOwnerOnline(ownerExists);
    });

    // Subscribe to channel
    gameChannel.subscribe(async (status, err) => {
      if (err) {
        console.error('[GameModeSync] Subscribe error:', err);
        setError('無法連接到遊戲同步服務');
        setIsConnected(false);
      } else if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
        setChannel(gameChannel);

        // Track presence
        if (isOwner) {
          await gameChannel.track({ role: 'owner', id: `owner-${roomId}` });
        } else {
          await gameChannel.track({ role: 'participant', id: `user-${Date.now()}` });
          // Request current state from owner
          gameChannel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: { timestamp: new Date().toISOString() },
          });
        }
      }
    });

    return () => {
      gameChannel.unsubscribe();
    };
  }, [roomId, isOwner]); // Remove onStateChange and syncedState to prevent infinite loop

  // Determine if room can be interacted with
  const canInteract = isOwner || ownerOnline;

  return {
    syncedState,
    ownerOnline,
    canInteract,
    isConnected,
    error,
    changeGameMode,
    exitGame,
    startGame,
    gameStarted,
    waitingForOwnerState,
  };
}
