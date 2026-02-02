/**
 * Test: File Upload Synchronization
 *
 * Ensures that file uploads are broadcasted to all users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedCardSync } from '../use-unified-card-sync';
import { useCardSync } from '../use-card-sync';
import { useAuthStore } from '@/stores/auth-store';
import { useGameState } from '@/stores/game-state-store';

const mockMarkDirty = vi.fn();

// Mock dependencies
vi.mock('../use-card-sync');
vi.mock('@/stores/auth-store');
vi.mock('@/stores/game-state-store');
vi.mock('../use-gameplay-state-persistence', () => ({
  useGameplayStatePersistence: () => ({
    markDirty: mockMarkDirty,
    saveState: vi.fn(),
    loadState: vi.fn(),
    isLoading: false,
    lastSavedAt: null,
    error: null,
  }),
}));

describe('useUnifiedCardSync - File Upload Synchronization', () => {
  const mockCardSyncReturn = {
    draggedCards: new Map(),
    moveCard: vi.fn(),
    startDrag: vi.fn(),
    endDrag: vi.fn(),
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    isConnected: true,
    error: null,
    channelRef: { current: null },
    uploadFile: vi.fn(), // NEW: mock file upload broadcast
  };

  const mockState = {
    cardPlacements: {},
  };

  const mockUpdateCards = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCardSync).mockReturnValue(mockCardSyncReturn);
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1', name: 'Test User' },
    } as any);
    vi.mocked(useGameState).mockReturnValue({
      state: mockState,
      updateCards: mockUpdateCards,
    } as any);
  });

  it('should broadcast file upload to other users', async () => {
    const { result } = renderHook(() =>
      useUnifiedCardSync({
        roomId: 'test-room',
        gameType: 'position_breakdown',
        storeKey: 'position_breakdown',
        isRoomOwner: true,
        zones: ['position'],
      })
    );

    // Simulate file upload
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockFileData = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: mockFile.size,
      dataUrl: 'data:application/pdf;base64,dGVzdCBjb250ZW50',
      uploadedAt: Date.now(),
    };

    await act(async () => {
      // This should update local state AND broadcast
      result.current.handleFileUpload(mockFileData);
    });

    // Verify local state update
    expect(mockUpdateCards).toHaveBeenCalledWith({
      uploadedFile: mockFileData,
    });

    // Verify broadcast was called
    expect(mockCardSyncReturn.uploadFile).toHaveBeenCalledWith(mockFileData);
  });

  it('should receive file upload from other users', async () => {
    let onFileUploadCallback: ((data: any) => void) | undefined;

    // Capture the onFileUpload callback
    vi.mocked(useCardSync).mockImplementation((options) => {
      onFileUploadCallback = options.onFileUpload;
      return mockCardSyncReturn;
    });

    renderHook(() =>
      useUnifiedCardSync({
        roomId: 'test-room',
        gameType: 'position_breakdown',
        storeKey: 'position_breakdown',
        isRoomOwner: false, // Visitor
        zones: ['position'],
      })
    );

    const remoteFileData = {
      name: 'remote.pdf',
      type: 'application/pdf',
      size: 12345,
      dataUrl: 'data:application/pdf;base64,cmVtb3RlIGRhdGE=',
      uploadedAt: Date.now(),
    };

    // Simulate receiving file upload from another user
    await act(async () => {
      onFileUploadCallback?.(remoteFileData);
    });

    // Verify local state was updated
    expect(mockUpdateCards).toHaveBeenCalledWith({
      uploadedFile: remoteFileData,
    });
  });

  it('should not broadcast when receiving remote file upload', async () => {
    let onFileUploadCallback: ((data: any) => void) | undefined;

    vi.mocked(useCardSync).mockImplementation((options) => {
      onFileUploadCallback = options.onFileUpload;
      return mockCardSyncReturn;
    });

    renderHook(() =>
      useUnifiedCardSync({
        roomId: 'test-room',
        gameType: 'position_breakdown',
        storeKey: 'position_breakdown',
        isRoomOwner: false,
        zones: ['position'],
      })
    );

    const remoteFileData = {
      name: 'remote.pdf',
      type: 'application/pdf',
      size: 12345,
      dataUrl: 'data:application/pdf;base64,cmVtb3RlIGRhdGE=',
      uploadedAt: Date.now(),
    };

    // Clear previous calls
    mockCardSyncReturn.uploadFile.mockClear();

    // Receive remote file upload
    await act(async () => {
      onFileUploadCallback?.(remoteFileData);
    });

    // Should NOT broadcast again (avoid infinite loop)
    expect(mockCardSyncReturn.uploadFile).not.toHaveBeenCalled();
  });

});
