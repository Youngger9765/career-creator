/**
 * Tests for useRealtimeChannel hook
 * Shared Supabase Realtime channel subscription hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeChannel } from '../use-realtime-channel';
import { supabase } from '@/lib/supabase-client';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    channel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('useRealtimeChannel', () => {
  let mockChannel: any;
  let mockListeners: Map<string, Function[]>;
  let subscribeCallback: ((status: string, err?: Error | null) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListeners = new Map();
    subscribeCallback = null;

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
      subscribe: vi.fn((callback: (status: string, err?: Error | null) => void) => {
        subscribeCallback = callback;
        // Simulate async subscription success by default
        setTimeout(() => callback('SUBSCRIBED', null), 0);
        return Promise.resolve();
      }),
      send: vi.fn(() => Promise.resolve()),
      track: vi.fn(() => Promise.resolve()),
      unsubscribe: vi.fn(() => Promise.resolve()),
      presenceState: vi.fn(() => ({})),
    };

    (supabase.channel as any).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    mockListeners.clear();
    subscribeCallback = null;
  });

  // Helper to emit events
  const emitEvent = (type: string, event: string, payload: any) => {
    const key = `${type}:${event}`;
    const listeners = mockListeners.get(key) || [];
    listeners.forEach((callback) => callback({ payload }));
  };

  // Helper to simulate subscription status
  const simulateSubscribeStatus = (status: string, err?: Error | null) => {
    if (subscribeCallback) {
      subscribeCallback(status, err);
    }
  };

  describe('Basic functionality', () => {
    it('should connect successfully and call onConnected', async () => {
      const onConnected = vi.fn();
      const setupListeners = vi.fn();

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          onConnected,
          setupListeners,
        })
      );

      // Wait for connection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(onConnected).toHaveBeenCalledTimes(1);
      expect(setupListeners).toHaveBeenCalledWith(mockChannel);
      expect(result.current.error).toBeNull();
      expect(result.current.errorType).toBeNull();
      expect(result.current.retryExhausted).toBe(false);
    });

    it('should prefix channel name with realtime: automatically', async () => {
      const setupListeners = vi.fn();

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'room:123:cards',
          setupListeners,
        })
      );

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('realtime:room:123:cards');
      });
    });

    it('should not double-prefix if already has realtime:', async () => {
      const setupListeners = vi.fn();

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'realtime:room:123:cards',
          setupListeners,
        })
      );

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('realtime:room:123:cards');
      });
    });

    it('should not connect when enabled is false', async () => {
      const setupListeners = vi.fn();

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          enabled: false,
          setupListeners,
        })
      );

      // Wait a bit to ensure no connection happens
      await new Promise((r) => setTimeout(r, 50));

      expect(supabase.channel).not.toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });

    it('should pass channelConfig to Supabase channel', async () => {
      const setupListeners = vi.fn();
      const channelConfig = {
        presence: { key: 'user-123' },
      };

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'presence-channel',
          setupListeners,
          channelConfig,
        })
      );

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith(
          'realtime:presence-channel',
          { config: channelConfig }
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should handle TIMED_OUT status and retry', async () => {
      const onDisconnected = vi.fn();
      const setupListeners = vi.fn();

      // Override subscribe to return TIMED_OUT
      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        setTimeout(() => callback('TIMED_OUT', null), 0);
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          onDisconnected,
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.errorType).toBe('TIMED_OUT');
        expect(result.current.isRetrying).toBe(true);
      });

      expect(onDisconnected).toHaveBeenCalledWith('TIMED_OUT');
    });

    it('should handle CHANNEL_ERROR status and retry', async () => {
      const onDisconnected = vi.fn();
      const setupListeners = vi.fn();

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        setTimeout(() => callback('CHANNEL_ERROR', new Error('Test error')), 0);
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          onDisconnected,
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.errorType).toBe('CHANNEL_ERROR');
        expect(result.current.isRetrying).toBe(true);
      });

      expect(onDisconnected).toHaveBeenCalledWith('CHANNEL_ERROR');
    });

    it('should handle CLOSED status and retry', async () => {
      const setupListeners = vi.fn();

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        setTimeout(() => callback('CLOSED', null), 0);
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.errorType).toBe('CLOSED');
        expect(result.current.isRetrying).toBe(true);
      });
    });

    it('should not retry for rate-limited errors', async () => {
      const setupListeners = vi.fn();

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        setTimeout(
          () => callback('CHANNEL_ERROR', new Error('429 Too Many Requests')),
          0
        );
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.errorType).toBe('RATE_LIMITED');
        expect(result.current.isRetrying).toBe(false);
        expect(result.current.retryExhausted).toBe(true);
      });
    });

    it('should not retry for unauthorized errors', async () => {
      const setupListeners = vi.fn();

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        setTimeout(
          () => callback('CHANNEL_ERROR', new Error('401 unauthorized')),
          0
        );
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.errorType).toBe('UNAUTHORIZED');
        expect(result.current.isRetrying).toBe(false);
        expect(result.current.retryExhausted).toBe(true);
      });
    });

    it('should exhaust retries after max attempts', async () => {
      const setupListeners = vi.fn();
      let retryCount = 0;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        retryCount++;
        setTimeout(() => callback('TIMED_OUT', null), 0);
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 2, initialDelayMs: 10 },
        })
      );

      // Wait for all retries to exhaust
      await waitFor(
        () => {
          expect(result.current.retryExhausted).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.error).toBe('無法連接到即時服務，請重新整理頁面');
    });
  });

  describe('Reconnect functionality', () => {
    it('should allow manual reconnect after retry exhaustion', async () => {
      const setupListeners = vi.fn();
      let attemptCount = 0;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        attemptCount++;

        // Fail first 3 attempts, succeed on 4th (after manual reconnect)
        if (attemptCount <= 3) {
          setTimeout(() => callback('TIMED_OUT', null), 0);
        } else {
          setTimeout(() => callback('SUBSCRIBED', null), 0);
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 2, initialDelayMs: 10 },
        })
      );

      // Wait for retries to exhaust
      await waitFor(
        () => {
          expect(result.current.retryExhausted).toBe(true);
        },
        { timeout: 2000 }
      );

      // Trigger manual reconnect
      act(() => {
        result.current.reconnect();
      });

      // Should reset retry state
      await waitFor(() => {
        expect(result.current.retryExhausted).toBe(false);
      });

      // Should eventually connect
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should reset error state on manual reconnect', async () => {
      const setupListeners = vi.fn();
      let shouldFail = true;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        if (shouldFail) {
          setTimeout(() => callback('TIMED_OUT', null), 0);
        } else {
          setTimeout(() => callback('SUBSCRIBED', null), 0);
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 1, initialDelayMs: 10 },
        })
      );

      // Wait for retries to exhaust
      await waitFor(
        () => {
          expect(result.current.retryExhausted).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(result.current.error).not.toBeNull();
      expect(result.current.errorType).not.toBeNull();

      // Setup success for next attempt
      shouldFail = false;

      // Trigger manual reconnect
      act(() => {
        result.current.reconnect();
      });

      // Should reset error immediately
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.errorType).toBeNull();
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe channel on unmount', async () => {
      const setupListeners = vi.fn();

      const { unmount } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
        })
      );

      // Wait for connection
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      // Unmount
      unmount();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should not attempt retry after cleanup', async () => {
      const setupListeners = vi.fn();
      let subscribeCallCount = 0;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        subscribeCallCount++;
        // Always fail with timeout
        setTimeout(() => callback('TIMED_OUT', null), 0);
        return Promise.resolve();
      });

      const { unmount } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 5, initialDelayMs: 50 },
        })
      );

      // Wait for first attempt
      await waitFor(() => {
        expect(subscribeCallCount).toBeGreaterThanOrEqual(1);
      });

      // Unmount before retries complete
      unmount();

      const countAtUnmount = subscribeCallCount;

      // Wait a bit to ensure no more retries happen
      await new Promise((r) => setTimeout(r, 200));

      // Should not have many more subscribe calls after unmount
      // Allow for 1-2 more calls that might have been in flight
      expect(subscribeCallCount).toBeLessThanOrEqual(countAtUnmount + 2);
    });
  });

  describe('Channel name changes', () => {
    it('should reconnect when channel name changes', async () => {
      const setupListeners = vi.fn();

      const { result, rerender } = renderHook(
        ({ channelName }) =>
          useRealtimeChannel({
            channelName,
            setupListeners,
          }),
        {
          initialProps: { channelName: 'channel-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(supabase.channel).toHaveBeenCalledWith('realtime:channel-1');

      // Change channel name
      rerender({ channelName: 'channel-2' });

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('realtime:channel-2');
      });
    });
  });

  describe('setupListeners callback', () => {
    it('should call setupListeners with channel before subscribing', async () => {
      const setupListeners = vi.fn();

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
        })
      );

      await waitFor(() => {
        expect(setupListeners).toHaveBeenCalledWith(mockChannel);
      });

      // Verify setupListeners was called before subscribe
      const setupCallOrder = setupListeners.mock.invocationCallOrder[0];
      const subscribeCallOrder = mockChannel.subscribe.mock.invocationCallOrder[0];

      expect(setupCallOrder).toBeLessThan(subscribeCallOrder);
    });

    it('should allow setting up broadcast listeners', async () => {
      const onMessageReceived = vi.fn();

      const setupListeners = (channel: RealtimeChannel) => {
        channel.on('broadcast', { event: 'test_message' }, ({ payload }) => {
          onMessageReceived(payload);
        });
      };

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
        })
      );

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'broadcast',
          { event: 'test_message' },
          expect.any(Function)
        );
      });

      // Simulate receiving a message
      act(() => {
        emitEvent('broadcast', 'test_message', { data: 'hello' });
      });

      expect(onMessageReceived).toHaveBeenCalledWith({ data: 'hello' });
    });

    it('should allow setting up presence listeners', async () => {
      const onPresenceSync = vi.fn();

      const setupListeners = (channel: RealtimeChannel) => {
        channel.on('presence', { event: 'sync' }, () => {
          onPresenceSync();
        });
      };

      renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          channelConfig: { presence: { key: 'user-1' } },
        })
      );

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'presence',
          { event: 'sync' },
          expect.any(Function)
        );
      });

      // Simulate presence sync
      act(() => {
        emitEvent('presence', 'sync', {});
      });

      expect(onPresenceSync).toHaveBeenCalled();
    });
  });

  describe('Remaining retries tracking', () => {
    it('should track remaining retries correctly', async () => {
      const setupListeners = vi.fn();
      let attemptCount = 0;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        attemptCount++;
        setTimeout(() => callback('TIMED_OUT', null), 0);
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 3, initialDelayMs: 10 },
        })
      );

      // Initial state should have max retries
      expect(result.current.remainingRetries).toBe(3);

      // After first failure, should be retrying with fewer remaining
      await waitFor(
        () => {
          expect(result.current.remainingRetries).toBeLessThan(3);
        },
        { timeout: 1000 }
      );
    });

    it('should reset remaining retries on successful connection', async () => {
      const setupListeners = vi.fn();
      let shouldFail = true;

      mockChannel.subscribe = vi.fn((callback: any) => {
        subscribeCallback = callback;
        if (shouldFail) {
          setTimeout(() => callback('TIMED_OUT', null), 0);
        } else {
          setTimeout(() => callback('SUBSCRIBED', null), 0);
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useRealtimeChannel({
          channelName: 'test-channel',
          setupListeners,
          retryConfig: { maxRetries: 5, initialDelayMs: 10 },
        })
      );

      // Wait for some retries
      await waitFor(
        () => {
          expect(result.current.remainingRetries).toBeLessThan(5);
        },
        { timeout: 1000 }
      );

      // Now succeed
      shouldFail = false;

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.remainingRetries).toBe(5);
      });
    });
  });
});
