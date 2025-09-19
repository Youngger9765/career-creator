/**
 * useRoomParticipants Hook
 * 房間參與者 Hook - 追蹤房間內的參與者
 */
import { useState, useEffect, useCallback } from 'react';
import { cardEventsAPI } from '@/lib/api/card-events';

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

  // Refresh participants from recent card events
  const refreshParticipants = useCallback(async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get recent events (last 100 events should capture recent participants)
      const events = await cardEventsAPI.getLatestRoomEvents(roomId, 100);

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
    const interval = setInterval(refreshParticipants, updateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [refreshParticipants, updateInterval]);

  const participantCount = participants.length;
  const onlineCount = participants.filter((p) => p.isOnline).length;

  return {
    participants,
    participantCount,
    onlineCount,
    isLoading,
    error,
    refreshParticipants,
  };
}
