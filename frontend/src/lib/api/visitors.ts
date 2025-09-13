/**
 * Visitors API
 * 訪客相關 API
 */
import { apiClient, handleApiError } from './client';

export interface Visitor {
  id: string;
  name: string;
  room_id: string;
  session_id: string;
  is_active: boolean;
  joined_at: string;
  last_seen: string;
}

export interface JoinRoomData {
  name: string;
  room_id: string;
  session_id: string;
}

class VisitorsAPI {
  /**
   * Join a room as visitor
   */
  async joinRoom(data: JoinRoomData): Promise<Visitor> {
    try {
      const response = await apiClient.post<Visitor>('/api/visitors/join', data);

      // Store visitor session
      sessionStorage.setItem(
        'visitor_session',
        JSON.stringify({
          session_id: data.session_id,
          visitor: response.data,
        })
      );

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get visitor by session ID
   */
  async getVisitorBySession(sessionId: string): Promise<Visitor> {
    try {
      const response = await apiClient.get<Visitor>(`/api/visitors/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all visitors in a room
   */
  async getRoomVisitors(roomId: string): Promise<Visitor[]> {
    try {
      const response = await apiClient.get<Visitor[]>(`/api/visitors/room/${roomId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update visitor heartbeat (last_seen)
   */
  async updateHeartbeat(visitorId: string): Promise<void> {
    try {
      await apiClient.patch(`/api/visitors/${visitorId}/heartbeat`);
    } catch (error) {
      console.error('Heartbeat update failed:', error);
      // Don't throw - heartbeat failures shouldn't break the app
    }
  }

  /**
   * Leave room (set visitor as inactive)
   */
  async leaveRoom(visitorId: string): Promise<void> {
    try {
      await apiClient.patch(`/api/visitors/${visitorId}/leave`);
      sessionStorage.removeItem('visitor_session');
    } catch (error) {
      console.error('Leave room failed:', error);
      // Clean up session anyway
      sessionStorage.removeItem('visitor_session');
    }
  }

  /**
   * Generate a unique session ID for visitor
   */
  generateSessionId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored visitor session
   */
  getStoredSession(): { session_id: string; visitor: Visitor } | null {
    const sessionStr = sessionStorage.getItem('visitor_session');
    if (!sessionStr) return null;

    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if visitor is in a room
   */
  isInRoom(): boolean {
    return !!this.getStoredSession();
  }
}

export const visitorsAPI = new VisitorsAPI();
export default visitorsAPI;
