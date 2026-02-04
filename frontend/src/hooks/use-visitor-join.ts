/**
 * Visitor Join hook for managing visitor room entry
 * 訪客加入諮詢室管理 Hook
 */
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { visitorsAPI, VisitorCreate, Visitor } from '@/lib/api/visitors';
import { roomsAPI, Room } from '@/lib/api/rooms';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { classifyRealtimeError } from '@/lib/realtime-retry';
import type { PresenceUser } from './use-presence';

interface VisitorSession {
  visitor_id: string;
  room_id: string;
  name: string;
  session_id: string;
  joined_at: string;
}

export function useVisitorJoin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSessionId = useCallback((): string => {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const validateVisitorName = useCallback((name: string): void => {
    if (!name.trim()) {
      throw new Error('請輸入姓名');
    }
    if (name.trim().length < 2) {
      throw new Error('姓名至少需要2個字符');
    }
    if (name.trim().length > 50) {
      throw new Error('姓名不能超過50個字符');
    }
  }, []);

  const createVisitorByShareCode = useCallback(
    async (shareCode: string, name: string): Promise<Visitor> => {
      validateVisitorName(name);

      const sessionId = generateSessionId();

      // Call API endpoint directly with share code
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/visitors/join-room/${shareCode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            session_id: sessionId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to join room');
      }

      const visitor = await response.json();

      // Store visitor session in localStorage
      const session: VisitorSession = {
        visitor_id: visitor.id,
        room_id: visitor.room_id,
        name: visitor.name,
        session_id: visitor.session_id,
        joined_at: visitor.joined_at,
      };

      localStorage.setItem('visitor_session', JSON.stringify(session));

      return visitor;
    },
    [generateSessionId, validateVisitorName]
  );

  /**
   * Check if room owner (counselor) is online via Presence
   * Prevents visitors from joining when owner is offline to save Realtime quota
   */
  const checkOwnerOnline = useCallback(async (roomId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[useVisitorJoin] Supabase not configured, skipping owner check');
      return true;
    }

    let tempChannel: ReturnType<typeof supabase.channel> | null = null;
    try {
      // Reuse the presence channel name so we're checking the actual presence state
      // that counselors are tracking on. This provides accurate owner online detection.
      tempChannel = supabase.channel(`realtime:room:${roomId}:presence`);

      // Create promise that resolves when sync happens
      const syncPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('[useVisitorJoin] Presence check timeout, allowing join');
          resolve(true); // Timeout = allow join (fail open)
        }, 5000);

        // Listen for sync event - this is when presence state is ready
        tempChannel!.on('presence', { event: 'sync' }, () => {
          clearTimeout(timeout);
          const state = tempChannel!.presenceState<PresenceUser>();
          const users = Object.values(state).flat();
          const ownerOnline = users.some((u) => u.role === 'owner');

          console.log('[useVisitorJoin] Owner online check (after sync):', {
            ownerOnline,
            userCount: users.length,
            users: users.map(u => ({ id: u.id, role: u.role }))
          });

          resolve(ownerOnline);
        });

        // Subscribe to channel with error classification
        tempChannel!.subscribe((status: string, err?: Error) => {
          console.log('[useVisitorJoin] Channel status:', status);

          if (status === 'TIMED_OUT') {
            clearTimeout(timeout);
            console.warn('[useVisitorJoin] Channel timed out, allowing join (fail open)');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            clearTimeout(timeout);

            // Classify the error for logging
            const classifiedError = classifyRealtimeError(status, err);
            console.warn(`[useVisitorJoin] Channel ${classifiedError.type}: ${classifiedError.message}`);

            // For rate limiting, we should NOT allow join (might overwhelm the service)
            if (classifiedError.type === 'RATE_LIMITED') {
              reject(new Error('服務繁忙，請稍後再試'));
              return;
            }

            // For other errors, fail open
            resolve(true);
          }
        });
      });

      return await syncPromise;
    } catch (error) {
      console.error('[useVisitorJoin] Error checking owner presence:', error);

      // Classify the error
      const classifiedError = classifyRealtimeError(undefined, error);

      // For rate limiting, propagate the error
      if (classifiedError.type === 'RATE_LIMITED') {
        throw new Error(classifiedError.userMessage);
      }

      return true; // Fail open for other errors
    } finally {
      if (tempChannel) {
        await tempChannel.unsubscribe();
      }
    }
  }, []);

  const validateAndJoinRoom = useCallback(
    async (shareCode: string, visitorName: string): Promise<Visitor> => {
      setIsLoading(true);
      setError(null);

      try {
        // First validate the room
        const room = await roomsAPI.getRoomByShareCode(shareCode.toUpperCase());

        // Check if room is active
        if (!room.is_active) {
          throw new Error('諮詢室已關閉，無法加入');
        }

        // Check if room is expired
        if (room.expires_at && new Date(room.expires_at) < new Date()) {
          throw new Error('諮詢室已過期，無法加入');
        }

        // Check if owner (counselor) is online
        const ownerOnline = await checkOwnerOnline(room.id);
        if (!ownerOnline) {
          throw new Error('諮詢師尚未開啟房間，請稍後再試');
        }

        // Create visitor using share code
        const visitor = await createVisitorByShareCode(shareCode.toUpperCase(), visitorName.trim());

        return visitor;
      } catch (err: any) {
        const errorMessage = err.message || '加入諮詢室失敗';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [createVisitorByShareCode, checkOwnerOnline]
  );

  const joinRoomAndRedirect = useCallback(
    async (shareCode: string, visitorName: string): Promise<void> => {
      const visitor = await validateAndJoinRoom(shareCode, visitorName);

      // Redirect to room with visitor params and visitor name
      router.push(`/room/${visitor.room_id}?visitor=true&name=${encodeURIComponent(visitorName)}`);
    },
    [validateAndJoinRoom, router]
  );

  const getStoredSession = useCallback((): VisitorSession | null => {
    const sessionStr = localStorage.getItem('visitor_session');
    if (!sessionStr) return null;

    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }, []);

  const clearSession = useCallback((): void => {
    localStorage.removeItem('visitor_session');
  }, []);

  const isInRoom = useCallback((): boolean => {
    return !!getStoredSession();
  }, [getStoredSession]);

  return {
    isLoading,
    error,
    generateSessionId,
    validateVisitorName,
    createVisitorByShareCode,
    validateAndJoinRoom,
    joinRoomAndRedirect,
    getStoredSession,
    clearSession,
    isInRoom,
  };
}
