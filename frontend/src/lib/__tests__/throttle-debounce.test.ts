/**
 * Test for Throttle and Debounce utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle, debounce } from '../throttle-debounce';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute function immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled('arg1');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('should throttle rapid calls to max 1 per interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    // Call 10 times rapidly (every 50ms)
    for (let i = 0; i < 10; i++) {
      throttled(`call-${i}`);
      vi.advanceTimersByTime(50);
    }

    // First call is immediate (1)
    // After 300ms, should execute last queued call (2, 3, 4...)
    // Should significantly reduce from 10 calls
    vi.runAllTimers();

    expect(fn.mock.calls.length).toBeLessThanOrEqual(5); // Much less than 10
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2); // At least first + last
  });

  it('should use latest arguments for throttled call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled('first');
    throttled('second');
    throttled('third');

    vi.advanceTimersByTime(300);

    // Should call with 'first' immediately and 'third' after throttle
    expect(fn).toHaveBeenCalledWith('first');
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('should cancel pending calls when cancel() is called', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled('first');
    expect(fn).toHaveBeenCalledTimes(1);

    throttled('second');
    throttled('third');

    // Cancel before delayed call executes
    throttled.cancel();

    // Fast forward time - should NOT execute delayed call
    vi.advanceTimersByTime(300);

    // Should still only have 1 call (the immediate one)
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced('arg1');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('should reset timer on rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    // Call 5 times rapidly
    for (let i = 0; i < 5; i++) {
      debounced(`call-${i}`);
      vi.advanceTimersByTime(100);
    }

    // Should not have called yet (only 500ms total)
    expect(fn).not.toHaveBeenCalled();

    // Wait full 500ms after last call
    vi.advanceTimersByTime(500);

    // Should only call once with last argument
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call-4');
  });

  it('should use latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('should cancel pending execution when cancel() is called', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced('first');
    debounced('second');

    // Cancel before execution
    debounced.cancel();

    // Fast forward time - should NOT execute
    vi.advanceTimersByTime(500);

    // Should never be called
    expect(fn).not.toHaveBeenCalled();
  });
});
