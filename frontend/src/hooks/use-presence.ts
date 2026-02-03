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
import { RealtimeRetryManager } from '@/lib/realtime-retry';

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

export function usePresence(roomId: string | undefined) {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryExhausted, setRetryExhausted] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevCountRef = useRef(0);
  const retryManagerRef = useRef<RealtimeRetryManager | null>(null);

  // 取得當前用戶資訊
  const { user } = useAuthStore();

  // Memoize user identity to prevent unnecessary re-renders
  // Use useMemo instead of useCallback to avoid dependency issues
  const userIdentity = useMemo((): PresenceUser | null => {
    // 1. 檢查是否為登入用戶（諮詢師）
    if (user) {
      return {
        id: user.id,
        name: user.name || '諮詢師',
        role: 'owner',
        avatar: undefined,
        joinedAt: new Date().toISOString(),
      };
    }

    // 2. 檢查是否為訪客 (only access localStorage on client side)
    if (typeof window !== 'undefined') {
      const visitorSessionStr = localStorage.getItem('visitor_session');
      if (visitorSessionStr) {
        try {
          const visitorSession = JSON.parse(visitorSessionStr);

          // 驗證 session 是否為當前房間
          if (visitorSession.room_id === roomId) {
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
          });

        // 訂閱 channel - 根據官方文檔
        channel.subscribe(async (status, err) => {
          if (isCleanedUp) return;

          console.log('[usePresence] Subscription status:', status, 'Error:', err);

          if (status === 'SUBSCRIBED') {
            // Success! Reset retry counter
            retryManager.reset();
            setRetryExhausted(false);
            setIsConnected(true);
            setError(null);
            console.log('[usePresence] ✅ Channel subscribed successfully');

            // 發送自己的 presence 狀態 - use ref for latest identity
            try {
              const currentIdentity = userIdentityRef.current;
              if (currentIdentity) {
                const presenceTrackStatus = await channel.track(currentIdentity);
                console.log('[usePresence] ✅ Presence track status:', presenceTrackStatus);
              }
            } catch (trackErr) {
              console.error('[usePresence] Failed to track presence:', trackErr);
            }
          } else if (err || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('[usePresence] Subscription error:', err || status);
            setIsConnected(false);

            // Check if error is quota-related
            const errorMsg = err?.message || String(err) || '';
            if (errorMsg.includes('quota') || errorMsg.includes('rate_limit')) {
              setError('服務配額已達上限，請稍後再試');
              setRetryExhausted(true);
              return; // Don't retry on quota errors
            }

            setError(err?.message || '連接失敗');

            // Attempt retry with exponential backoff
            if (!isCleanedUp && retryManager.canRetry()) {
              retryManager.scheduleRetry(() => {
                console.log('[usePresence] Attempting reconnection...');
                setupPresence();
              });
            } else if (!retryManager.canRetry()) {
              setRetryExhausted(true);
              setError('無法連接到即時服務，請重新整理頁面');
            }
          }
        });
      } catch (err) {
        if (isCleanedUp) return;

        console.error('Presence 連接錯誤:', err);
        setError(err instanceof Error ? err.message : '連接失敗');
        setIsConnected(false);

        // Attempt retry with exponential backoff
        if (retryManager.canRetry()) {
          retryManager.scheduleRetry(() => {
            console.log('[usePresence] Attempting reconnection after error...');
            setupPresence();
          });
        } else {
          setRetryExhausted(true);
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
    // Reset retry manager to allow fresh retries
    if (retryManagerRef.current) {
      retryManagerRef.current.reset();
    }
    setRetryExhausted(false);

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    // 重新觸發 useEffect
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    onlineUsers,
    isConnected,
    error,
    reconnect,
    retryExhausted, // Expose retry exhaustion state
    // 用於除錯
    currentUser: userIdentity,
  };
}
