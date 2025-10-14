/**
 * useCardSync Hook
 * 牌卡即時同步 Hook - 使用 Supabase Broadcast 實現即時同步
 * Phase 3: 雙方都能移動，最後操作優先
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 牌卡移動事件
export interface CardMoveEvent {
  cardId: string;
  fromZone?: string;
  toZone: string;
  position?: { x: number; y: number };
  index?: number;
  timestamp: number;
  performedBy: 'owner' | 'visitor';
  performerName: string;
  performerId: string;
}

// 拖曳狀態
export interface DragInfo {
  cardId: string;
  performerName: string;
  performerId: string;
  startTime: number;
}

// 遊戲狀態（存在 localStorage）
export interface CardGameState {
  cards: {
    [cardId: string]: {
      zone: string;
      position?: { x: number; y: number };
      index?: number;
    };
  };
  settings?: {
    [key: string]: any; // 支援遊戲設定（如 LifeTransformationGame 的 maxCards, totalTokens, 或 GrowthPlanning 的 planText）
  };
  textInputs?: {
    [key: string]: string; // 支援多個文字欄位（保留向後相容）
  };
  lastUpdated: number;
  gameType: string;
}

export interface UseCardSyncOptions {
  roomId: string;
  gameType: string; // 不同遊戲獨立狀態
  isOwner: boolean;
  userName: string;
  userId: string;
  onCardMove?: (event: CardMoveEvent) => void;
  onDragStart?: (info: DragInfo) => void;
  onDragEnd?: (cardId: string) => void;
  onStateReceived?: (state: CardGameState) => void;
}

export interface UseCardSyncReturn {
  // 誰在拖曳什麼牌
  draggedCards: Map<string, DragInfo>;
  // 發送牌卡移動
  moveCard: (
    cardId: string,
    toZone: string,
    fromZone?: string,
    position?: { x: number; y: number },
    index?: number
  ) => void;
  // 開始拖曳
  startDrag: (cardId: string) => void;
  // 結束拖曳
  endDrag: (cardId: string) => void;
  // 載入遊戲狀態
  loadGameState: () => CardGameState | null;
  // 儲存遊戲狀態（Owner only）
  saveGameState: (state: CardGameState) => void;
  // 連線狀態
  isConnected: boolean;
  error: string | null;
  // Channel reference for direct access
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
}

export function useCardSync(options: UseCardSyncOptions): UseCardSyncReturn {
  const {
    roomId,
    gameType,
    isOwner,
    userName,
    userId,
    onCardMove,
    onDragStart,
    onDragEnd,
    onStateReceived,
  } = options;

  const [draggedCards, setDraggedCards] = useState<Map<string, DragInfo>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // LocalStorage key
  const storageKey = `career_creator_cards_${roomId}_${gameType}`;

  // 載入遊戲狀態
  const loadGameState = useCallback((): CardGameState | null => {
    if (typeof window === 'undefined') return null;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('[CardSyncRT] Failed to parse game state:', err);
      }
    }
    return null;
  }, [storageKey]);

  // 儲存遊戲狀態（Owner only）
  const saveGameState = useCallback(
    (state: CardGameState) => {
      if (!isOwner || typeof window === 'undefined') return;

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));

        // 同時廣播狀態給其他人
        if (channelRef.current) {
          channelRef.current
            .send({
              type: 'broadcast',
              event: 'current_game_state',
              payload: state,
            })
            .then(() => {})
            .catch((err) => {
              console.error('[CardSyncRT] Failed to broadcast game state:', err);
            });
        }
      } catch (err) {
        console.error('[CardSyncRT] Failed to save game state:', err);
      }
    },
    [isOwner, storageKey]
  );

  // 發送牌卡移動
  const moveCard = useCallback(
    (
      cardId: string,
      toZone: string,
      fromZone?: string,
      position?: { x: number; y: number },
      index?: number
    ) => {
      if (!channelRef.current) {
        console.warn('[CardSyncRT] Channel not connected');
        return;
      }

      const event: CardMoveEvent = {
        cardId,
        fromZone,
        toZone,
        position,
        index,
        timestamp: Date.now(),
        performedBy: isOwner ? 'owner' : 'visitor',
        performerName: userName,
        performerId: userId,
      };

      // 廣播移動事件
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'card_moved',
          payload: event,
        })
        .then(() => {})
        .catch((err) => {
          console.error('[CardSyncRT] Failed to broadcast move:', err);
          setError('無法同步牌卡移動');
        });

      // 本地也要處理
      onCardMove?.(event);
    },
    [isOwner, userName, userId, onCardMove]
  );

  // 開始拖曳
  const startDrag = useCallback(
    (cardId: string) => {
      if (!channelRef.current) return;

      const info: DragInfo = {
        cardId,
        performerName: userName,
        performerId: userId,
        startTime: Date.now(),
      };

      // 廣播開始拖曳
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'drag_start',
          payload: info,
        })
        .then(() => {})
        .catch((err) => {
          console.error('[CardSyncRT] Failed to broadcast drag start:', err);
        });
    },
    [userName, userId]
  );

  // 結束拖曳
  const endDrag = useCallback((cardId: string) => {
    if (!channelRef.current) return;

    // 廣播結束拖曳
    channelRef.current
      .send({
        type: 'broadcast',
        event: 'drag_end',
        payload: { cardId },
      })
      .then(() => {})
      .catch((err) => {
        console.error('[CardSyncRT] Failed to broadcast drag end:', err);
      });
  }, []);

  // 設置頻道和監聽器
  useEffect(() => {
    if (!supabase || !roomId) return;

    // 建立頻道
    const channel = supabase.channel(`room:${roomId}:cards:${gameType}`);

    // 監聽牌卡移動
    channel.on('broadcast', { event: 'card_moved' }, ({ payload }) => {
      const event = payload as CardMoveEvent;

      // 如果是自己的操作，跳過（已在本地處理）
      if (event.performerId === userId) return;

      // 處理他人的移動
      onCardMove?.(event);
    });

    // 監聽拖曳開始
    channel.on('broadcast', { event: 'drag_start' }, ({ payload }) => {
      const info = payload as DragInfo;

      // 如果是自己，跳過
      if (info.performerId === userId) return;

      // 更新拖曳狀態
      setDraggedCards((prev) => {
        const next = new Map(prev);
        next.set(info.cardId, info);
        return next;
      });

      onDragStart?.(info);
    });

    // 監聽拖曳結束
    channel.on('broadcast', { event: 'drag_end' }, ({ payload }) => {
      const { cardId } = payload;

      // 移除拖曳狀態
      setDraggedCards((prev) => {
        const next = new Map(prev);
        next.delete(cardId);
        return next;
      });

      onDragEnd?.(cardId);
    });

    // 新用戶請求狀態
    channel.on('broadcast', { event: 'request_game_state' }, ({ payload }) => {
      if (isOwner) {
        const state = loadGameState();
        if (state) {
          channel.send({
            type: 'broadcast',
            event: 'current_game_state',
            payload: state,
          });
        }
      }
    });

    // 接收完整狀態（新用戶）
    channel.on('broadcast', { event: 'current_game_state' }, ({ payload }) => {
      if (!isOwner) {
        const state = payload as CardGameState;
        onStateReceived?.(state);
      }
    });

    // 訂閱頻道
    channel.subscribe(async (status, err) => {
      if (err) {
        console.error('[CardSyncRT] Subscribe error:', err);
        setError('無法連接到牌卡同步服務');
        setIsConnected(false);
      } else if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
        channelRef.current = channel;

        // 新用戶請求當前狀態
        if (!isOwner) {
          channel.send({
            type: 'broadcast',
            event: 'request_game_state',
            payload: { userId },
          });
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [
    roomId,
    gameType,
    isOwner,
    userId,
    onCardMove,
    onDragStart,
    onDragEnd,
    onStateReceived,
    loadGameState,
  ]);

  return {
    draggedCards,
    moveCard,
    startDrag,
    endDrag,
    loadGameState,
    saveGameState,
    isConnected,
    error,
    channelRef, // Export for direct channel access
  };
}
