/**
 * usePresence Hook
 * 管理房間內的在線狀態（使用 Supabase Presence）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/auth-store';

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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevCountRef = useRef(0);

  // 取得當前用戶資訊
  const { user } = useAuthStore();

  // 取得用戶身份
  const getUserIdentity = useCallback((): PresenceUser | null => {
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
  }, [user, roomId]);

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

    const userIdentity = getUserIdentity();
    if (!userIdentity) {
      return;
    }

    const setupPresence = async () => {
      try {
        // 建立 channel
        const channel = supabase!.channel(`room:${roomId}`, {
          config: {
            presence: {
              key: userIdentity.id, // 使用用戶 ID 作為 presence key
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
          console.log('[usePresence] Subscription status:', status, 'Error:', err);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
            console.log('[usePresence] ✅ Channel subscribed successfully');
            console.log('[usePresence] Channel info:', {
              topic: channel.topic,
              state: channel.state,
              presence: channel.presenceState(),
            });

            // 發送自己的 presence 狀態
            try {
              const presenceTrackStatus = await channel.track(userIdentity);
              console.log('[usePresence] ✅ Presence track status:', presenceTrackStatus);
              console.log('[usePresence] Current presence state:', channel.presenceState());
            } catch (trackErr) {
              console.error('[usePresence] Failed to track presence:', trackErr);
            }
          } else if (err) {
            console.error('[usePresence] Subscription error:', err);
            setIsConnected(false);
            setError(err.message || '連接失敗');
          } else {
            console.log('[usePresence] Subscription status:', status);
            // 其他狀態如 SUBSCRIBING, UNSUBSCRIBED 等
            if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
            }
          }
        });
      } catch (err) {
        console.error('Presence 連接錯誤:', err);
        setError(err instanceof Error ? err.message : '連接失敗');
        setIsConnected(false);
      }
    };

    setupPresence();

    // 清理函數
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [roomId, getUserIdentity]);

  // 手動重新連接
  const reconnect = useCallback(() => {
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
    // 用於除錯
    currentUser: getUserIdentity(),
  };
}
