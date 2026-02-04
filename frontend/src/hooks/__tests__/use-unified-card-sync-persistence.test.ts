/**
 * Test: Owner should persist visitor's card moves to DB
 *
 * When visitor moves a card:
 * 1. Visitor broadcasts via Realtime
 * 2. Owner receives the broadcast
 * 3. Owner's state updates
 * 4. Owner should markDirty() → save to DB
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the hook
vi.mock('@/lib/supabase-client', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 'owner-123', name: 'Test Owner' },
  }),
}));

vi.mock('@/stores/game-state-store', () => ({
  useGameState: vi.fn(() => ({
    state: {
      cardPlacements: {
        likeCards: [],
        neutralCards: [],
        dislikeCards: [],
      },
      metadata: { version: 1 },
    },
    updateCards: vi.fn(),
  })),
  useGameStateStore: {
    getState: () => ({
      getGameState: vi.fn(() => ({
        cardPlacements: {},
        metadata: {},
      })),
      setGameState: vi.fn(),
    }),
  },
}));

// Create mock for persistence
const mockMarkDirty = vi.fn();
const mockSaveState = vi.fn();

vi.mock('../use-gameplay-state-persistence', () => ({
  useGameplayStatePersistence: vi.fn(() => ({
    isLoading: false,
    lastSavedAt: null,
    error: null,
    saveState: mockSaveState,
    loadState: vi.fn(),
    markDirty: mockMarkDirty,
  })),
}));

// Mock useCardSync to capture the onCardMove callback
let capturedOnCardMove: ((event: any) => void) | null = null;

vi.mock('../use-card-sync', () => ({
  useCardSync: vi.fn((options: any) => {
    capturedOnCardMove = options.onCardMove;
    return {
      isConnected: true,
      moveCard: vi.fn(),
      startDrag: vi.fn(),
      endDrag: vi.fn(),
      uploadFile: vi.fn(),
      loadGameState: vi.fn(),
      saveGameState: vi.fn(),
      error: null,
      channelRef: { current: null },
    };
  }),
}));

import { useUnifiedCardSync } from '../use-unified-card-sync';
import { useGameState } from '@/stores/game-state-store';

describe('useUnifiedCardSync - Owner persists visitor moves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnCardMove = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call markDirty when owner receives remote card move from visitor', async () => {
    // Setup: Owner is in the room
    const { result } = renderHook(() =>
      useUnifiedCardSync({
        roomId: 'room-123',
        gameType: 'personality_assessment',
        storeKey: 'personality_assessment',
        isRoomOwner: true, // Owner
        zones: ['like', 'neutral', 'dislike'],
      })
    );

    // Verify hook initialized
    expect(result.current).toBeDefined();
    expect(capturedOnCardMove).not.toBeNull();

    // Simulate: Visitor moves a card (Owner receives this via Realtime)
    const remoteCardMoveEvent = {
      cardId: 'card-001',
      fromZone: 'deck',
      toZone: 'like',
      performedBy: 'visitor',
      performerId: 'visitor-456',
      performerName: 'Test Visitor',
      timestamp: Date.now(),
    };

    // Act: Trigger the onCardMove callback (simulating Realtime broadcast receipt)
    act(() => {
      capturedOnCardMove!(remoteCardMoveEvent);
    });

    // Assert: Owner should mark dirty to persist visitor's move
    expect(mockMarkDirty).toHaveBeenCalled();
  });

  it('should call markDirty when owner moves card locally', async () => {
    const mockUpdateCards = vi.fn();
    (useGameState as any).mockReturnValue({
      state: {
        cardPlacements: {
          likeCards: [],
          neutralCards: [],
          dislikeCards: [],
        },
        metadata: { version: 1 },
      },
      updateCards: mockUpdateCards,
    });

    const { result } = renderHook(() =>
      useUnifiedCardSync({
        roomId: 'room-123',
        gameType: 'personality_assessment',
        storeKey: 'personality_assessment',
        isRoomOwner: true,
        zones: ['like', 'neutral', 'dislike'],
      })
    );

    // Act: Owner moves a card locally
    act(() => {
      result.current.handleCardMove('card-002', 'neutral', true);
    });

    // Assert: Should mark dirty for local moves
    expect(mockMarkDirty).toHaveBeenCalled();
  });

  it('should NOT call markDirty when visitor receives remote move (visitor uses localStorage only)', async () => {
    // Reset mocks
    mockMarkDirty.mockClear();

    // Setup: Visitor is in the room
    const { result } = renderHook(() =>
      useUnifiedCardSync({
        roomId: 'room-123',
        gameType: 'personality_assessment',
        storeKey: 'personality_assessment',
        isRoomOwner: false, // Visitor
        zones: ['like', 'neutral', 'dislike'],
      })
    );

    // Verify hook initialized
    expect(capturedOnCardMove).not.toBeNull();

    // Simulate: Owner moves a card (Visitor receives this via Realtime)
    const remoteCardMoveEvent = {
      cardId: 'card-001',
      fromZone: 'deck',
      toZone: 'like',
      performedBy: 'owner',
      performerId: 'owner-123',
      performerName: 'Test Owner',
      timestamp: Date.now(),
    };

    // Act: Trigger the onCardMove callback
    act(() => {
      capturedOnCardMove!(remoteCardMoveEvent);
    });

    // Assert: Visitor should NOT mark dirty for remote moves
    // (Visitor syncs from owner, doesn't need to persist owner's moves)
    expect(mockMarkDirty).not.toHaveBeenCalled();
  });
});
