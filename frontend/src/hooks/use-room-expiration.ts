/**
 * Room Expiration hook for managing room expiration logic
 * 房間過期邏輯管理 Hook
 */
import { useCallback } from 'react';
import { Room } from '@/types/api';

interface RoomStatus {
  isActive: boolean;
  isExpired: boolean;
  isClosed: boolean;
  isExpiring?: boolean;
  status: 'active' | 'expired' | 'closed' | 'expiring';
  label: string;
  color: string;
}

export function useRoomExpiration() {
  const isValidDate = useCallback((dateString: string | null | undefined): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }, []);

  const getRoomStatus = useCallback(
    (room: Room): RoomStatus => {
      // Check if room is manually closed
      if (!room.is_active) {
        return {
          isActive: false,
          isExpired: false,
          isClosed: true,
          status: 'closed',
          label: '已停用',
          color: 'bg-gray-100 text-gray-800',
        };
      }

      // Check expiration
      if (room.expires_at && isValidDate(room.expires_at)) {
        const now = new Date();
        const expiresAt = new Date(room.expires_at);

        // Room is expired
        if (expiresAt < now) {
          return {
            isActive: false,
            isExpired: true,
            isClosed: false,
            status: 'expired',
            label: '已過期',
            color: 'bg-red-100 text-red-800',
          };
        }

        // Room is expiring today (within 24 hours)
        const hoursUntilExpiration = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilExpiration <= 24) {
          return {
            isActive: true,
            isExpired: false,
            isClosed: false,
            isExpiring: true,
            status: 'expiring',
            label: '即將過期',
            color: 'bg-yellow-100 text-yellow-800',
          };
        }
      }

      // Room is active
      return {
        isActive: true,
        isExpired: false,
        isClosed: false,
        status: 'active',
        label: '有效期內',
        color: 'bg-green-100 text-green-800',
      };
    },
    [isValidDate]
  );

  const getDaysRemaining = useCallback(
    (expiresAt: string | null | undefined): number | null => {
      if (!expiresAt || !isValidDate(expiresAt)) {
        return null;
      }

      const now = new Date();
      const expiration = new Date(expiresAt);
      const diffMs = expiration.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return days > 0 ? days : 0;
    },
    [isValidDate]
  );

  const filterActiveRooms = useCallback(
    (rooms: Room[]): Room[] => {
      return rooms.filter((room) => {
        const status = getRoomStatus(room);
        return status.isActive;
      });
    },
    [getRoomStatus]
  );

  const filterInactiveRooms = useCallback(
    (rooms: Room[]): Room[] => {
      return rooms.filter((room) => {
        const status = getRoomStatus(room);
        return !status.isActive;
      });
    },
    [getRoomStatus]
  );

  const filterExpiringRooms = useCallback(
    (rooms: Room[], withinDays: number): Room[] => {
      return rooms.filter((room) => {
        if (!room.expires_at || !isValidDate(room.expires_at)) {
          return false;
        }

        const daysRemaining = getDaysRemaining(room.expires_at);
        return daysRemaining !== null && daysRemaining <= withinDays && daysRemaining > 0;
      });
    },
    [getDaysRemaining, isValidDate]
  );

  const getRelativeTimeString = useCallback(
    (expiresAt: string | null | undefined): string => {
      if (!expiresAt || !isValidDate(expiresAt)) {
        return '';
      }

      const now = new Date();
      const expiration = new Date(expiresAt);
      const diffMs = expiration.getTime() - now.getTime();
      const days = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

      if (diffMs > 0) {
        // Future
        if (days === 1) {
          return '今日過期';
        }
        return `${days} 天後過期`;
      } else {
        // Past
        return `${days} 天前過期`;
      }
    },
    [isValidDate]
  );

  return {
    getRoomStatus,
    getDaysRemaining,
    filterActiveRooms,
    filterInactiveRooms,
    filterExpiringRooms,
    getRelativeTimeString,
    isValidDate,
  };
}
