/**
 * usePresence Hook
 * 管理房間內的在線狀態（使用 Supabase Presence）
 *
 * Implements exponential backoff to prevent quota exhaustion
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/auth-store';
import { RealtimeRetryManager, classifyRealtimeError, type RealtimeErrorType } from '@/lib/realtime-retry';

export interface PresenceUser {
  id: string; // user-123 或 visitor-session-abc
  name: string; // 顯示名稱
  role: 'owner' | 'visitor'; // 角色
  avatar?: string; // 頭像（可選）
  joinedAt: string; // 加入時間
}

interface PresenceState {
  [key: string]: PresenceUser[];
}

export function usePresence(roomId: string | undefined, onConnectionChange?: (isConnected: boolean, errorType?: RealtimeErrorType) => void) {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<RealtimeErrorType | null>(null);
  const [retryExhausted, setRetryExhausted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [remainingRetries, setRemainingRetries] = useState(5);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevCountRef = useRef(0);
  const retryManagerRef = useRef<RealtimeRetryManager | null>(null);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const setupPresenceRef = useRef<(() => Promise<void>) | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  // 取得當前用戶資訊
  const { user } = useAuthStore();

  // Memoize user identity to prevent unnecessary re-renders
  // Use useMemo instead of useCallback to avoid dependency issues
  const userIdentity = useMemo((): PresenceUser | null => {
    // Check visitor FIRST (visitor session takes priority over auth store)
    // This handles the case where visitor opens link in browser that has logged-in user
    if (typeof window !== 'undefined') {
      // Check URL parameter for visitor flag
      const urlParams = new URLSearchParams(window.location.search);
      const isVisitorFromUrl = urlParams.get('visitor') === 'true';

      // Check localStorage for visitor session
      const visitorSessionStr = localStorage.getItem('visitor_session');
      if (visitorSessionStr) {
        try {
          const visitorSession = JSON.parse(visitorSessionStr);

          // If visitor session exists for current room OR URL indicates visitor
          if (visitorSession.room_id === roomId || isVisitorFromUrl) {
            return {
              id: `visitor_${visitorSession.session_id || visitorSession.visitor_id}`,
              name: visitorSession.name || '訪客',
              role: 'visitor',
              joinedAt: new Date().toISOString(),
            };
          }
        } catch (e) {
          console.error('解析 visitor session 失敗:', e);
        }
      }
    }

    // If not a visitor, check for logged-in user (counselor/owner)
    if (user) {
      return {
        id: user.id,
        name: user.name || '諮詢師',
        role: 'owner',
        avatar: undefined,
        joinedAt: new Date().toISOString(),
      };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.name, roomId]); // Intentionally using user?.id and user?.name instead of user to avoid unnecessary updates

  // Keep a ref for the identity to use in callbacks without causing re-subscriptions
  const userIdentityRef = useRef(userIdentity);
  useEffect(() => {
    userIdentityRef.current = userIdentity;
  }, [userIdentity]);

  // 連接 Presence channel
  useEffect(() => {
    // 檢查 Supabase 是否已配置
    if (!isSupabaseConfigured()) {
      console.warn('Supabase 未配置，Presence 功能無法使用');
      setError('即時同步功能未啟用');
      return;
    }

    if (!supabase || !roomId) {
      return;
    }

    // Use ref to get current identity (avoids dependency on userIdentity)
    const identity = userIdentityRef.current;
    if (!identity) {
      return;
    }

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

    const setupPresence = async () => {
      if (isCleanedUp) return;
      setupPresenceRef.current = setupPresence;

      try {
        // Clean up existing channel if any
        if (channelRef.current) {
          await channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        // 建立 channel
        const channel = supabase!.channel(`room:${roomId}`, {
          config: {
            presence: {
              key: identity.id, // 使用用戶 ID 作為 presence key
            },
          },
        });

        channelRef.current = channel;

        // 監聽 Presence 同步事件
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<PresenceUser>();
            // 將 presence state 轉換為用戶陣列
            const users: PresenceUser[] = [];
            Object.values(state).forEach((presences) => {
              if (Array.isArray(presences)) {
                users.push(...presences);
              }
            });
            // Only log when user count changes
            if (users.length !== prevCountRef.current) {
              console.log('[usePresence] 在線用戶更新:', users.length, '人');
              prevCountRef.current = users.length;
            }
            setOnlineUsers(users);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('[usePresence] 用戶加入:', key);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('[usePresence] 用戶離開:', key);

            // Check if owner left
            if (Array.isArray(leftPresences)) {
              const ownerLeft = leftPresences.some((presence: any) => presence.role === 'owner');

              if (ownerLeft) {
                const currentIdentity = userIdentityRef.current;
                console.log('[usePresence] 🚨 Owner left detected, currentIdentity:', {
                  id: currentIdentity?.id,
                  role: currentIdentity?.role,
                  name: currentIdentity?.name,
                });

                // If current user is a visitor, redirect immediately
                // (Don't rely on broadcast because Supabase doesn't send broadcasts to self by default)
                if (currentIdentity?.role === 'visitor') {
                  console.log('[usePresence] 🚨 Visitor detected owner left, redirecting to session-ended');
                  router.push('/session-ended');
                  return;
                }

                // Otherwise broadcast to other participants (for multi-visitor scenarios)
                channel
                  .send({
                    type: 'broadcast',
                    event: 'session_ended',
                    payload: {
                      reason: 'owner_left',
                      timestamp: new Date().toISOString(),
                    },
                  })
                  .then(() => {
                    console.log('[usePresence] ✅ session_ended broadcast sent');
                  })
                  .catch((err) => {
                    console.error('[usePresence] Failed to broadcast session_ended:', err);
                  });
              }
            }
          })
          // Listen for session_ended broadcast (visitors will receive this)
          .on('broadcast', { event: 'session_ended' }, ({ payload }) => {
            const currentIdentity = userIdentityRef.current;
            if (currentIdentity?.role === 'visitor') {
              console.log('[usePresence] 🚨 Received session_ended, redirecting visitor');
              router.push('/session-ended');
            }
          });

        // 訂閱 channel - 根據官方文檔
        channel.subscribe(async (status, err) => {
          if (isCleanedUp) return;

          console.log('[usePresence] Subscription status:', status, 'Error:', err);

          if (status === 'SUBSCRIBED') {
            // Success! Reset retry counter and state
            retryManager.reset();
            setRetryExhausted(false);
            setIsRetrying(false);
            setRemainingRetries(5);
            setIsConnected(true);
            setError(null);
            setErrorType(null);
            onConnectionChangeRef.current?.(true);
            console.log('[usePresence] Channel subscribed successfully');

            // 發送自己的 presence 狀態 - use ref for latest identity
            try {
              const currentIdentity = userIdentityRef.current;
              if (currentIdentity) {
                const presenceTrackStatus = await channel.track(currentIdentity);
                console.log('[usePresence] Presence track status:', presenceTrackStatus);
              }
            } catch (trackErr) {
              console.error('[usePresence] Failed to track presence:', trackErr);
            }
          } else if (status === 'TIMED_OUT') {
            // Handle timeout specifically - always retryable
            console.warn('[usePresence] Connection timed out');
            setIsConnected(false);
            setError('連線逾時，正在重新連線...');
            setErrorType('TIMED_OUT');
            onConnectionChangeRef.current?.(false, 'TIMED_OUT');

            if (!isCleanedUp && retryManager.canRetry()) {
              setIsRetrying(true);
              setRemainingRetries(retryManager.getRemainingRetries());
              retryManager.scheduleRetry(() => {
                console.log('[usePresence] Attempting reconnection after timeout...');
                setupPresence();
              });
            } else {
              setRetryExhausted(true);
              setIsRetrying(false);
              setError('無法連接到即時服務，請重新整理頁面');
            }
          } else if (err || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('[usePresence] Subscription error:', err || status);
            setIsConnected(false);

            // Classify the error for appropriate handling
            const classifiedError = classifyRealtimeError(status, err);
            setError(classifiedError.userMessage);
            setErrorType(classifiedError.type);
            onConnectionChangeRef.current?.(false, classifiedError.type);

            // Handle based on error classification
            if (!classifiedError.isRetryable) {
              // Non-retryable errors: graceful degradation
              console.warn(`[usePresence] Non-retryable error (${classifiedError.type}), degrading gracefully`);
              setRetryExhausted(true);
              setIsRetrying(false);
              return;
            }

            // Attempt retry with exponential backoff for retryable errors
            if (!isCleanedUp && retryManager.canRetry()) {
              setIsRetrying(true);
              setRemainingRetries(retryManager.getRemainingRetries());
              retryManager.scheduleRetry(() => {
                console.log('[usePresence] Attempting reconnection...');
                setupPresence();
              });
            } else if (!retryManager.canRetry()) {
              setRetryExhausted(true);
              setIsRetrying(false);
              setError('無法連接到即時服務，請重新整理頁面');
            }
          }
        });
      } catch (err) {
        if (isCleanedUp) return;

        console.error('Presence 連接錯誤:', err);

        // Classify the caught error
        const classifiedError = classifyRealtimeError(undefined, err);
        setError(classifiedError.userMessage);
        setErrorType(classifiedError.type);
        setIsConnected(false);
        onConnectionChangeRef.current?.(false, classifiedError.type);

        // Only retry if error is retryable
        if (classifiedError.isRetryable && retryManager.canRetry()) {
          setIsRetrying(true);
          setRemainingRetries(retryManager.getRemainingRetries());
          retryManager.scheduleRetry(() => {
            console.log('[usePresence] Attempting reconnection after error...');
            setupPresence();
          });
        } else {
          setRetryExhausted(true);
          setIsRetrying(false);
        }
      }
    };

    setupPresence();

    // 清理函數
    return () => {
      isCleanedUp = true;
      if (retryManagerRef.current) {
        retryManagerRef.current.cleanup();
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [roomId]); // Only depend on roomId - use refs for other values

  // 手動重新連接
  const reconnect = useCallback(() => {
    console.log('[usePresence] Manual reconnect requested');

    // Reset retry manager to allow fresh retries
    if (retryManagerRef.current) {
      retryManagerRef.current.reset();
    }

    // Reset state
    setRetryExhausted(false);
    setIsRetrying(false);
    setRemainingRetries(5);
    setError(null);
    setErrorType(null);

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Trigger reconnection
    if (setupPresenceRef.current) {
      setupPresenceRef.current();
    }
  }, []);

  return {
    onlineUsers,
    isConnected,
    error,
    errorType,
    reconnect,
    retryExhausted,
    isRetrying,
    remainingRetries,
    // 用於除錯
    currentUser: userIdentity,
  };
}
