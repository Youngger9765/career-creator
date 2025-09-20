/**
 * Game Session hook for managing room game state persistence
 * 遊戲會話管理 Hook - 負責房間遊戲狀態持久化
 */
import { useState, useCallback, useEffect } from 'react';
import { gameSessionsAPI, GameSession, GameStatus, GameAction } from '@/lib/api/game-sessions';

interface UseGameSessionOptions {
  roomId: string;
  autoLoad?: boolean;
  gameRuleSlug?: string;
}

interface GameState {
  selectedDeck: string;
  selectedGameRule: string;
  cardPositions: Record<string, { zone: string; position: { x: number; y: number } }>;
  flippedCards: string[];
  gameMode: string;
  lastUpdated: string;
}

export function useGameSession({ roomId, autoLoad = true, gameRuleSlug }: UseGameSessionOptions) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    selectedDeck: '職游旅人卡',
    selectedGameRule: '六大性格分析',
    cardPositions: {},
    flippedCards: [],
    gameMode: 'career_personality',
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load or create game session
  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get active session for room
      let activeSession;
      try {
        activeSession = await gameSessionsAPI.getActiveForRoom(roomId);
      } catch (err: any) {
        // No active session found, create new one
        if (err.message.includes('404') || err.message.includes('not found')) {
          // Create new session
          activeSession = await gameSessionsAPI.create({
            room_id: roomId,
            game_rule_id: gameRuleSlug || 'career_personality', // Default rule
          });
        } else {
          throw err;
        }
      }

      setSession(activeSession);

      // Load game state from session
      if (activeSession.game_state) {
        setGameState((prevState) => ({
          ...prevState,
          ...activeSession.game_state,
        }));
      }
    } catch (err: any) {
      setError(`Failed to initialize session: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, gameRuleSlug]);

  // Save game state to session
  const saveGameState = useCallback(
    async (newState: Partial<GameState>) => {
      if (!session) return;

      setGameState((prevState) => {
        const updatedState = {
          ...prevState,
          ...newState,
          lastUpdated: new Date().toISOString(),
        };

        // Execute update action asynchronously without blocking state update
        gameSessionsAPI
          .executeAction(session.id, {
            action_type: 'arrange',
            action_data: updatedState,
            player_id: 'demo-counselor-001', // TODO: Get from auth context
            player_role: 'counselor',
          })
          .catch((err) => {
            setError(`Failed to save state: ${err.message}`);
          });

        return updatedState;
      });
    },
    [session]
  );

  // Update card position
  const updateCardPosition = useCallback(
    (cardId: string, zone: string, position: { x: number; y: number }) => {
      saveGameState({
        cardPositions: {
          ...gameState.cardPositions,
          [cardId]: { zone, position },
        },
      });
    },
    [saveGameState]
  );

  // Toggle card flip state
  const toggleCardFlip = useCallback(
    (cardId: string) => {
      const newFlippedCards = gameState.flippedCards.includes(cardId)
        ? gameState.flippedCards.filter((id) => id !== cardId)
        : [...gameState.flippedCards, cardId];

      saveGameState({
        flippedCards: newFlippedCards,
      });
    },
    [saveGameState]
  );

  // Update deck and game rule
  const updateGameMode = useCallback(
    (deck: string, gameRule: string, mode: string) => {
      saveGameState({
        selectedDeck: deck,
        selectedGameRule: gameRule,
        gameMode: mode,
      });
    },
    [saveGameState]
  );

  // Reset game state
  const resetGameState = useCallback(() => {
    saveGameState({
      cardPositions: {},
      flippedCards: [],
      lastUpdated: new Date().toISOString(),
    });
  }, [saveGameState]);

  // Start session
  const startSession = useCallback(async () => {
    if (!session) return;

    try {
      const startedSession = await gameSessionsAPI.start(session.id);
      setSession(startedSession);
    } catch (err: any) {
      setError(`Failed to start session: ${err.message}`);
    }
  }, [session]);

  // Complete session
  const completeSession = useCallback(async () => {
    if (!session) return;

    try {
      const completedSession = await gameSessionsAPI.complete(session.id);
      setSession(completedSession);
    } catch (err: any) {
      setError(`Failed to complete session: ${err.message}`);
    }
  }, [session]);

  // Get card position
  const getCardPosition = (cardId: string) => {
    return gameState.cardPositions[cardId] || null;
  };

  // Check if card is flipped
  const isCardFlipped = (cardId: string) => {
    return gameState.flippedCards.includes(cardId);
  };

  // Auto-load session on mount
  useEffect(() => {
    if (autoLoad && roomId) {
      initializeSession();
    }
  }, [autoLoad, roomId]); // Remove initializeSession from dependencies

  return {
    session,
    gameState,
    isLoading,
    error,

    // Session management
    initializeSession,
    startSession,
    completeSession,

    // State management
    saveGameState,
    updateCardPosition,
    toggleCardFlip,
    updateGameMode,
    resetGameState,

    // Queries
    getCardPosition,
    isCardFlipped,

    // Utils
    clearError: () => setError(null),
  };
}
