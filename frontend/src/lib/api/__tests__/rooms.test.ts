import { describe, it, expect, beforeEach, vi } from 'vitest';
import { roomsAPI } from '../rooms';
import { apiClient } from '../client';
import type { Room, CreateRoomData } from '../rooms';

// Mock apiClient
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  handleApiError: vi.fn((error) => error?.message || 'Unknown error'),
}));

describe('RoomsAPI', () => {
  const mockRoom: Room = {
    id: 'room-123',
    name: '測試諮詢室',
    description: '測試用諮詢室',
    counselor_id: 'counselor-1',
    share_code: 'ABC123',
    is_active: true,
    created_at: '2025-10-22T00:00:00Z',
    expires_at: '2025-10-29T00:00:00Z',
    session_count: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a new room successfully', async () => {
      // Arrange
      const createData: CreateRoomData = {
        name: '新諮詢室',
        description: '測試描述',
      };
      (apiClient.post as any).mockResolvedValue({ data: mockRoom });

      // Act
      const result = await roomsAPI.createRoom(createData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/rooms/', createData);
      expect(result).toEqual(mockRoom);
    });

    it('should create room with client_id', async () => {
      // Arrange
      const createData: CreateRoomData = {
        name: '客戶諮詢室',
        client_id: 'client-456',
      };
      (apiClient.post as any).mockResolvedValue({ data: mockRoom });

      // Act
      await roomsAPI.createRoom(createData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/rooms/', createData);
    });

    it('should throw error on creation failure', async () => {
      // Arrange
      (apiClient.post as any).mockRejectedValue(new Error('Failed to create room'));

      // Act & Assert
      await expect(roomsAPI.createRoom({ name: 'Test Room' })).rejects.toThrow(
        'Failed to create room'
      );
    });
  });

  describe('getMyRooms', () => {
    it('should get all rooms including inactive', async () => {
      // Arrange
      const rooms = [mockRoom, { ...mockRoom, id: 'room-456', is_active: false }];
      (apiClient.get as any).mockResolvedValue({ data: rooms });

      // Act
      const result = await roomsAPI.getMyRooms(true);

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/', {
        params: { include_inactive: true },
      });
      expect(result).toEqual(rooms);
    });

    it('should get only active rooms when includeInactive is false', async () => {
      // Arrange
      const activeRooms = [mockRoom];
      (apiClient.get as any).mockResolvedValue({ data: activeRooms });

      // Act
      const result = await roomsAPI.getMyRooms(false);

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/', {
        params: { include_inactive: false },
      });
      expect(result).toEqual(activeRooms);
    });
  });

  describe('getRoom', () => {
    it('should get room by ID', async () => {
      // Arrange
      (apiClient.get as any).mockResolvedValue({ data: mockRoom });

      // Act
      const result = await roomsAPI.getRoom('room-123');

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/room-123');
      expect(result).toEqual(mockRoom);
    });

    it('should throw error when room not found', async () => {
      // Arrange
      (apiClient.get as any).mockRejectedValue(new Error('Room not found'));

      // Act & Assert
      await expect(roomsAPI.getRoom('invalid-id')).rejects.toThrow('Room not found');
    });
  });

  describe('getRoomByShareCode', () => {
    it('should get room by share code', async () => {
      // Arrange
      (apiClient.get as any).mockResolvedValue({ data: mockRoom });

      // Act
      const result = await roomsAPI.getRoomByShareCode('ABC123');

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/by-code/ABC123');
      expect(result).toEqual(mockRoom);
    });
  });

  describe('closeRoom', () => {
    it('should close room successfully', async () => {
      // Arrange
      const closedRoom = { ...mockRoom, is_active: false };
      (apiClient.post as any).mockResolvedValue({ data: closedRoom });

      // Act
      const result = await roomsAPI.closeRoom('room-123');

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/rooms/room-123/close');
      expect(result.is_active).toBe(false);
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully', async () => {
      // Arrange
      (apiClient.delete as any).mockResolvedValue({});

      // Act
      await roomsAPI.deleteRoom('room-123');

      // Assert
      expect(apiClient.delete).toHaveBeenCalledWith('/api/rooms/room-123');
    });
  });
});
