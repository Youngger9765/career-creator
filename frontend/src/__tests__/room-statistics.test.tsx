/**
 * Room Statistics Tests
 * TDD approach for room statistics functionality
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomStatistics } from '@/types/api';
import { roomsAPI } from '@/lib/api/rooms';
import { useRoomStatistics } from '@/hooks/use-room-statistics';
import { renderHook } from '@testing-library/react';

// Mock the API
vi.mock('@/lib/api/rooms', () => ({
  roomsAPI: {
    getRoomStatistics: vi.fn(),
  },
}));

const mockRoomId = 'room-123';
const mockStatistics: RoomStatistics = {
  total_events: 15,
  unique_visitors: 3,
  last_activity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  event_breakdown: {
    CARD_FLIPPED: 8,
    CARD_MOVED: 4,
    NOTES_ADDED: 2,
    INSIGHT_RECORDED: 1,
  },
};

describe('useRoomStatistics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load room statistics successfully', async () => {
    vi.mocked(roomsAPI.getRoomStatistics).mockResolvedValue(mockStatistics);

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.statistics).toBeNull();
    expect(result.current.error).toBeNull();

    // Trigger loading
    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.statistics).toEqual(mockStatistics);
    expect(result.current.error).toBeNull();
    expect(roomsAPI.getRoomStatistics).toHaveBeenCalledWith(mockRoomId);
  });

  it('should handle loading state correctly', async () => {
    const promise = new Promise(() => {}); // Never resolves
    vi.mocked(roomsAPI.getRoomStatistics).mockReturnValue(promise as any);

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    act(() => {
      result.current.loadStatistics();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(result.current.statistics).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch statistics';
    vi.mocked(roomsAPI.getRoomStatistics).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.statistics).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle HTTP error responses', async () => {
    const httpError = {
      response: {
        data: {
          detail: 'Room not found',
        },
      },
    };
    vi.mocked(roomsAPI.getRoomStatistics).mockRejectedValue(httpError);

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.error).toBe('Room not found');
  });

  it('should clear error when clearError is called', async () => {
    vi.mocked(roomsAPI.getRoomStatistics).mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should auto-load statistics when autoLoad is true', async () => {
    vi.mocked(roomsAPI.getRoomStatistics).mockResolvedValue(mockStatistics);

    renderHook(() => useRoomStatistics(mockRoomId, { autoLoad: true }));

    await waitFor(() => {
      expect(roomsAPI.getRoomStatistics).toHaveBeenCalledWith(mockRoomId);
    });
  });

  it('should not auto-load when autoLoad is false', () => {
    vi.mocked(roomsAPI.getRoomStatistics).mockResolvedValue(mockStatistics);

    renderHook(() => useRoomStatistics(mockRoomId, { autoLoad: false }));

    expect(roomsAPI.getRoomStatistics).not.toHaveBeenCalled();
  });

  it('should calculate activity insights correctly', async () => {
    vi.mocked(roomsAPI.getRoomStatistics).mockResolvedValue(mockStatistics);

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.statistics).toEqual(mockStatistics);

    const insights = result.current.getActivityInsights();

    expect(insights.totalEvents).toBe(15);
    expect(insights.mostActiveEventType).toBe('CARD_FLIPPED');
    expect(insights.eventsPerVisitor).toBe(5); // 15 events / 3 visitors
    expect(insights.hasRecentActivity).toBe(true);
  });

  it('should handle empty statistics gracefully', async () => {
    const emptyStats: RoomStatistics = {
      total_events: 0,
      unique_visitors: 0,
      event_breakdown: {},
    };

    vi.mocked(roomsAPI.getRoomStatistics).mockResolvedValue(emptyStats);

    const { result } = renderHook(() => useRoomStatistics(mockRoomId));

    await act(async () => {
      await result.current.loadStatistics();
    });

    expect(result.current.statistics).toEqual(emptyStats);

    const insights = result.current.getActivityInsights();

    expect(insights.totalEvents).toBe(0);
    expect(insights.mostActiveEventType).toBeNull();
    expect(insights.eventsPerVisitor).toBe(0);
    expect(insights.hasRecentActivity).toBe(false);
  });
});

// Component Tests
import { RoomStatisticsCard } from '@/components/rooms/RoomStatisticsCard';

describe('RoomStatisticsCard Component', () => {
  it('should display loading state', () => {
    render(
      <RoomStatisticsCard roomId={mockRoomId} isLoading={true} statistics={null} error={null} />
    );

    expect(screen.getByText('載入統計資料中...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(
      <RoomStatisticsCard
        roomId={mockRoomId}
        isLoading={false}
        statistics={null}
        error="Failed to load statistics"
      />
    );

    expect(screen.getByText('無法載入統計資料')).toBeInTheDocument();
    expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
  });

  it('should display statistics data correctly', () => {
    render(
      <RoomStatisticsCard
        roomId={mockRoomId}
        isLoading={false}
        statistics={mockStatistics}
        error={null}
      />
    );

    expect(screen.getByText('房間統計')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // total_events
    expect(screen.getByText('3')).toBeInTheDocument(); // unique_visitors
    expect(screen.getByText('翻牌次數')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('移動次數')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('筆記次數')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('洞察次數')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display empty state when no data', () => {
    const emptyStats: RoomStatistics = {
      total_events: 0,
      unique_visitors: 0,
      event_breakdown: {},
    };

    render(
      <RoomStatisticsCard
        roomId={mockRoomId}
        isLoading={false}
        statistics={emptyStats}
        error={null}
      />
    );

    expect(screen.getByText('尚無活動記錄')).toBeInTheDocument();
  });

  it('should format last activity time correctly', () => {
    render(
      <RoomStatisticsCard
        roomId={mockRoomId}
        isLoading={false}
        statistics={mockStatistics}
        error={null}
      />
    );

    expect(screen.getByText(/最後活動時間/)).toBeInTheDocument();
  });
});
