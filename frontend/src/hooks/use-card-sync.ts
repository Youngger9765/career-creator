/**
 * useCardSync Hook
 * 牌卡即時同步 Hook - 使用 Supabase Broadcast 實現即時同步
 * Phase 3: 雙方都能移動，最後操作優先
 *
 * Implements exponential backoff to prevent quota exhaustion
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { throttle, debounce } from '@/lib/throttle-debounce';
import { RealtimeRetryManager, classifyRealtimeError, type ClassifiedError, type RealtimeErrorType } from '@/lib/realtime-retry';

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

// 文件上傳事件 (使用 GCS URL，不使用 base64 dataUrl)
export interface FileUploadEvent {
  name: string;
  type: string;
  size: number;
  url: string; // GCS public URL (was dataUrl)
  uploadedAt: number;
  performedBy: 'owner' | 'visitor';
  performerName: string;
  performerId: string;
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
  onFileUpload?: (fileData: FileUploadEvent) => void;
  onConnectionChange?: (isConnected: boolean, errorType?: RealtimeErrorType) => void;
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
  // 上傳文件
  uploadFile: (fileData: Omit<FileUploadEvent, 'performedBy' | 'performerName' | 'performerId'>) => void;
  // 載入遊戲狀態
  loadGameState: () => CardGameState | null;
  // 儲存遊戲狀態（Owner only）
  saveGameState: (state: CardGameState) => void;
  // 連線狀態
  isConnected: boolean;
  error: string | null;
  // 錯誤類型（用於 UI 顯示不同訊息）
  errorType: RealtimeErrorType | null;
  // 重試是否已耗盡
  retryExhausted: boolean;
  // 是否正在重試
  isRetrying: boolean;
  // 剩餘重試次數
  remainingRetries: number;
  // 手動重連
  reconnect: () => void;
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
    onFileUpload,
    onConnectionChange,
  } = options;

  const [draggedCards, setDraggedCards] = useState<Map<string, DragInfo>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<RealtimeErrorType | null>(null);
  const [retryExhausted, setRetryExhausted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [remainingRetries, setRemainingRetries] = useState(5);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryManagerRef = useRef<RealtimeRetryManager | null>(null);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Use refs for callbacks to avoid dependency issues in useEffect
  const onCardMoveRef = useRef(onCardMove);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const onStateReceivedRef = useRef(onStateReceived);
  const onFileUploadRef = useRef(onFileUpload);

  useEffect(() => {
    onCardMoveRef.current = onCardMove;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
    onStateReceivedRef.current = onStateReceived;
    onFileUploadRef.current = onFileUpload;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onCardMove, onDragStart, onDragEnd, onStateReceived, onFileUpload, onConnectionChange]);

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

  // Create debounced broadcast for game state (500ms to reduce quota usage)
  const debouncedBroadcastGameState = useMemo(
    () =>
      debounce((state: CardGameState) => {
        if (!channelRef.current) return;

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
      }, 500),
    []
  );

  // 儲存遊戲狀態（Owner only）
  const saveGameState = useCallback(
    (state: CardGameState) => {
      if (!isOwner || typeof window === 'undefined') return;

      try {
        // Save to localStorage immediately (local UX)
        localStorage.setItem(storageKey, JSON.stringify(state));

        // Use debounced broadcast to prevent quota exhaustion
        debouncedBroadcastGameState(state);
      } catch (err) {
        console.error('[CardSyncRT] Failed to save game state:', err);
      }
    },
    [isOwner, storageKey, debouncedBroadcastGameState]
  );

  // Create throttled broadcast for card_moved (300ms throttle)
  // Note: Empty deps OK - channelRef.current is mutable, always gets latest value
  const throttledBroadcastMove = useMemo(
    () =>
      throttle((event: CardMoveEvent) => {
        if (!channelRef.current) return;

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
      }, 300),
    []
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

      // 使用 throttled broadcast（減少頻率）
      throttledBroadcastMove(event);

      // 本地也要處理
      onCardMove?.(event);
    },
    [isOwner, userName, userId, onCardMove, throttledBroadcastMove]
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

  // Create debounced broadcast for drag_end (500ms debounce)
  const debouncedBroadcastDragEnd = useMemo(
    () =>
      debounce((cardId: string) => {
        if (!channelRef.current) return;

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
      }, 500),
    []
  );

  // 結束拖曳
  const endDrag = useCallback(
    (cardId: string) => {
      if (!channelRef.current) return;

      // 使用 debounced broadcast（避免快速重複）
      debouncedBroadcastDragEnd(cardId);
    },
    [debouncedBroadcastDragEnd]
  );

  // 上傳文件
  const uploadFile = useCallback(
    (fileData: Omit<FileUploadEvent, 'performedBy' | 'performerName' | 'performerId'>) => {
      if (!channelRef.current) {
        console.warn('[CardSyncRT] Channel not connected');
        return;
      }

      const event: FileUploadEvent = {
        ...fileData,
        performedBy: isOwner ? 'owner' : 'visitor',
        performerName: userName,
        performerId: userId,
      };

      // 廣播文件上傳
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'file_uploaded',
          payload: event,
        })
        .then(() => {
          console.log('[CardSyncRT] File upload broadcasted:', event.name);
        })
        .catch((err) => {
          console.error('[CardSyncRT] Failed to broadcast file upload:', err);
          setError('無法同步文件上傳');
        });
    },
    [isOwner, userName, userId]
  );

  // Keep refs for values used in useEffect callbacks
  const isOwnerRef = useRef(isOwner);
  const userIdRef = useRef(userId);
  useEffect(() => {
    isOwnerRef.current = isOwner;
    userIdRef.current = userId;
  }, [isOwner, userId]);

  // Track setupChannel for reconnect
  const setupChannelRef = useRef<(() => Promise<void>) | null>(null);

  // 設置頻道和監聽器
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

    const setupChannel = async () => {
      if (isCleanedUp) return;
      setupChannelRef.current = setupChannel;

      // Clean up existing channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // 建立頻道 (必須使用 realtime: 前綴)
      const channel = supabase!.channel(`realtime:room:${roomId}:cards:${gameType}`);

      // 監聽牌卡移動
      channel.on('broadcast', { event: 'card_moved' }, ({ payload }) => {
        const event = payload as CardMoveEvent;

        // 如果是自己的操作，跳過（已在本地處理）
        if (event.performerId === userIdRef.current) return;

        // 處理他人的移動
        onCardMoveRef.current?.(event);
      });

      // 監聽拖曳開始
      channel.on('broadcast', { event: 'drag_start' }, ({ payload }) => {
        const info = payload as DragInfo;

        // 如果是自己，跳過
        if (info.performerId === userIdRef.current) return;

        // 更新拖曳狀態
        setDraggedCards((prev) => {
          const next = new Map(prev);
          next.set(info.cardId, info);
          return next;
        });

        onDragStartRef.current?.(info);
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

        onDragEndRef.current?.(cardId);
      });

      // 監聽文件上傳
      channel.on('broadcast', { event: 'file_uploaded' }, ({ payload }) => {
        const event = payload as FileUploadEvent;

        // 如果是自己的操作，跳過（已在本地處理）
        if (event.performerId === userIdRef.current) return;

        // 處理他人的文件上傳
        console.log('[CardSyncRT] Received file upload:', event.name);
        onFileUploadRef.current?.(event);
      });

      // 新用戶請求狀態
      channel.on('broadcast', { event: 'request_game_state' }, ({ payload }) => {
        if (isOwnerRef.current) {
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
        if (!isOwnerRef.current) {
          const state = payload as CardGameState;
          onStateReceivedRef.current?.(state);
        }
      });

      // 訂閱頻道
      channel.subscribe(async (status, err) => {
        if (isCleanedUp) return;

        if (status === 'SUBSCRIBED') {
          // Success! Reset retry counter and state
          retryManager.reset();
          setRetryExhausted(false);
          setIsRetrying(false);
          setRemainingRetries(5);
          setIsConnected(true);
          setError(null);
          setErrorType(null);
          channelRef.current = channel;
          onConnectionChangeRef.current?.(true);

          // 新用戶請求當前狀態
          if (!isOwnerRef.current) {
            channel.send({
              type: 'broadcast',
              event: 'request_game_state',
              payload: { userId: userIdRef.current },
            });
          }
        } else if (status === 'TIMED_OUT') {
          // Handle timeout specifically - always retryable
          console.warn('[CardSyncRT] Connection timed out');
          setIsConnected(false);
          channelRef.current = null;
          setError('連線逾時，正在重新連線...');
          setErrorType('TIMED_OUT');
          onConnectionChangeRef.current?.(false, 'TIMED_OUT');

          if (!isCleanedUp && retryManager.canRetry()) {
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log('[CardSyncRT] Attempting reconnection after timeout...');
              setupChannel();
            });
          } else {
            setRetryExhausted(true);
            setIsRetrying(false);
            setError('無法連接到即時服務，請重新整理頁面');
          }
        } else if (err || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.error('[CardSyncRT] Subscribe error:', err || status);
          setIsConnected(false);
          channelRef.current = null;

          // Classify the error for appropriate handling
          const classifiedError = classifyRealtimeError(status, err);
          setError(classifiedError.userMessage);
          setErrorType(classifiedError.type);
          onConnectionChangeRef.current?.(false, classifiedError.type);

          // Handle based on error classification
          if (!classifiedError.isRetryable) {
            // Non-retryable errors: graceful degradation
            console.warn(`[CardSyncRT] Non-retryable error (${classifiedError.type}), degrading gracefully`);
            setRetryExhausted(true);
            setIsRetrying(false);
            return;
          }

          // Attempt retry with exponential backoff for retryable errors
          if (!isCleanedUp && retryManager.canRetry()) {
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log('[CardSyncRT] Attempting reconnection...');
              setupChannel();
            });
          } else if (!retryManager.canRetry()) {
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
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Cleanup pending throttled/debounced calls to prevent memory leaks
      throttledBroadcastMove.cancel();
      debouncedBroadcastDragEnd.cancel();
      debouncedBroadcastGameState.cancel();
    };
  }, [roomId, gameType, loadGameState, throttledBroadcastMove, debouncedBroadcastDragEnd, debouncedBroadcastGameState]); // Minimal deps - use refs for others

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('[CardSyncRT] Manual reconnect requested');

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

  return {
    draggedCards,
    moveCard,
    startDrag,
    endDrag,
    uploadFile,
    loadGameState,
    saveGameState,
    isConnected,
    error,
    errorType,
    retryExhausted,
    isRetrying,
    remainingRetries,
    reconnect,
    channelRef,
  };
}
