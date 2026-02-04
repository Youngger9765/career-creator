/**
 * Tests for screenshot drawer hide/show behavior
 *
 * When capturing a screenshot, the NotesDrawer should:
 * 1. Hide temporarily to let game area expand
 * 2. Wait for layout reflow (300ms)
 * 3. Capture screenshot
 * 4. Restore drawer state (even on error)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Extract the core logic for testing
interface ScreenshotCaptureOptions {
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  captureScreenshot: () => Promise<Blob>;
  onSuccess: (blob: Blob) => Promise<void>;
  onError: (error: Error) => void;
}

async function handleCaptureScreenshotWithDrawerHide(
  options: ScreenshotCaptureOptions
): Promise<void> {
  const { isDrawerOpen, setDrawerOpen, captureScreenshot, onSuccess, onError } = options;

  // 1. Hide drawer if open
  const wasDrawerOpen = isDrawerOpen;
  if (wasDrawerOpen) {
    setDrawerOpen(false);
    // Wait for layout reflow
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  try {
    const blob = await captureScreenshot();
    await onSuccess(blob);
  } catch (error) {
    onError(error as Error);
  } finally {
    // 2. Restore drawer state
    if (wasDrawerOpen) {
      setDrawerOpen(true);
    }
  }
}

describe('Screenshot Drawer Behavior', () => {
  let setDrawerOpen: ReturnType<typeof vi.fn>;
  let captureScreenshot: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    setDrawerOpen = vi.fn();
    captureScreenshot = vi.fn();
    onSuccess = vi.fn();
    onError = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should hide drawer before capturing screenshot', async () => {
    captureScreenshot.mockResolvedValue(new Blob(['test']));
    onSuccess.mockResolvedValue(undefined);

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: true,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    // Drawer should be hidden immediately
    expect(setDrawerOpen).toHaveBeenCalledWith(false);

    // Advance past the 300ms delay
    await vi.advanceTimersByTimeAsync(300);
    await promise;

    // Drawer should be restored
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
    expect(setDrawerOpen).toHaveBeenCalledTimes(2);
  });

  it('should wait 300ms before capturing screenshot', async () => {
    captureScreenshot.mockResolvedValue(new Blob(['test']));
    onSuccess.mockResolvedValue(undefined);

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: true,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    // After 100ms, screenshot should not be captured yet
    await vi.advanceTimersByTimeAsync(100);
    expect(captureScreenshot).not.toHaveBeenCalled();

    // After 200ms more (300ms total), screenshot should be captured
    await vi.advanceTimersByTimeAsync(200);
    await promise;
    expect(captureScreenshot).toHaveBeenCalled();
  });

  it('should restore drawer even when screenshot fails', async () => {
    captureScreenshot.mockRejectedValue(new Error('Screenshot failed'));

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: true,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    await vi.advanceTimersByTimeAsync(300);
    await promise;

    // Drawer should still be restored
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should not touch drawer if it was already closed', async () => {
    captureScreenshot.mockResolvedValue(new Blob(['test']));
    onSuccess.mockResolvedValue(undefined);

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: false,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    await promise;

    // Drawer should not be touched
    expect(setDrawerOpen).not.toHaveBeenCalled();
    // Screenshot should still be captured
    expect(captureScreenshot).toHaveBeenCalled();
  });

  it('should call onSuccess with blob when capture succeeds', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    captureScreenshot.mockResolvedValue(mockBlob);
    onSuccess.mockResolvedValue(undefined);

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: true,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    await vi.advanceTimersByTimeAsync(300);
    await promise;

    expect(onSuccess).toHaveBeenCalledWith(mockBlob);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should restore drawer even when onSuccess fails', async () => {
    captureScreenshot.mockResolvedValue(new Blob(['test']));
    onSuccess.mockRejectedValue(new Error('Upload failed'));

    const promise = handleCaptureScreenshotWithDrawerHide({
      isDrawerOpen: true,
      setDrawerOpen,
      captureScreenshot,
      onSuccess,
      onError,
    });

    await vi.advanceTimersByTimeAsync(300);
    await promise;

    // Drawer should still be restored
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
