/**
 * Room Statistics hook for managing room statistics data
 * 房間統計資料管理 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import { RoomStatistics } from '@/types/api';
import { roomsAPI } from '@/lib/api/rooms';

interface UseRoomStatisticsOptions {
  autoLoad?: boolean;
}

interface ActivityInsights {
  totalEvents: number;
  mostActiveEventType: string | null;
  eventsPerVisitor: number;
  hasRecentActivity: boolean;
}

export function useRoomStatistics(
  roomId: string,
  options: UseRoomStatisticsOptions = { autoLoad: false }
) {
  const [statistics, setStatistics] = useState<RoomStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await roomsAPI.getRoomStatistics(roomId);
      setStatistics(stats);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load statistics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getActivityInsights = useCallback((): ActivityInsights => {
    if (!statistics) {
      return {
        totalEvents: 0,
        mostActiveEventType: null,
        eventsPerVisitor: 0,
        hasRecentActivity: false,
      };
    }

    const { total_events, unique_visitors, event_breakdown, last_activity } = statistics;

    // Find most active event type
    let mostActiveEventType: string | null = null;
    let maxCount = 0;

    Object.entries(event_breakdown).forEach(([eventType, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveEventType = eventType;
      }
    });

    // Calculate events per visitor
    const eventsPerVisitor = unique_visitors > 0 ? Math.round(total_events / unique_visitors) : 0;

    // Check if there's recent activity (within last 24 hours)
    let hasRecentActivity = false;
    if (last_activity) {
      const lastActivityTime = new Date(last_activity);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60 * 60);
      hasRecentActivity = hoursDiff < 24;
    }

    return {
      totalEvents: total_events,
      mostActiveEventType,
      eventsPerVisitor,
      hasRecentActivity,
    };
  }, [statistics]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad) {
      loadStatistics();
    }
  }, [options.autoLoad, loadStatistics]);

  return {
    statistics,
    isLoading,
    error,
    loadStatistics,
    clearError,
    getActivityInsights,
  };
}
