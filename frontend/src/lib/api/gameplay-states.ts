/**
 * Gameplay States API
 * 遊戲狀態持久化 API
 */
import { apiClient, handleApiError } from './client';

export interface GameplayState {
  id: string;
  room_id: string;
  gameplay_id: string;
  state: Record<string, any>;
  last_played_at: string;
  created_at: string;
  updated_at: string;
}

export interface GameplayStateUpdate {
  state: Record<string, any>;
}

export interface RoomGameplayStatesResponse {
  states: GameplayState[];
  summary: {
    total_gameplays_played: number;
    most_recent_gameplay: string | null;
    last_played_at: string | null;
  };
}

class GameplayStatesAPI {
  /**
   * Get all gameplay states for a room
   */
  async getRoomGameplayStates(roomId: string): Promise<RoomGameplayStatesResponse> {
    try {
      const response = await apiClient.get<RoomGameplayStatesResponse>(
        `/api/rooms/${roomId}/gameplay-states`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get specific gameplay state
   * Returns null if not found (404)
   */
  async getGameplayState(roomId: string, gameplayId: string): Promise<GameplayState | null> {
    try {
      const response = await apiClient.get<GameplayState>(
        `/api/rooms/${roomId}/gameplay-states/${gameplayId}`
      );
      return response.data;
    } catch (error: any) {
      // 404 is expected for new gameplay - return null instead of throwing
      if (error?.response?.status === 404) {
        return null;
      }
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create or update gameplay state (upsert)
   */
  async upsertGameplayState(
    roomId: string,
    gameplayId: string,
    stateUpdate: GameplayStateUpdate
  ): Promise<GameplayState> {
    try {
      const response = await apiClient.put<GameplayState>(
        `/api/rooms/${roomId}/gameplay-states/${gameplayId}`,
        stateUpdate
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete specific gameplay state
   */
  async deleteGameplayState(roomId: string, gameplayId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/rooms/${roomId}/gameplay-states/${gameplayId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const gameplayStatesAPI = new GameplayStatesAPI();
export default gameplayStatesAPI;
