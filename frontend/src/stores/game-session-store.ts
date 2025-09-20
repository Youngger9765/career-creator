/**
 * Game Session Store
 * 遊戲會話狀態管理
 */

import { create } from 'zustand';
import { gameSessionsAPI, GameSession, GameStatus, GameAction } from '@/lib/api/game-sessions';
import { GameRule, gameRulesAPI } from '@/lib/api/game-rules';

interface GameSessionState {
  // Current game session
  currentSession: GameSession | null;
  currentRule: GameRule | null;

  // Available game rules
  availableRules: GameRule[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAvailableRules: () => Promise<void>;
  createSession: (roomId: string, gameRuleId: string) => Promise<GameSession>;
  loadSession: (sessionId: string) => Promise<void>;
  loadActiveSession: (roomId: string) => Promise<void>;
  startSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  executeAction: (action: GameAction) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  currentSession: null,
  currentRule: null,
  availableRules: [],
  isLoading: false,
  error: null,

  loadAvailableRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const rules = await gameRulesAPI.list();
      set({ availableRules: rules, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to load game rules',
        isLoading: false,
      });
    }
  },

  createSession: async (roomId: string, gameRuleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await gameSessionsAPI.create({ room_id: roomId, game_rule_id: gameRuleId });

      // Load the game rule for this session
      const rule = await gameRulesAPI.get(gameRuleId);

      set({
        currentSession: session,
        currentRule: rule,
        isLoading: false,
      });

      return session;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create game session',
        isLoading: false,
      });
      throw error;
    }
  },

  loadSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await gameSessionsAPI.get(sessionId);

      // Load the game rule for this session
      const rule = await gameRulesAPI.get(session.game_rule_id);

      set({
        currentSession: session,
        currentRule: rule,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to load game session',
        isLoading: false,
      });
    }
  },

  loadActiveSession: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await gameSessionsAPI.getActiveForRoom(roomId);

      if (session) {
        // Load the game rule for this session
        const rule = await gameRulesAPI.get(session.game_rule_id);

        set({
          currentSession: session,
          currentRule: rule,
          isLoading: false,
        });
      } else {
        set({
          currentSession: null,
          currentRule: null,
          isLoading: false,
        });
      }
    } catch (error: any) {
      // If no active session, this is not an error
      if (error.response?.status === 404) {
        set({
          currentSession: null,
          currentRule: null,
          isLoading: false,
        });
      } else {
        set({
          error: error.response?.data?.detail || 'Failed to load active session',
          isLoading: false,
        });
      }
    }
  },

  startSession: async () => {
    const { currentSession } = get();
    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const updatedSession = await gameSessionsAPI.start(currentSession.id);
      set({
        currentSession: updatedSession,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to start session',
        isLoading: false,
      });
    }
  },

  completeSession: async () => {
    const { currentSession } = get();
    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const updatedSession = await gameSessionsAPI.complete(currentSession.id);
      set({
        currentSession: updatedSession,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to complete session',
        isLoading: false,
      });
    }
  },

  executeAction: async (action: GameAction) => {
    const { currentSession } = get();
    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }

    set({ error: null });
    try {
      const result = await gameSessionsAPI.executeAction(currentSession.id, action);

      if (result.success && result.game_state) {
        // Update the current session with new game state
        set({
          currentSession: {
            ...currentSession,
            game_state: result.game_state,
          },
        });
      } else if (!result.success) {
        set({ error: result.message || 'Action failed' });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to execute action',
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      currentSession: null,
      currentRule: null,
      availableRules: [],
      isLoading: false,
      error: null,
    }),
}));
