import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameSession } from '@/hooks/use-game-session';
import { gameSessionsAPI } from '@/lib/api/game-sessions';

// Mock the API module
vi.mock('@/lib/api/game-sessions', () => ({
  gameSessionsAPI: {
    create: vi.fn(),
    getActiveForRoom: vi.fn(),
    executeAction: vi.fn(),
    start: vi.fn(),
    complete: vi.fn(),
  },
  GameStatus: {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
}));

// Test Factories
const createMockSession = (overrides = {}) => ({
  id: 'session-456',
  room_id: 'test-room-123',
  game_rule_id: 'career_personality',
  status: 'pending',
  game_state: {
    selectedDeck: '職游旅人卡',
    selectedGameRule: '六大性格分析',
    cardPositions: {},
    flippedCards: [],
    gameMode: 'career_personality',
    lastUpdated: new Date().toISOString(),
  },
  ...overrides,
});

const createMockGameState = (overrides = {}) => ({
  selectedDeck: '職游旅人卡',
  selectedGameRule: '六大性格分析',
  cardPositions: {},
  flippedCards: [],
  gameMode: 'career_personality',
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

describe('useGameSession Hook', () => {
  const mockRoomId = 'test-room-123';
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to clean state
    vi.mocked(gameSessionsAPI.create).mockClear();
    vi.mocked(gameSessionsAPI.getActiveForRoom).mockClear();
    vi.mocked(gameSessionsAPI.executeAction).mockClear();
    vi.mocked(gameSessionsAPI.start).mockClear();
    vi.mocked(gameSessionsAPI.complete).mockClear();

    // Create fresh mock session for each test
    mockSession = createMockSession();
  });

  describe('Session Initialization', () => {
    it('should automatically load existing session when autoLoad is true', async () => {
      // Arrange
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);

      // Act - use direct renderHook instead of setupHookTest
      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      // Debug - check initial state
      expect(result.current.isLoading).toBe(true);

      // Wait for async operation to complete
      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      // Assert
      expect(gameSessionsAPI.getActiveForRoom).toHaveBeenCalledWith(mockRoomId);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('should create new session when no active session exists', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockRejectedValue(
        new Error('404: Session not found')
      );
      vi.mocked(gameSessionsAPI.create).mockResolvedValue(mockSession);

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
          gameRuleSlug: 'career_personality',
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      expect(gameSessionsAPI.create).toHaveBeenCalledWith({
        room_id: mockRoomId,
        game_rule_id: 'career_personality',
      });
      expect(result.current.session).toEqual(mockSession);
    });

    it('should not auto-load when autoLoad is false', () => {
      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: false,
        })
      );

      expect(gameSessionsAPI.getActiveForRoom).not.toHaveBeenCalled();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Card Position Management', () => {
    it('should update card position and persist to database', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);
      vi.mocked(gameSessionsAPI.executeAction).mockResolvedValue({
        success: true,
        state: mockSession.state,
      } as any);

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      const cardId = 'card-123';
      const zone = 'advantage';
      const position = { x: 100, y: 200 };

      await act(async () => {
        result.current.updateCardPosition(cardId, zone, position);
      });

      expect(gameSessionsAPI.executeAction).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          type: 'arrange',
          data: expect.objectContaining({
            cardPositions: {
              [cardId]: { zone, position },
            },
          }),
        })
      );
    });

    it('should get card position from state', async () => {
      const cardPositions = {
        'card-123': { zone: 'advantage', position: { x: 100, y: 200 } },
      };

      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue({
        ...mockSession,
        game_state: {
          ...mockSession.game_state,
          cardPositions,
        },
      });

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      const position = result.current.getCardPosition('card-123');
      expect(position).toEqual(cardPositions['card-123']);
    });
  });

  describe('Card Flip State', () => {
    it('should toggle card flip state', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);
      vi.mocked(gameSessionsAPI.executeAction).mockResolvedValue({
        success: true,
        state: mockSession.state,
      } as any);

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      const cardId = 'card-456';

      // First flip - card should be added to flipped cards
      await act(async () => {
        result.current.toggleCardFlip(cardId);
      });

      expect(gameSessionsAPI.executeAction).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          type: 'arrange',
          data: expect.objectContaining({
            flippedCards: [cardId],
          }),
        })
      );
    });

    it('should check if card is flipped', async () => {
      const flippedCards = ['card-123', 'card-456'];

      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue({
        ...mockSession,
        game_state: {
          ...mockSession.game_state,
          flippedCards,
        },
      });

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      expect(result.current.isCardFlipped('card-123')).toBe(true);
      expect(result.current.isCardFlipped('card-789')).toBe(false);
    });
  });

  describe('Game Mode Updates', () => {
    it('should update game mode, deck, and rule simultaneously', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);
      vi.mocked(gameSessionsAPI.executeAction).mockResolvedValue({
        success: true,
        state: mockSession.state,
      } as any);

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      const newDeck = '職能盤點卡';
      const newRule = '優劣勢分析';
      const newMode = 'skill_assessment';

      await act(async () => {
        result.current.updateGameMode(newDeck, newRule, newMode);
      });

      expect(gameSessionsAPI.executeAction).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          type: 'arrange',
          data: expect.objectContaining({
            selectedDeck: newDeck,
            selectedGameRule: newRule,
            gameMode: newMode,
          }),
        })
      );
    });
  });

  describe('State Reset', () => {
    it('should reset game state to initial values', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);
      vi.mocked(gameSessionsAPI.executeAction).mockResolvedValue({
        success: true,
        state: mockSession.state,
      } as any);

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      await act(async () => {
        result.current.resetGameState();
      });

      expect(gameSessionsAPI.executeAction).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          type: 'arrange',
          data: expect.objectContaining({
            cardPositions: {},
            flippedCards: [],
          }),
        })
      );
    });
  });

  describe('Session Lifecycle', () => {
    it('should start a pending session', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue(mockSession);
      vi.mocked(gameSessionsAPI.start).mockResolvedValue({
        ...mockSession,
        status: 'active',
      });

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      await act(async () => {
        await result.current.startSession();
      });

      expect(gameSessionsAPI.start).toHaveBeenCalledWith(mockSession.id);
    });

    it('should complete an active session', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockResolvedValue({
        ...mockSession,
        status: 'active',
      });
      vi.mocked(gameSessionsAPI.complete).mockResolvedValue({
        ...mockSession,
        status: 'completed',
      });

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      await act(async () => {
        await result.current.completeSession();
      });

      expect(gameSessionsAPI.complete).toHaveBeenCalledWith(mockSession.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.isLoading === false;
          },
          { timeout: 3000 }
        );
      });

      expect(result.current.error).toContain(errorMessage);
      expect(result.current.session).toBeNull();
    });

    it('should clear errors when requested', async () => {
      vi.mocked(gameSessionsAPI.getActiveForRoom).mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() =>
        useGameSession({
          roomId: mockRoomId,
          autoLoad: true,
        })
      );

      await act(async () => {
        await vi.waitFor(
          () => {
            return result.current.error !== null;
          },
          { timeout: 3000 }
        );
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
