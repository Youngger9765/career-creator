/**
 * Visitor Join hook for managing visitor room entry
 * 訪客加入諮詢室管理 Hook
 */
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { visitorsAPI, VisitorCreate, Visitor } from '@/lib/api/visitors';
import { roomsAPI, Room } from '@/lib/api/rooms';

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
    [createVisitorByShareCode]
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
