/**
 * Unified realtime connection state interface
 *
 * Ensures consistent connection state representation across all realtime hooks:
 * - use-card-sync.ts
 * - use-game-card-sync.ts
 * - use-unified-card-sync.ts
 */

import type { RealtimeErrorType } from '@/lib/realtime-retry';

/**
 * Unified connection state interface for all realtime hooks
 *
 * This interface provides a consistent API for consuming components
 * to display connection status, handle errors, and manage reconnection.
 */
export interface RealtimeConnectionState {
  /** Whether the realtime channel is currently connected */
  isConnected: boolean;

  /** User-friendly error message, null if no error */
  error: string | null;

  /** Classified error type for granular UI handling */
  errorType: RealtimeErrorType | null;

  /** Whether all retry attempts have been exhausted */
  retryExhausted: boolean;

  /** Whether a retry is currently scheduled/in progress */
  isRetrying: boolean;

  /** Number of retry attempts remaining */
  remainingRetries: number;

  /** Manual reconnection function */
  reconnect: () => void;
}
