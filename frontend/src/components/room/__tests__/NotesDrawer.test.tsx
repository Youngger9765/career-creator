import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotesDrawer } from '../NotesDrawer';
import { apiClient } from '@/lib/api/client';
import { consultationRecordsAPI } from '@/lib/api/clients';

// Mock API client
vi.mock('@/lib/api/client');
vi.mock('@/lib/api/clients');

describe('NotesDrawer', () => {
  const mockProps = {
    roomId: 'room-123',
    isOpen: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue({ data: { content: '' } });
    (apiClient.put as any).mockResolvedValue({ data: {} });
    (consultationRecordsAPI.getClientRecords as any).mockResolvedValue([]);
  });

  it('should auto-save notes after typing with debounce', async () => {
    const user = userEvent.setup();

    render(<NotesDrawer {...mockProps} />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/room-123/notes');
    });

    // Type in textarea
    const textarea = screen.getByPlaceholderText(/記錄觀察/);
    await user.type(textarea, 'Test note');

    // Should debounce and save after 1 second
    await waitFor(
      () => {
        expect(apiClient.put).toHaveBeenCalledWith('/api/rooms/room-123/notes', {
          content: 'Test note',
        });
      },
      { timeout: 2000 }
    );
  });

  it('should not have stale closure in auto-save', async () => {
    const user = userEvent.setup();

    render(<NotesDrawer {...mockProps} />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(/記錄觀察/);

    // Type first text
    await user.type(textarea, 'First');

    // Immediately type second text (before debounce)
    await user.clear(textarea);
    await user.type(textarea, 'Second');

    // Should save the latest value, not stale "First"
    await waitFor(
      () => {
        const lastCall = (apiClient.put as any).mock.calls.slice(-1)[0];
        expect(lastCall[1].content).toBe('Second');
      },
      { timeout: 2000 }
    );
  });
});
