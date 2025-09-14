/**
 * Game Sessions API Client
 * 遊戲會話 API 客戶端
 */

import { apiClient } from './client';

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface GameSession {
  id: string;
  room_id: string;
  game_rule_id: string;
  status: GameStatus;
  game_state: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface GameSessionCreate {
  room_id: string;
  game_rule_id: string;
}

export interface GameAction {
  type: 'place_card' | 'flip' | 'move' | 'arrange' | 'annotate';
  card_id?: string;
  target_zone?: string;
  position?: { x: number; y: number };
  data?: any;
}

export interface GameActionResponse {
  success: boolean;
  game_state?: any;
  error_message?: string;
}

export const gameSessionsAPI = {
  // Create a new game session
  create: async (data: GameSessionCreate) => {
    const response = await apiClient.post('/api/game-sessions/', data);
    return response.data;
  },

  // Get game session by ID
  get: async (sessionId: string) => {
    const response = await apiClient.get(`/api/game-sessions/${sessionId}`);
    return response.data;
  },

  // Get active session for a room
  getActiveForRoom: async (roomId: string) => {
    const response = await apiClient.get(`/api/game-sessions/room/${roomId}/active`);
    return response.data;
  },

  // Start a game session
  start: async (sessionId: string) => {
    const response = await apiClient.post(`/api/game-sessions/${sessionId}/start`);
    return response.data;
  },

  // Complete a game session
  complete: async (sessionId: string) => {
    const response = await apiClient.post(`/api/game-sessions/${sessionId}/complete`);
    return response.data;
  },

  // Execute a game action
  executeAction: async (sessionId: string, action: GameAction) => {
    const response = await apiClient.post<GameActionResponse>(
      `/api/game-sessions/${sessionId}/actions`,
      action
    );
    return response.data;
  },

  // Get action history
  getActionHistory: async (sessionId: string) => {
    const response = await apiClient.get(`/api/game-sessions/${sessionId}/actions`);
    return response.data;
  },
};