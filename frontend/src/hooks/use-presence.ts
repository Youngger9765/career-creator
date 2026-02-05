/**
 * usePresence Hook (Simplified)
 *
 * 只做一件事：追蹤 owner 是否在線
 * - 不做複雜的 retry（讓 Supabase 自動處理）
 * - 不追蹤所有用戶列表
 * - 只關心 owner 在不在
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/auth-store';

export interface PresenceUser {
  id: string;
  name: string;
  role: 'owner' | 'visitor';
  avatar?: string;
  joinedAt: string;
}

export function usePresence(roomId: string | undefined) {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ownerOnline, setOwnerOnline] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { user } = useAuthStore();

  // Determine current user identity
  const userIdentity = useMemo((): PresenceUser | null => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isVisitorFromUrl = urlParams.get('visitor') === 'true';
      const visitorSessionStr = localStorage.getItem('visitor_session');

      if (visitorSessionStr) {
        try {
          const visitorSession = JSON.parse(visitorSessionStr);
          if (visitorSession.room_id === roomId || isVisitorFromUrl) {
            return {
              id: `visitor_${visitorSession.session_id || visitorSession.visitor_id}`,
              name: visitorSession.name || '訪客',
              role: 'visitor',
              joinedAt: new Date().toISOString(),
            };
          }
        } catch (e) {
          console.error('[usePresence] Parse visitor session failed:', e);
        }
      }
    }

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
  }, [user?.id, user?.name, roomId]);

  const userIdentityRef = useRef(userIdentity);
  useEffect(() => {
    userIdentityRef.current = userIdentity;
  }, [userIdentity]);

  // Single channel setup - NO RETRY LOGIC
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !roomId) {
      return;
    }

    const identity = userIdentityRef.current;
    if (!identity) {
      return;
    }

    // Clean up any existing channel first
    if (channelRef.current) {
      channelRef.current.untrack();
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    let isCleanedUp = false;

    // Use consistent channel name (same as before)
    const channel = supabase.channel(`realtime:room:${roomId}:presence`, {
      config: {
        presence: {
          key: identity.id,
        },
      },
    });

    channelRef.current = channel;

    // Helper to extract unique users from presence state
    const extractUsers = (state: Record<string, PresenceUser[]>): PresenceUser[] => {
      const userMap = new Map<string, PresenceUser>();
      Object.values(state).forEach((presences) => {
        if (Array.isArray(presences)) {
          presences.forEach((p) => userMap.set(p.id, p));
        }
      });
      return Array.from(userMap.values());
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        if (isCleanedUp) return;

        const state = channel.presenceState<PresenceUser>();
        const users = extractUsers(state);
        const hasOwner = users.some((u) => u.role === 'owner');

        console.log('[usePresence] sync - users:', users.length, 'ownerOnline:', hasOwner);
        setOnlineUsers(users);
        setOwnerOnline(hasOwner);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (isCleanedUp) return;

        // Check if owner left
        const ownerLeft = Array.isArray(leftPresences) &&
          leftPresences.some((p: any) => p.role === 'owner');

        if (ownerLeft && userIdentityRef.current?.role === 'visitor') {
          console.log('[usePresence] Owner left, checking in 3s...');

          // Wait 3 seconds to confirm owner really left
          setTimeout(() => {
            if (isCleanedUp) return;

            const currentState = channel.presenceState<PresenceUser>();
            const users = extractUsers(currentState);
            const ownerStillHere = users.some((u) => u.role === 'owner');

            if (!ownerStillHere) {
              console.log('[usePresence] Owner confirmed gone, redirecting...');
              router.push('/session-ended');
            } else {
              console.log('[usePresence] Owner came back');
            }
          }, 3000);
        }
      });

    // Subscribe once - let Supabase handle reconnection
    channel.subscribe(async (status) => {
      if (isCleanedUp) return;

      console.log('[usePresence] Status:', status);

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);

        // Track presence ONCE
        const currentIdentity = userIdentityRef.current;
        if (currentIdentity) {
          try {
            await channel.track(currentIdentity);
            console.log('[usePresence] Tracked successfully');
          } catch (err) {
            console.error('[usePresence] Track failed:', err);
          }
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // Don't retry manually - Supabase reconnects automatically
        // Just update state
        console.log('[usePresence] Channel issue, Supabase will auto-reconnect');
        setIsConnected(false);
      }
    });

    return () => {
      isCleanedUp = true;

      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      setIsConnected(false);
      setOnlineUsers([]);
      setOwnerOnline(false);
    };
  }, [roomId, router]);

  // Manual reconnect (for user-triggered refresh)
  const reconnect = useCallback(() => {
    if (!channelRef.current || !supabase || !roomId) return;

    console.log('[usePresence] Manual reconnect');

    channelRef.current.untrack();
    channelRef.current.unsubscribe();
    channelRef.current = null;

    // Re-trigger effect by updating state
    setIsConnected(false);
  }, [roomId]);

  return {
    onlineUsers,
    isConnected,
    ownerOnline,
    reconnect,
    currentUser: userIdentity,
    // Legacy compatibility (for existing code)
    error: null,
    errorType: null,
    retryExhausted: false,
    isRetrying: false,
    remainingRetries: 0,
  };
}
