/**
 * useRoomParticipants Hook
 * 諮詢室參與者 Hook - 追蹤諮詢室內的參與者
 * 整合 Supabase Presence 即時在線狀態
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { cardEventsAPI, CardEvent } from '@/lib/api/card-events';
import { usePresence } from './use-presence';

export interface RoomParticipant {
  id: string;
  name: string;
  type: 'counselor' | 'visitor' | 'user';
  initials: string;
  lastActiveAt: string;
  isOnline: boolean;
}

export interface UseRoomParticipantsOptions {
  roomId: string;
  currentUser?: {
    id?: string;
    name?: string;
    type?: 'counselor' | 'visitor' | 'user';
  };
  updateInterval?: number; // ms
  offlineThreshold?: number; // ms
}

export interface UseRoomParticipantsReturn {
  participants: RoomParticipant[];
  participantCount: number;
  onlineCount: number;
  isLoading: boolean;
  error: Error | null;
  refreshParticipants: () => Promise<void>;
}

// Helper function to generate initials from name
function generateInitials(name: string): string {
  if (!name) return '?';

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word, take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words, take first character of each word (max 2)
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
}

export function useRoomParticipants(
  options: UseRoomParticipantsOptions
): UseRoomParticipantsReturn {
  const {
    roomId,
    currentUser,
    updateInterval = 10000, // 10 seconds
    offlineThreshold = 60000, // 1 minute
  } = options;

  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 使用 Supabase Presence 獲取即時在線狀態
  const { onlineUsers, isConnected: presenceConnected, error: presenceError } = usePresence(roomId);

  // Debug log (only on connection change)
  useEffect(() => {
    if (presenceConnected) {
      console.log(
        '[useRoomParticipants] Presence connected, online users:',
        onlineUsers?.length || 0
      );
    }
  }, [presenceConnected, onlineUsers?.length]);

  // Refresh participants from recent card events
  const refreshParticipants = useCallback(async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get recent events (last 100 events should capture recent participants)
      // Note: card-events API is disabled, so this will fail gracefully
      let events: CardEvent[] = [];
      try {
        events = await cardEventsAPI.getLatestRoomEvents(roomId, 100);
      } catch (apiError) {
        // Card events API is disabled, just show current user
        console.debug('Card events API not available, showing current user only');
        events = [];
      }

      // Extract unique participants from events
      const participantMap = new Map<string, RoomParticipant>();

      // Add current user first (always online)
      if (currentUser && currentUser.name) {
        const userId = currentUser.id || `${currentUser.type}-${currentUser.name}`;
        participantMap.set(userId, {
          id: userId,
          name: currentUser.name,
          type: currentUser.type || 'user',
          initials: generateInitials(currentUser.name),
          lastActiveAt: new Date().toISOString(),
          isOnline: true,
        });
      }

      // Process events to find participants
      events.forEach((event) => {
        if (event.performer_name && event.performer_type) {
          const participantId =
            event.performer_id || `${event.performer_type}-${event.performer_name}`;
          const existingParticipant = participantMap.get(participantId);

          // Update or create participant
          const participant: RoomParticipant = {
            id: participantId,
            name: event.performer_name,
            type: event.performer_type as 'counselor' | 'visitor' | 'user',
            initials: generateInitials(event.performer_name),
            lastActiveAt: event.created_at,
            isOnline: false, // Will be calculated below
          };

          // Keep the most recent activity time
          if (
            !existingParticipant ||
            new Date(event.created_at) > new Date(existingParticipant.lastActiveAt)
          ) {
            participantMap.set(participantId, participant);
          }
        }
      });

      // Calculate online status based on last activity
      const now = Date.now();
      const participantList = Array.from(participantMap.values()).map((participant) => ({
        ...participant,
        isOnline: now - new Date(participant.lastActiveAt).getTime() < offlineThreshold,
      }));

      // Sort by online status and then by last active time
      participantList.sort((a, b) => {
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1; // Online first
        }
        return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(); // Most recent first
      });

      setParticipants(participantList);
    } catch (err) {
      console.error('Failed to refresh participants:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh participants'));
    } finally {
      setIsLoading(false);
    }
  }, [roomId, currentUser, offlineThreshold]);

  // Set up periodic refresh
  useEffect(() => {
    // Initial load
    refreshParticipants();

    // Set up interval
    const interval = setInterval(() => {
      refreshParticipants();
    }, updateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [updateInterval]); // Remove refreshParticipants from deps to prevent re-creating interval

  // Separate effect for initial load when dependencies change
  useEffect(() => {
    refreshParticipants();
  }, [roomId]); // Only refresh when roomId changes

  // 整合 Presence 在線狀態與參與者列表
  const mergedParticipants = useMemo(() => {
    const merged = [...participants];

    // 如果有 Presence 連線，使用即時在線狀態
    if (presenceConnected && onlineUsers.length > 0) {
      // 將 Presence 用戶加入或更新到參與者列表
      onlineUsers.forEach((presenceUser) => {
        const existingIndex = merged.findIndex((p) => p.id === presenceUser.id);

        if (existingIndex >= 0) {
          // 更新現有參與者的在線狀態
          merged[existingIndex] = {
            ...merged[existingIndex],
            isOnline: true,
            lastActiveAt: presenceUser.joinedAt || new Date().toISOString(),
          };
        } else {
          // 新增在線參與者
          merged.push({
            id: presenceUser.id,
            name: presenceUser.name,
            type: presenceUser.role === 'owner' ? 'counselor' : 'visitor',
            initials: generateInitials(presenceUser.name),
            lastActiveAt: presenceUser.joinedAt || new Date().toISOString(),
            isOnline: true,
          });
        }
      });

      // 標記不在 Presence 列表中的用戶為離線
      merged.forEach((participant) => {
        const isInPresence = onlineUsers.some((u) => u.id === participant.id);
        if (!isInPresence && participant.id !== currentUser?.id) {
          participant.isOnline = false;
        }
      });
    }

    // 排序：在線優先，然後按最後活動時間
    merged.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    return merged;
  }, [participants, onlineUsers, presenceConnected, currentUser?.id]);

  const participantCount = mergedParticipants.length;
  const onlineCount = mergedParticipants.filter((p) => p.isOnline).length;

  return {
    participants: mergedParticipants,
    participantCount,
    onlineCount,
    isLoading: isLoading || !presenceConnected,
    error: error || presenceError ? new Error(presenceError || 'Unknown error') : null,
    refreshParticipants,
  };
}
