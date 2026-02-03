/**
 * Tests for useGameModeSync hook
 * 測試遊戲模式同步 Hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameModeSync } from '../use-game-mode-sync';
import { supabase } from '@/lib/supabase-client';
import { DECK_TYPES } from '@/constants/game-modes';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    channel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('useGameModeSync', () => {
  let mockChannel: any;
  let mockListeners: Map<string, Function[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListeners = new Map();

    // Create mock channel with event emission capability
    mockChannel = {
      on: vi.fn((type: string, config: any, callback: Function) => {
        const event = config.event || 'default';
        const key = `${type}:${event}`;
        if (!mockListeners.has(key)) {
          mockListeners.set(key, []);
        }
        mockListeners.get(key)?.push(callback);
        return mockChannel;
      }),
      subscribe: vi.fn((callback: Function) => {
        setTimeout(() => callback('SUBSCRIBED', null), 0);
        return Promise.resolve();
      }),
      send: vi.fn(() => Promise.resolve()),
      track: vi.fn(() => Promise.resolve()),
      unsubscribe: vi.fn(),
      presenceState: vi.fn(() => ({})),
    };

    (supabase.channel as any).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    mockListeners.clear();
  });

  // Helper to emit events
  const emitEvent = (type: string, event: string, payload: any) => {
    const key = `${type}:${event}`;
    const listeners = mockListeners.get(key) || [];
    listeners.forEach((callback) => callback({ payload }));
  };

  describe('Visitor joining after counselor selected game mode', () => {
    it('visitor should receive current game state when owner responds to request_state', async () => {
      // Scenario: Counselor已經選擇了「六大性格分析」玩法
      const counselorState = {
        deck: DECK_TYPES.TRAVELER,
        gameRule: '六大性格分析',
        gameMode: 'personality_assessment',
      };

      // Step 1: Counselor (owner) sets up channel first
      const { result: ownerResult } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: true,
        })
      );

      // Wait for owner channel to be ready
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      // Step 2: Owner selects game mode
      act(() => {
        ownerResult.current.changeGameMode(
          counselorState.deck,
          counselorState.gameRule,
          counselorState.gameMode
        );
      });

      // Step 3: Visitor joins and subscribes
      const { result: visitorResult } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: false,
        })
      );

      // Wait for visitor channel to be ready
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
      });

      // Step 4: Simulate visitor requesting current state (auto-triggered on subscribe)
      act(() => {
        emitEvent('broadcast', 'request_state', { timestamp: new Date().toISOString() });
      });

      // Step 5: Owner should respond with current state
      // This is the critical part - owner's listener should have the LATEST syncedState
      await waitFor(() => {
        expect(mockChannel.send).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'current_state',
            payload: counselorState,
          })
        );
      });

      // Step 6: Visitor receives current state
      act(() => {
        emitEvent('broadcast', 'current_state', counselorState);
      });

      // Step 7: Verify visitor has the correct state
      await waitFor(() => {
        expect(visitorResult.current.syncedState).toEqual(counselorState);
        expect(visitorResult.current.syncedState.gameMode).toBe('personality_assessment');
      });
    });

    it('visitor should not stay in waiting state when counselor already selected game', async () => {
      // This test verifies the user-facing behavior
      const counselorState = {
        deck: DECK_TYPES.TRAVELER,
        gameRule: '六大性格分析',
        gameMode: 'personality_assessment',
      };

      // Owner setup
      const { result: ownerResult } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: true,
        })
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

      // Owner selects game
      act(() => {
        ownerResult.current.changeGameMode(
          counselorState.deck,
          counselorState.gameRule,
          counselorState.gameMode
        );
      });

      // Visitor joins
      const { result: visitorResult } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: false,
        })
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalledTimes(2));

      // Request and receive state
      act(() => {
        emitEvent('broadcast', 'request_state', { timestamp: new Date().toISOString() });
      });

      act(() => {
        emitEvent('broadcast', 'current_state', counselorState);
      });

      // Verify visitor is NOT in waiting state (gameMode should not be empty)
      await waitFor(() => {
        expect(visitorResult.current.syncedState.gameMode).not.toBe('');
        expect(visitorResult.current.syncedState.gameMode).toBe('personality_assessment');
      });
    });
  });

  describe('Presence tracking independence', () => {
    it('ownerOnline should remain false when internal presence tracking is removed', async () => {
      // This test documents expected behavior after removing duplicate Presence tracking
      // ownerOnline from useGameModeSync is already overwritten by usePresence in GameModeIntegration.tsx
      const { result } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: false,
        })
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

      // ownerOnline should be false (default) since we're removing internal presence tracking
      // The actual owner online status comes from usePresence hook
      expect(result.current.ownerOnline).toBe(false);
    });

    it('game mode sync should work independently from presence tracking', async () => {
      // Core functionality: game mode sync should work without relying on presence
      const newState = {
        deck: DECK_TYPES.SKILLS,
        gameRule: '優劣勢分析',
        gameMode: 'advantage_analysis',
      };

      const { result } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: false,
        })
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

      // Receive mode change (this is the core functionality)
      act(() => {
        emitEvent('broadcast', 'mode_changed', newState);
      });

      // Verify mode sync works
      await waitFor(() => {
        expect(result.current.syncedState).toEqual(newState);
      });

      // Verify connected state (channel, not presence)
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Game mode change synchronization', () => {
    it('visitor receives updates when counselor changes game mode', async () => {
      // This test verifies the working scenario (mode_changed broadcast)
      const newState = {
        deck: DECK_TYPES.SKILLS,
        gameRule: '優劣勢分析',
        gameMode: 'advantage_analysis',
      };

      const { result: visitorResult } = renderHook(() =>
        useGameModeSync({
          roomId: 'test-room',
          isOwner: false,
        })
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

      // Counselor changes mode (broadcasts mode_changed)
      act(() => {
        emitEvent('broadcast', 'mode_changed', newState);
      });

      // Visitor should receive the update
      await waitFor(() => {
        expect(visitorResult.current.syncedState).toEqual(newState);
      });
    });
  });
});
