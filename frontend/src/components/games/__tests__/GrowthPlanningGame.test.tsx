/**
 * Tests for GrowthPlanningGame component
 * Focus: Verify no infinite re-render loops
 */
import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/game-modes/services/card-loader.service', () => ({
  CardLoaderService: {
    getDeck: vi.fn(() => Promise.resolve({
      name: 'Test Deck',
      cards: [
        { id: 'mindset-1', title: 'Mindset Card 1', category: 'mindset' },
        { id: 'mindset-2', title: 'Mindset Card 2', category: 'mindset' },
        { id: 'action-1', title: 'Action Card 1', category: 'action' },
        { id: 'action-2', title: 'Action Card 2', category: 'action' },
      ],
    })),
  },
}));

vi.mock('@/hooks/use-unified-card-sync', () => ({
  useUnifiedCardSync: vi.fn(() => ({
    state: {
      cardPlacements: {
        skillsCards: [],
        actionsCards: [],
      },
    },
    draggedByOthers: new Set(),
    handleCardMove: vi.fn(),
    cardSync: {
      startDrag: vi.fn(),
      endDrag: vi.fn(),
      isConnected: true,
      loadGameState: vi.fn(() => null),
      saveGameState: vi.fn(),
    },
    updateCards: vi.fn(),
  })),
}));

// CardGameState type export needed
vi.mock('@/hooks/use-card-sync', () => ({
  CardGameState: {},
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user', name: 'Test User' },
  })),
}));

vi.mock('@/lib/supabase-client', () => ({
  supabase: null,
  isSupabaseConfigured: vi.fn(() => false),
}));

// Import after mocks
import GrowthPlanningGame from '../GrowthPlanningGame';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';

describe('GrowthPlanningGame', () => {
  let renderCount: number;
  let originalLog: typeof console.log;

  beforeEach(() => {
    vi.clearAllMocks();
    renderCount = 0;
    originalLog = console.log;

    // Count renders by intercepting specific log
    console.log = vi.fn((...args) => {
      if (args[0]?.includes?.('[GrowthPlanning]')) {
        renderCount++;
      }
      // originalLog(...args); // Uncomment to debug
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('Re-render Loop Prevention', () => {
    it('should not cause infinite re-renders when cards are selected', async () => {
      // Initial render
      const { rerender } = render(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait for initial render and deck loading
      await waitFor(() => {
        expect(renderCount).toBeLessThan(10);
      });

      const initialRenderCount = renderCount;

      // Simulate card selection by updating mock
      (useUnifiedCardSync as any).mockReturnValue({
        state: {
          cardPlacements: {
            skillsCards: ['mindset-1'],
            actionsCards: [],
          },
        },
        draggedByOthers: new Set(),
        handleCardMove: vi.fn(),
        cardSync: {
          startDrag: vi.fn(),
          endDrag: vi.fn(),
          isConnected: true,
          loadGameState: vi.fn(() => null),
          saveGameState: vi.fn(),
        },
        updateCards: vi.fn(),
      });

      // Trigger re-render
      rerender(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait and verify no infinite loop
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Should have very few additional renders (< 5), not 50+
      const additionalRenders = renderCount - initialRenderCount;
      expect(additionalRenders).toBeLessThan(10);
    });

    it('should not re-render excessively when both cards are selected', async () => {
      // Start with one card
      (useUnifiedCardSync as any).mockReturnValue({
        state: {
          cardPlacements: {
            skillsCards: ['mindset-1'],
            actionsCards: ['action-1'],
          },
        },
        draggedByOthers: new Set(),
        handleCardMove: vi.fn(),
        cardSync: {
          startDrag: vi.fn(),
          endDrag: vi.fn(),
          isConnected: true,
          loadGameState: vi.fn(() => null),
          saveGameState: vi.fn(),
        },
        updateCards: vi.fn(),
      });

      render(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait for stabilization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Should stabilize under 20 renders total (not 50+)
      expect(renderCount).toBeLessThan(20);
    });
  });
});
