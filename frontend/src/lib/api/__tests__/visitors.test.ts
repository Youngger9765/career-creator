import { describe, it, expect, beforeEach, vi } from 'vitest';
import { visitorsAPI } from '../visitors';
import { apiClient } from '../client';
import type { Visitor } from '../visitors';

// Mock apiClient and rooms
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
  handleApiError: vi.fn((error) => error?.message || 'Unknown error'),
}));

vi.mock('../rooms', () => ({
  roomsAPI: {
    getRoom: vi.fn().mockResolvedValue({ share_code: 'ABC123' }),
  },
}));

describe('VisitorsAPI', () => {
  const mockVisitor: Visitor = {
    id: 'visitor-1',
    name: '訪客小明',
    room_id: 'room-123',
    session_id: 'session-456',
    is_active: true,
    joined_at: '2025-10-22T00:00:00Z',
    last_seen: '2025-10-22T01:00:00Z',
    created_at: '2025-10-22T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('joinRoom', () => {
    it('should join room and store session', async () => {
      // Arrange
      (apiClient.post as any).mockResolvedValue({ data: mockVisitor });

      // Act
      const result = await visitorsAPI.joinRoom({
        name: '訪客小明',
        room_id: 'room-123',
        session_id: 'session-456',
      });

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/visitors/join-room/ABC123', {
        name: '訪客小明',
        room_id: 'room-123',
        session_id: 'session-456',
      });
      expect(result).toEqual(mockVisitor);
      expect(sessionStorage.getItem('visitor_session')).toBeTruthy();
    });
  });

  describe('getVisitorBySession', () => {
    it('should get visitor by session ID', async () => {
      // Arrange
      (apiClient.get as any).mockResolvedValue({ data: mockVisitor });

      // Act
      const result = await visitorsAPI.getVisitorBySession('session-456');

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/visitors/session/session-456');
      expect(result).toEqual(mockVisitor);
    });
  });

  describe('getRoomVisitors', () => {
    it('should get all visitors in a room', async () => {
      // Arrange
      const visitors = [mockVisitor, { ...mockVisitor, id: 'visitor-2', name: '訪客小華' }];
      (apiClient.get as any).mockResolvedValue({ data: visitors });

      // Act
      const result = await visitorsAPI.getRoomVisitors('room-123');

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/visitors/room/room-123');
      expect(result).toHaveLength(2);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update visitor heartbeat', async () => {
      // Arrange
      (apiClient.patch as any).mockResolvedValue({});

      // Act
      await visitorsAPI.updateHeartbeat('visitor-1');

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith('/api/visitors/visitor-1/heartbeat');
    });

    it('should not throw error on heartbeat failure', async () => {
      // Arrange
      (apiClient.patch as any).mockRejectedValue(new Error('Network error'));

      // Act & Assert - should not throw
      await expect(visitorsAPI.updateHeartbeat('visitor-1')).resolves.toBeUndefined();
    });
  });

  describe('leaveRoom', () => {
    it('should leave room and clear session', async () => {
      // Arrange
      sessionStorage.setItem('visitor_session', JSON.stringify({ session_id: 'test' }));
      (apiClient.patch as any).mockResolvedValue({});

      // Act
      await visitorsAPI.leaveRoom('visitor-1');

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith('/api/visitors/visitor-1/leave');
      expect(sessionStorage.getItem('visitor_session')).toBeNull();
    });

    it('should clear session even if API fails', async () => {
      // Arrange
      sessionStorage.setItem('visitor_session', JSON.stringify({ session_id: 'test' }));
      (apiClient.patch as any).mockRejectedValue(new Error('API error'));

      // Act
      await visitorsAPI.leaveRoom('visitor-1');

      // Assert
      expect(sessionStorage.getItem('visitor_session')).toBeNull();
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      // Act
      const id1 = visitorsAPI.generateSessionId();
      const id2 = visitorsAPI.generateSessionId();

      // Assert
      expect(id1).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getStoredSession', () => {
    it('should return stored session', () => {
      // Arrange
      const session = { session_id: 'session-456', visitor: mockVisitor };
      sessionStorage.setItem('visitor_session', JSON.stringify(session));

      // Act
      const result = visitorsAPI.getStoredSession();

      // Assert
      expect(result).toEqual(session);
    });

    it('should return null when no session', () => {
      // Act
      const result = visitorsAPI.getStoredSession();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when session is invalid JSON', () => {
      // Arrange
      sessionStorage.setItem('visitor_session', 'invalid-json{');

      // Act
      const result = visitorsAPI.getStoredSession();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isInRoom', () => {
    it('should return true when visitor has session', () => {
      // Arrange
      sessionStorage.setItem('visitor_session', JSON.stringify({ session_id: 'test' }));

      // Act & Assert
      expect(visitorsAPI.isInRoom()).toBe(true);
    });

    it('should return false when no session', () => {
      // Act & Assert
      expect(visitorsAPI.isInRoom()).toBe(false);
    });
  });
});
