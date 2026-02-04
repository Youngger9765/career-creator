/**
 * Test for Realtime Retry utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RealtimeRetryManager,
  classifyRealtimeError,
  createRetryManager,
  RETRYABLE_ERRORS,
  NON_RETRYABLE_ERRORS,
  type RealtimeErrorType,
} from '../realtime-retry';

// ============================================================================
// RealtimeRetryManager Tests
// ============================================================================

describe('RealtimeRetryManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('canRetry()', () => {
    it('should return true when retryCount < maxRetries', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 3 });

      expect(manager.canRetry()).toBe(true);
    });

    it('should return false when retryCount >= maxRetries', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 2 });
      const callback = vi.fn();

      // Exhaust retries
      manager.scheduleRetry(callback);
      manager.scheduleRetry(callback);

      expect(manager.canRetry()).toBe(false);
    });

    it('should return true after reset even if retries were exhausted', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 1 });
      const callback = vi.fn();

      manager.scheduleRetry(callback);
      expect(manager.canRetry()).toBe(false);

      manager.reset();
      expect(manager.canRetry()).toBe(true);
    });
  });

  describe('scheduleRetry()', () => {
    it('should schedule callback and return true when retries available', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 3, initialDelayMs: 1000 });
      const callback = vi.fn();

      const result = manager.scheduleRetry(callback);

      expect(result).toBe(true);
      expect(callback).not.toHaveBeenCalled();

      // Callback should execute after delay
      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return false when max retries exceeded', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 1 });
      const callback = vi.fn();

      manager.scheduleRetry(callback); // First retry
      const result = manager.scheduleRetry(callback); // Should fail

      expect(result).toBe(false);
    });

    it('should call onRetryScheduled callback with attempt and delay', () => {
      const onRetryScheduled = vi.fn();
      const manager = new RealtimeRetryManager({
        maxRetries: 3,
        initialDelayMs: 1000,
        jitterFactor: 0, // No jitter for predictable delay
        onRetryScheduled,
      });

      manager.scheduleRetry(vi.fn());

      expect(onRetryScheduled).toHaveBeenCalledTimes(1);
      expect(onRetryScheduled).toHaveBeenCalledWith(1, 1000);
    });

    it('should call onRetryExhausted when max retries exceeded', () => {
      const onRetryExhausted = vi.fn();
      const manager = new RealtimeRetryManager({
        maxRetries: 1,
        onRetryExhausted,
      });

      manager.scheduleRetry(vi.fn());
      manager.scheduleRetry(vi.fn()); // This should trigger exhausted

      expect(onRetryExhausted).toHaveBeenCalledTimes(1);
    });

    it('should increment retryCount on each scheduled retry', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5 });

      expect(manager.getRetryCount()).toBe(0);

      manager.scheduleRetry(vi.fn());
      expect(manager.getRetryCount()).toBe(1);

      manager.scheduleRetry(vi.fn());
      expect(manager.getRetryCount()).toBe(2);
    });
  });

  describe('Exponential backoff', () => {
    it('should use exponential backoff (1s, 2s, 4s, 8s...)', () => {
      const onRetryScheduled = vi.fn();
      const manager = new RealtimeRetryManager({
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        jitterFactor: 0, // No jitter for predictable testing
        onRetryScheduled,
      });

      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(1, 1000);

      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(2, 2000);

      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(3, 4000);

      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(4, 8000);

      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(5, 16000);
    });

    it('should cap delay at maxDelayMs', () => {
      const onRetryScheduled = vi.fn();
      const manager = new RealtimeRetryManager({
        maxRetries: 10,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        jitterFactor: 0,
        onRetryScheduled,
      });

      // Retry 1: 1000ms
      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(1, 1000);

      // Retry 2: 2000ms
      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(2, 2000);

      // Retry 3: 4000ms
      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(3, 4000);

      // Retry 4: would be 8000ms but capped at 5000ms
      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(4, 5000);

      // Retry 5: would be 16000ms but capped at 5000ms
      manager.scheduleRetry(vi.fn());
      expect(onRetryScheduled).toHaveBeenLastCalledWith(5, 5000);
    });

    it('should add jitter when jitterFactor > 0', () => {
      // Mock Math.random to return predictable values
      const randomSpy = vi.spyOn(Math, 'random');

      // Test with jitter = 0.3, random = 0.5 (middle, no change)
      randomSpy.mockReturnValue(0.5);
      const manager1 = new RealtimeRetryManager({
        maxRetries: 3,
        initialDelayMs: 1000,
        jitterFactor: 0.3,
      });
      const onRetryScheduled1 = vi.fn();
      manager1['config'].onRetryScheduled = onRetryScheduled1;
      manager1.scheduleRetry(vi.fn());
      // random=0.5 => (0.5-0.5)*2 = 0, so jitter = 0
      expect(onRetryScheduled1).toHaveBeenLastCalledWith(1, 1000);

      // Test with jitter = 0.3, random = 1.0 (max positive jitter)
      randomSpy.mockReturnValue(1.0);
      const manager2 = new RealtimeRetryManager({
        maxRetries: 3,
        initialDelayMs: 1000,
        jitterFactor: 0.3,
      });
      const onRetryScheduled2 = vi.fn();
      manager2['config'].onRetryScheduled = onRetryScheduled2;
      manager2.scheduleRetry(vi.fn());
      // random=1.0 => (1.0-0.5)*2 = 1, jitter = 1000 * 0.3 * 1 = 300
      expect(onRetryScheduled2).toHaveBeenLastCalledWith(1, 1300);

      // Test with jitter = 0.3, random = 0 (max negative jitter)
      randomSpy.mockReturnValue(0);
      const manager3 = new RealtimeRetryManager({
        maxRetries: 3,
        initialDelayMs: 1000,
        jitterFactor: 0.3,
      });
      const onRetryScheduled3 = vi.fn();
      manager3['config'].onRetryScheduled = onRetryScheduled3;
      manager3.scheduleRetry(vi.fn());
      // random=0 => (0-0.5)*2 = -1, jitter = 1000 * 0.3 * -1 = -300
      expect(onRetryScheduled3).toHaveBeenLastCalledWith(1, 700);

      randomSpy.mockRestore();
    });

    it('should never return negative delay', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const onRetryScheduled = vi.fn();
      const manager = new RealtimeRetryManager({
        maxRetries: 3,
        initialDelayMs: 100,
        jitterFactor: 1.0, // 100% jitter
        onRetryScheduled,
      });

      manager.scheduleRetry(vi.fn());
      const [, delay] = onRetryScheduled.mock.calls[0];
      expect(delay).toBeGreaterThanOrEqual(0);

      randomSpy.mockRestore();
    });
  });

  describe('reset()', () => {
    it('should reset retryCount to 0', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5 });

      manager.scheduleRetry(vi.fn());
      manager.scheduleRetry(vi.fn());
      expect(manager.getRetryCount()).toBe(2);

      manager.reset();
      expect(manager.getRetryCount()).toBe(0);
    });

    it('should cancel pending timeout', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5, initialDelayMs: 5000 });
      const callback = vi.fn();

      manager.scheduleRetry(callback);
      expect(manager.isRetrying()).toBe(true);

      manager.reset();
      expect(manager.isRetrying()).toBe(false);

      // Advance time past original delay
      vi.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear lastError', () => {
      const manager = new RealtimeRetryManager();
      manager.setLastError({
        type: 'TIMED_OUT',
        message: 'test',
        userMessage: 'test',
        isRetryable: true,
      });

      expect(manager.getLastError()).not.toBeNull();

      manager.reset();
      expect(manager.getLastError()).toBeNull();
    });
  });

  describe('cleanup()', () => {
    it('should reset all state (same as reset)', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5, initialDelayMs: 5000 });
      const callback = vi.fn();

      manager.scheduleRetry(callback);
      manager.setLastError({
        type: 'NETWORK_ERROR',
        message: 'test',
        userMessage: 'test',
        isRetryable: true,
      });

      manager.cleanup();

      expect(manager.getRetryCount()).toBe(0);
      expect(manager.isRetrying()).toBe(false);
      expect(manager.getLastError()).toBeNull();

      vi.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getRemainingRetries()', () => {
    it('should return maxRetries initially', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5 });
      expect(manager.getRemainingRetries()).toBe(5);
    });

    it('should decrease with each retry', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 5 });

      manager.scheduleRetry(vi.fn());
      expect(manager.getRemainingRetries()).toBe(4);

      manager.scheduleRetry(vi.fn());
      expect(manager.getRemainingRetries()).toBe(3);
    });

    it('should return 0 when exhausted', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 2 });

      manager.scheduleRetry(vi.fn());
      manager.scheduleRetry(vi.fn());

      expect(manager.getRemainingRetries()).toBe(0);
    });

    it('should never return negative', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 1 });

      manager.scheduleRetry(vi.fn());
      manager.scheduleRetry(vi.fn()); // This fails but shouldn't make it negative

      expect(manager.getRemainingRetries()).toBe(0);
    });
  });

  describe('handleError()', () => {
    it('should classify error and schedule retry for retryable errors', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 3 });
      const callback = vi.fn();

      const result = manager.handleError('TIMED_OUT', new Error('timeout'), callback);

      expect(result.scheduled).toBe(true);
      expect(result.classifiedError.type).toBe('TIMED_OUT');
      expect(result.classifiedError.isRetryable).toBe(true);
    });

    it('should not schedule retry for non-retryable errors', () => {
      const manager = new RealtimeRetryManager({ maxRetries: 3 });
      const callback = vi.fn();

      const result = manager.handleError(undefined, new Error('quota exceeded'), callback);

      expect(result.scheduled).toBe(false);
      expect(result.classifiedError.type).toBe('RATE_LIMITED');
      expect(result.classifiedError.isRetryable).toBe(false);
    });

    it('should set lastError', () => {
      const manager = new RealtimeRetryManager();
      manager.handleError('CHANNEL_ERROR', new Error('test'), vi.fn());

      const lastError = manager.getLastError();
      expect(lastError).not.toBeNull();
      expect(lastError?.type).toBe('CHANNEL_ERROR');
    });
  });

  describe('isRetrying()', () => {
    it('should return false initially', () => {
      const manager = new RealtimeRetryManager();
      expect(manager.isRetrying()).toBe(false);
    });

    it('should return true after scheduling retry', () => {
      const manager = new RealtimeRetryManager({ initialDelayMs: 5000 });
      manager.scheduleRetry(vi.fn());
      expect(manager.isRetrying()).toBe(true);
    });

    it('should return true while timeout is pending (timeoutId is set)', () => {
      const manager = new RealtimeRetryManager({ initialDelayMs: 1000, jitterFactor: 0 });
      manager.scheduleRetry(vi.fn());

      // Even after callback executes, timeoutId remains set until reset() is called
      // This is the actual implementation behavior - isRetrying checks if timeoutId exists
      vi.advanceTimersByTime(500);
      expect(manager.isRetrying()).toBe(true);
    });
  });
});

// ============================================================================
// classifyRealtimeError Tests
// ============================================================================

describe('classifyRealtimeError', () => {
  describe('status-based classification', () => {
    it('should classify TIMED_OUT status correctly', () => {
      const result = classifyRealtimeError('TIMED_OUT', new Error(''));

      expect(result.type).toBe('TIMED_OUT');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toBe('連線逾時，正在重新連線...');
    });

    it('should classify CLOSED status correctly', () => {
      const result = classifyRealtimeError('CLOSED', new Error(''));

      expect(result.type).toBe('CLOSED');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toBe('連線已中斷');
    });

    it('should classify CHANNEL_ERROR status correctly', () => {
      const result = classifyRealtimeError('CHANNEL_ERROR', new Error(''));

      expect(result.type).toBe('CHANNEL_ERROR');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toBe('連線發生錯誤，正在重新連線...');
    });
  });

  describe('message-based RATE_LIMITED classification', () => {
    it('should identify "quota" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('quota exceeded'));

      expect(result.type).toBe('RATE_LIMITED');
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toBe('服務繁忙，請稍後再試');
    });

    it('should identify "rate_limit" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('rate_limit reached'));

      expect(result.type).toBe('RATE_LIMITED');
      expect(result.isRetryable).toBe(false);
    });

    it('should identify "429" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('HTTP 429'));

      expect(result.type).toBe('RATE_LIMITED');
      expect(result.isRetryable).toBe(false);
    });

    it('should identify "Too Many Requests" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('Too Many Requests'));

      expect(result.type).toBe('RATE_LIMITED');
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('message-based UNAUTHORIZED classification', () => {
    it('should identify "unauthorized" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('unauthorized access'));

      expect(result.type).toBe('UNAUTHORIZED');
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toBe('連線驗證失敗，請重新登入');
    });

    it('should identify "401" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('HTTP 401'));

      expect(result.type).toBe('UNAUTHORIZED');
      expect(result.isRetryable).toBe(false);
    });

    it('should identify "forbidden" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('forbidden'));

      expect(result.type).toBe('UNAUTHORIZED');
      expect(result.isRetryable).toBe(false);
    });

    it('should identify "403" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('HTTP 403'));

      expect(result.type).toBe('UNAUTHORIZED');
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('message-based NETWORK_ERROR classification', () => {
    it('should identify "network" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('network error'));

      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toBe('網路連線不穩定，正在重新連線...');
    });

    it('should identify "fetch" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('fetch failed'));

      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.isRetryable).toBe(true);
    });

    it('should identify "ECONNREFUSED" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('ECONNREFUSED'));

      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.isRetryable).toBe(true);
    });

    it('should identify "Failed to fetch" in error message', () => {
      const result = classifyRealtimeError(undefined, new Error('Failed to fetch'));

      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('timeout from message', () => {
    it('should identify "timeout" in error message without status', () => {
      const result = classifyRealtimeError(undefined, new Error('connection timeout'));

      expect(result.type).toBe('TIMED_OUT');
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('UNKNOWN error handling', () => {
    it('should classify unrecognized errors as UNKNOWN', () => {
      const result = classifyRealtimeError(undefined, new Error('something weird happened'));

      expect(result.type).toBe('UNKNOWN');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toBe('連線發生問題');
    });

    it('should handle non-Error objects', () => {
      const result = classifyRealtimeError(undefined, 'string error');

      expect(result.type).toBe('UNKNOWN');
      expect(result.message).toBe('string error');
    });

    it('should handle null/undefined errors', () => {
      const result = classifyRealtimeError(undefined, null);

      expect(result.type).toBe('UNKNOWN');
      // When error is null, errorMsg becomes '', but UNKNOWN case returns 'Unknown error' as fallback
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('priority of classification', () => {
    it('should prioritize rate_limit over status', () => {
      // Even if status is CHANNEL_ERROR, quota message should win
      const result = classifyRealtimeError('CHANNEL_ERROR', new Error('quota exceeded'));

      expect(result.type).toBe('RATE_LIMITED');
    });

    it('should prioritize unauthorized over status', () => {
      const result = classifyRealtimeError('TIMED_OUT', new Error('401 unauthorized'));

      expect(result.type).toBe('UNAUTHORIZED');
    });
  });

  describe('originalError preservation', () => {
    it('should preserve the original error', () => {
      const originalError = new Error('test error');
      const result = classifyRealtimeError('TIMED_OUT', originalError);

      expect(result.originalError).toBe(originalError);
    });
  });
});

// ============================================================================
// RETRYABLE_ERRORS and NON_RETRYABLE_ERRORS Tests
// ============================================================================

describe('RETRYABLE_ERRORS', () => {
  it('should contain CHANNEL_ERROR', () => {
    expect(RETRYABLE_ERRORS.has('CHANNEL_ERROR')).toBe(true);
  });

  it('should contain TIMED_OUT', () => {
    expect(RETRYABLE_ERRORS.has('TIMED_OUT')).toBe(true);
  });

  it('should contain NETWORK_ERROR', () => {
    expect(RETRYABLE_ERRORS.has('NETWORK_ERROR')).toBe(true);
  });

  it('should not contain RATE_LIMITED', () => {
    expect(RETRYABLE_ERRORS.has('RATE_LIMITED')).toBe(false);
  });

  it('should not contain UNAUTHORIZED', () => {
    expect(RETRYABLE_ERRORS.has('UNAUTHORIZED')).toBe(false);
  });
});

describe('NON_RETRYABLE_ERRORS', () => {
  it('should contain RATE_LIMITED', () => {
    expect(NON_RETRYABLE_ERRORS.has('RATE_LIMITED')).toBe(true);
  });

  it('should contain UNAUTHORIZED', () => {
    expect(NON_RETRYABLE_ERRORS.has('UNAUTHORIZED')).toBe(true);
  });

  it('should not contain CHANNEL_ERROR', () => {
    expect(NON_RETRYABLE_ERRORS.has('CHANNEL_ERROR')).toBe(false);
  });

  it('should not contain TIMED_OUT', () => {
    expect(NON_RETRYABLE_ERRORS.has('TIMED_OUT')).toBe(false);
  });
});

// ============================================================================
// createRetryManager Tests
// ============================================================================

describe('createRetryManager', () => {
  it('should create a RealtimeRetryManager instance', () => {
    const manager = createRetryManager();
    expect(manager).toBeInstanceOf(RealtimeRetryManager);
  });

  it('should pass config to the manager', () => {
    const manager = createRetryManager({ maxRetries: 10 });
    expect(manager.getRemainingRetries()).toBe(10);
  });
});
