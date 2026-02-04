/**
 * useRealtimeChannel Hook
 * Shared Supabase Realtime channel subscription hook
 *
 * Extracts common patterns from:
 * - use-card-sync.ts
 * - use-presence.ts
 * - use-game-mode-sync.ts
 *
 * Features:
 * - Exponential backoff with jitter
 * - Error classification for appropriate handling
 * - Automatic retry for retryable errors
 * - Graceful degradation for non-retryable errors
 * - Manual reconnect capability
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  RealtimeRetryManager,
  classifyRealtimeError,
  type RealtimeErrorType,
} from '@/lib/realtime-retry';

// ============================================================================
// Types
// ============================================================================

export interface UseRealtimeChannelOptions {
  /** Channel name (will be prefixed with 'realtime:' automatically) */
  channelName: string;
  /** Whether the channel should be enabled (default: true) */
  enabled?: boolean;
  /** Callback when connected successfully */
  onConnected?: () => void;
  /** Callback when disconnected */
  onDisconnected?: (errorType?: RealtimeErrorType) => void;
  /** Setup function to configure channel listeners before subscribing */
  setupListeners: (channel: RealtimeChannel) => void;
  /** Optional channel config (e.g., for presence) */
  channelConfig?: Record<string, unknown>;
  /** Retry configuration */
  retryConfig?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  };
}

export interface UseRealtimeChannelReturn {
  /** The RealtimeChannel instance (null if not connected) */
  channel: RealtimeChannel | null;
  /** Whether the channel is connected */
  isConnected: boolean;
  /** Error message (user-friendly) */
  error: string | null;
  /** Error type for fine-grained handling */
  errorType: RealtimeErrorType | null;
  /** Whether a retry is in progress */
  isRetrying: boolean;
  /** Number of remaining retry attempts */
  remainingRetries: number;
  /** Whether all retry attempts have been exhausted */
  retryExhausted: boolean;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRealtimeChannel(
  options: UseRealtimeChannelOptions
): UseRealtimeChannelReturn {
  const {
    channelName,
    enabled = true,
    onConnected,
    onDisconnected,
    setupListeners,
    channelConfig,
    retryConfig = DEFAULT_RETRY_CONFIG,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<RealtimeErrorType | null>(null);
  const [retryExhausted, setRetryExhausted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [remainingRetries, setRemainingRetries] = useState(
    retryConfig.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries
  );

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryManagerRef = useRef<RealtimeRetryManager | null>(null);
  const setupChannelRef = useRef<(() => Promise<void>) | null>(null);

  // Callback refs to avoid dependency issues
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const setupListenersRef = useRef(setupListeners);

  // Keep callback refs updated
  useEffect(() => {
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    setupListenersRef.current = setupListeners;
  }, [onConnected, onDisconnected, setupListeners]);

  // Setup channel and listeners
  useEffect(() => {
    // Early return if not enabled or Supabase not configured
    if (!enabled || !isSupabaseConfigured() || !supabase || !channelName) {
      return;
    }

    // Initialize retry manager
    if (!retryManagerRef.current) {
      retryManagerRef.current = new RealtimeRetryManager({
        maxRetries: retryConfig.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
        initialDelayMs:
          retryConfig.initialDelayMs ?? DEFAULT_RETRY_CONFIG.initialDelayMs,
        maxDelayMs: retryConfig.maxDelayMs ?? DEFAULT_RETRY_CONFIG.maxDelayMs,
      });
    }

    const retryManager = retryManagerRef.current;
    let isCleanedUp = false;

    const setupChannel = async () => {
      if (isCleanedUp) return;
      setupChannelRef.current = setupChannel;

      // Clean up existing channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create channel with optional config
      const fullChannelName = channelName.startsWith('realtime:')
        ? channelName
        : `realtime:${channelName}`;

      const channel = channelConfig
        ? supabase!.channel(fullChannelName, { config: channelConfig })
        : supabase!.channel(fullChannelName);

      // Setup listeners via callback
      setupListenersRef.current(channel);

      // Subscribe to channel
      channel.subscribe(async (status, err) => {
        if (isCleanedUp) return;

        if (status === 'SUBSCRIBED') {
          // Success! Reset retry counter and state
          retryManager.reset();
          setRetryExhausted(false);
          setIsRetrying(false);
          setRemainingRetries(
            retryConfig.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries
          );
          setIsConnected(true);
          setError(null);
          setErrorType(null);
          channelRef.current = channel;
          onConnectedRef.current?.();
        } else if (status === 'TIMED_OUT') {
          // Handle timeout specifically - always retryable
          console.warn(`[useRealtimeChannel:${channelName}] Connection timed out`);
          setIsConnected(false);
          channelRef.current = null;
          setError('連線逾時，正在重新連線...');
          setErrorType('TIMED_OUT');
          onDisconnectedRef.current?.('TIMED_OUT');

          if (!isCleanedUp && retryManager.canRetry()) {
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log(
                `[useRealtimeChannel:${channelName}] Attempting reconnection after timeout...`
              );
              setupChannel();
            });
          } else {
            setRetryExhausted(true);
            setIsRetrying(false);
            setError('無法連接到即時服務，請重新整理頁面');
          }
        } else if (err || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.error(
            `[useRealtimeChannel:${channelName}] Subscribe error:`,
            err || status
          );
          setIsConnected(false);
          channelRef.current = null;

          // Classify the error for appropriate handling
          const classifiedError = classifyRealtimeError(status, err);
          setError(classifiedError.userMessage);
          setErrorType(classifiedError.type);
          onDisconnectedRef.current?.(classifiedError.type);

          // Handle based on error classification
          if (!classifiedError.isRetryable) {
            // Non-retryable errors: graceful degradation
            console.warn(
              `[useRealtimeChannel:${channelName}] Non-retryable error (${classifiedError.type}), degrading gracefully`
            );
            setRetryExhausted(true);
            setIsRetrying(false);
            return;
          }

          // Attempt retry with exponential backoff for retryable errors
          if (!isCleanedUp && retryManager.canRetry()) {
            setIsRetrying(true);
            setRemainingRetries(retryManager.getRemainingRetries());
            retryManager.scheduleRetry(() => {
              console.log(
                `[useRealtimeChannel:${channelName}] Attempting reconnection...`
              );
              setupChannel();
            });
          } else if (!retryManager.canRetry()) {
            setRetryExhausted(true);
            setIsRetrying(false);
            setError('無法連接到即時服務，請重新整理頁面');
          }
        }
      });
    };

    setupChannel();

    // Cleanup function
    return () => {
      isCleanedUp = true;
      if (retryManagerRef.current) {
        retryManagerRef.current.cleanup();
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [channelName, enabled, channelConfig, retryConfig.maxRetries, retryConfig.initialDelayMs, retryConfig.maxDelayMs]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log(`[useRealtimeChannel:${channelName}] Manual reconnect requested`);

    // Reset retry manager
    if (retryManagerRef.current) {
      retryManagerRef.current.reset();
    }

    // Reset state
    setRetryExhausted(false);
    setIsRetrying(false);
    setRemainingRetries(
      retryConfig.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries
    );
    setError(null);
    setErrorType(null);

    // Trigger reconnection
    if (setupChannelRef.current) {
      setupChannelRef.current();
    }
  }, [channelName, retryConfig.maxRetries]);

  return {
    channel: channelRef.current,
    isConnected,
    error,
    errorType,
    isRetrying,
    remainingRetries,
    retryExhausted,
    reconnect,
  };
}
