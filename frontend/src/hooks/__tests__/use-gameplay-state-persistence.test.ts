import { renderHook, waitFor } from '@testing-library/react';
import { useGameplayStatePersistence } from '../use-gameplay-state-persistence';
import { useGameStateStore } from '@/stores/game-state-store';
import { gameplayStatesAPI } from '@/lib/api/gameplay-states';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/stores/game-state-store');
vi.mock('@/lib/api/gameplay-states');

describe('useGameplayStatePersistence - uploadedFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist uploadedFile to backend for room owner', async () => {
    const mockState = {
      cardPlacements: {
        zone1: ['card1'],
        uploadedFile: {
          name: 'test.pdf',
          url: 'https://storage.supabase.co/test.pdf',
          size: 12345,
          type: 'application/pdf',
          uploadedAt: 1706889600000,
        },
      },
      metadata: { version: 1, lastModified: Date.now() },
    };

    (useGameStateStore as any).mockReturnValue({
      getGameState: vi.fn().mockReturnValue(mockState),
    });

    const mockUpsert = vi.fn().mockResolvedValue({});
    (gameplayStatesAPI.upsertGameplayState as any) = mockUpsert;

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room1',
        gameplayId: 'position_breakdown',
        enabled: true,
      })
    );

    result.current.markDirty();
    await result.current.saveState();

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith('room1', 'position_breakdown', {
        state: expect.objectContaining({
          uploadedFile: mockState.cardPlacements.uploadedFile,
        }),
      });
    });
  });

  it('should load uploadedFile from backend', async () => {
    const mockBackendState = {
      state: {
        cardPlacements: {},
        uploadedFile: {
          name: 'loaded.pdf',
          url: 'https://storage.supabase.co/loaded.pdf',
          size: 54321,
          type: 'application/pdf',
          uploadedAt: 1706889700000,
        },
        metadata: { version: 1 },
      },
      updated_at: new Date().toISOString(),
    };

    (gameplayStatesAPI.getGameplayState as any) = vi
      .fn()
      .mockResolvedValue(mockBackendState);

    const mockSetGameState = vi.fn();
    const mockGetGameState = vi.fn().mockReturnValue({ cardPlacements: {}, metadata: {} });

    (useGameStateStore as any).mockReturnValue({
      getGameState: mockGetGameState,
      setGameState: mockSetGameState,
    });

    // Mock getState() for the loadState function
    (useGameStateStore as any).getState = vi.fn().mockReturnValue({
      setGameState: mockSetGameState,
      getGameState: mockGetGameState,
    });

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room1',
        gameplayId: 'position_breakdown',
        enabled: true,
      })
    );

    await result.current.loadState();

    await waitFor(() => {
      expect(mockSetGameState).toHaveBeenCalledWith(
        'room1',
        'position_breakdown',
        expect.objectContaining({
          cardPlacements: expect.objectContaining({
            uploadedFile: mockBackendState.state.uploadedFile,
          }),
        })
      );
    });
  });

  it('should persist uploadedFile to localStorage for visitors', async () => {
    const mockState = {
      cardPlacements: {
        zone1: ['card1'],
        uploadedFile: {
          name: 'visitor-test.pdf',
          dataUrl: 'data:application/pdf;base64,JVBERi0xLj...',
          size: 9999,
          type: 'application/pdf',
          uploadedAt: 1706889800000,
        },
      },
      metadata: { version: 1, lastModified: Date.now() },
    };

    (useGameStateStore as any).mockReturnValue({
      getGameState: vi.fn().mockReturnValue(mockState),
    });

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room2',
        gameplayId: 'position_breakdown',
        enabled: false, // visitor
      })
    );

    result.current.markDirty();
    await result.current.saveState();

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        'gameplay-state:room2:position_breakdown',
        expect.stringContaining('"uploadedFile"')
      );

      const savedData = JSON.parse(mockSetItem.mock.calls[0][1]);
      expect(savedData.uploadedFile).toEqual(mockState.cardPlacements.uploadedFile);
    });

    mockSetItem.mockRestore();
  });

  it('should load uploadedFile from localStorage for visitors', async () => {
    const mockLocalStorageData = {
      cardPlacements: {},
      uploadedFile: {
        name: 'local.pdf',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLj...',
        size: 7777,
        type: 'application/pdf',
        uploadedAt: 1706889900000,
      },
      metadata: { version: 1, lastModified: Date.now() },
    };

    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem')
      .mockReturnValue(JSON.stringify(mockLocalStorageData));

    const mockSetGameState = vi.fn();
    const mockGetGameState = vi.fn().mockReturnValue({ cardPlacements: {}, metadata: {} });

    (useGameStateStore as any).mockReturnValue({
      getGameState: mockGetGameState,
      setGameState: mockSetGameState,
    });

    // Mock getState() for the loadState function
    (useGameStateStore as any).getState = vi.fn().mockReturnValue({
      setGameState: mockSetGameState,
      getGameState: mockGetGameState,
    });

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room3',
        gameplayId: 'position_breakdown',
        enabled: false, // visitor
      })
    );

    await result.current.loadState();

    await waitFor(() => {
      expect(mockSetGameState).toHaveBeenCalledWith(
        'room3',
        'position_breakdown',
        expect.objectContaining({
          cardPlacements: expect.objectContaining({
            uploadedFile: mockLocalStorageData.uploadedFile,
          }),
        })
      );
    });

    mockGetItem.mockRestore();
  });

  it('should handle missing uploadedFile gracefully', async () => {
    const mockState = {
      cardPlacements: { zone1: ['card1'] },
      metadata: { version: 1, lastModified: Date.now() },
    };

    (useGameStateStore as any).mockReturnValue({
      getGameState: vi.fn().mockReturnValue(mockState),
    });

    const mockUpsert = vi.fn().mockResolvedValue({});
    (gameplayStatesAPI.upsertGameplayState as any) = mockUpsert;

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room4',
        gameplayId: 'position_breakdown',
        enabled: true,
      })
    );

    result.current.markDirty();
    await result.current.saveState();

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith('room4', 'position_breakdown', {
        state: expect.objectContaining({
          cardPlacements: mockState.cardPlacements,
          uploadedFile: null, // Should be null when not present
        }),
      });
    });
  });
});
