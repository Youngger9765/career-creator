/**
 * Rooms API
 * 房間相關 API
 */
import { apiClient, handleApiError } from './client';

export interface Room {
  id: string;
  name: string;
  description?: string;
  counselor_id: string;
  share_code: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateRoomData {
  name: string;
  description?: string;
}

export interface RoomStatistics {
  total_events: number;
  unique_visitors: number;
  last_activity?: string;
  event_breakdown: Record<string, number>;
}

class RoomsAPI {
  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomData): Promise<Room> {
    try {
      const response = await apiClient.post<Room>('/api/rooms/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all rooms for current counselor
   */
  async getMyRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get<Room[]>('/api/rooms/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<Room> {
    try {
      const response = await apiClient.get<Room>(`/api/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get room by share code
   */
  async getRoomByShareCode(shareCode: string): Promise<Room> {
    try {
      const response = await apiClient.get<Room>(`/api/rooms/by-code/${shareCode}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update room
   */
  async updateRoom(roomId: string, data: Partial<CreateRoomData>): Promise<Room> {
    try {
      const response = await apiClient.put<Room>(`/api/rooms/${roomId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete room (soft delete - sets is_active to false)
   */
  async deleteRoom(roomId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/rooms/${roomId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get room statistics
   */
  async getRoomStatistics(roomId: string): Promise<RoomStatistics> {
    try {
      const response = await apiClient.get<RoomStatistics>(`/api/rooms/${roomId}/statistics`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Generate share link for room
   */
  generateShareLink(shareCode: string): string {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${shareCode}`;
  }

  /**
   * Generate QR code URL for room
   */
  generateQRCodeUrl(shareCode: string): string {
    const shareLink = this.generateShareLink(shareCode);
    const encodedUrl = encodeURIComponent(shareLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
  }
}

export const roomsAPI = new RoomsAPI();
export default roomsAPI;
