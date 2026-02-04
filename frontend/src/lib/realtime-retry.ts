/**
 * Supabase Realtime Connection Retry Utility
 *
 * Prevents quota exhaustion by implementing:
 * 1. Exponential backoff (1s, 2s, 4s, 8s... max 30s)
 * 2. Maximum retry attempts (default 5)
 * 3. Jitter to prevent thundering herd
 * 4. Error classification for appropriate handling
 */

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Supabase Realtime error types for granular handling
 */
export type RealtimeErrorType =
  | 'CHANNEL_ERROR'      // Generic channel error
  | 'TIMED_OUT'          // Connection timeout
  | 'CLOSED'             // Channel closed (possibly by server)
  | 'RATE_LIMITED'       // 429 / quota exceeded
  | 'UNAUTHORIZED'       // Auth issues
  | 'NETWORK_ERROR'      // Network connectivity issues
  | 'UNKNOWN';           // Unclassified errors

/**
 * Whether an error type is retryable
 */
export const RETRYABLE_ERRORS: Set<RealtimeErrorType> = new Set([
  'CHANNEL_ERROR',
  'TIMED_OUT',
  'NETWORK_ERROR',
]);

/**
 * Errors that should NOT trigger retry (graceful degradation instead)
 */
export const NON_RETRYABLE_ERRORS: Set<RealtimeErrorType> = new Set([
  'RATE_LIMITED',
  'UNAUTHORIZED',
]);

export interface ClassifiedError {
  type: RealtimeErrorType;
  message: string;
  userMessage: string;  // User-friendly message for UI
  isRetryable: boolean;
  originalError?: unknown;
}

/**
 * Classify a Supabase Realtime error for appropriate handling
 */
export function classifyRealtimeError(
  status: string | undefined,
  error: unknown
): ClassifiedError {
  const errorMsg = error instanceof Error
    ? error.message
    : String(error || '');
  const statusStr = status || '';

  // Check for rate limiting / quota
  if (
    errorMsg.includes('quota') ||
    errorMsg.includes('rate_limit') ||
    errorMsg.includes('429') ||
    errorMsg.includes('Too Many Requests')
  ) {
    return {
      type: 'RATE_LIMITED',
      message: errorMsg || 'Rate limit exceeded',
      userMessage: '服務繁忙，請稍後再試',
      isRetryable: false,
      originalError: error,
    };
  }

  // Check for unauthorized
  if (
    errorMsg.includes('unauthorized') ||
    errorMsg.includes('401') ||
    errorMsg.includes('forbidden') ||
    errorMsg.includes('403')
  ) {
    return {
      type: 'UNAUTHORIZED',
      message: errorMsg || 'Unauthorized',
      userMessage: '連線驗證失敗，請重新登入',
      isRetryable: false,
      originalError: error,
    };
  }

  // Check status-based errors
  if (statusStr === 'TIMED_OUT' || errorMsg.includes('timeout')) {
    return {
      type: 'TIMED_OUT',
      message: errorMsg || 'Connection timed out',
      userMessage: '連線逾時，正在重新連線...',
      isRetryable: true,
      originalError: error,
    };
  }

  if (statusStr === 'CLOSED') {
    return {
      type: 'CLOSED',
      message: errorMsg || 'Channel closed',
      userMessage: '連線已中斷',
      isRetryable: true, // Could be server-side issue, worth retrying
      originalError: error,
    };
  }

  if (statusStr === 'CHANNEL_ERROR') {
    return {
      type: 'CHANNEL_ERROR',
      message: errorMsg || 'Channel error',
      userMessage: '連線發生錯誤，正在重新連線...',
      isRetryable: true,
      originalError: error,
    };
  }

  // Check for network errors
  if (
    errorMsg.includes('network') ||
    errorMsg.includes('fetch') ||
    errorMsg.includes('ECONNREFUSED') ||
    errorMsg.includes('Failed to fetch')
  ) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMsg || 'Network error',
      userMessage: '網路連線不穩定，正在重新連線...',
      isRetryable: true,
      originalError: error,
    };
  }

  // Unknown error - default to retryable for resilience
  return {
    type: 'UNKNOWN',
    message: errorMsg || 'Unknown error',
    userMessage: '連線發生問題',
    isRetryable: true,
    originalError: error,
  };
}

// ============================================================================
// Retry Configuration
// ============================================================================

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  onRetryScheduled?: (attempt: number, delayMs: number) => void;
  onRetryExhausted?: () => void;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetryScheduled' | 'onRetryExhausted'>> & Pick<RetryConfig, 'onRetryScheduled' | 'onRetryExhausted'> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
  onRetryScheduled: undefined,
  onRetryExhausted: undefined,
};

export class RealtimeRetryManager {
  private retryCount = 0;
  private config: typeof DEFAULT_CONFIG;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastError: ClassifiedError | null = null;

  constructor(config: RetryConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the last classified error
   */
  getLastError(): ClassifiedError | null {
    return this.lastError;
  }

  /**
   * Set the last error (for tracking)
   */
  setLastError(error: ClassifiedError): void {
    this.lastError = error;
  }

  /**
   * Calculate next delay with exponential backoff and jitter
   */
  private getNextDelay(): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(2, this.retryCount);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * (Math.random() - 0.5) * 2;
    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Check if we can retry
   */
  canRetry(): boolean {
    return this.retryCount < this.config.maxRetries;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Schedule a retry with exponential backoff
   * Returns false if max retries exceeded
   */
  scheduleRetry(callback: () => void): boolean {
    if (!this.canRetry()) {
      console.warn('[RealtimeRetry] Max retries exceeded, stopping reconnection attempts');
      this.config.onRetryExhausted?.();
      return false;
    }

    const delay = this.getNextDelay();
    this.retryCount++;

    console.log(`[RealtimeRetry] Scheduling retry ${this.retryCount}/${this.config.maxRetries} in ${Math.round(delay)}ms`);
    this.config.onRetryScheduled?.(this.retryCount, delay);

    this.timeoutId = setTimeout(callback, delay);
    return true;
  }

  /**
   * Handle an error with automatic classification and retry decision
   * Returns true if retry was scheduled, false if graceful degradation should occur
   */
  handleError(
    status: string | undefined,
    error: unknown,
    retryCallback: () => void
  ): { scheduled: boolean; classifiedError: ClassifiedError } {
    const classifiedError = classifyRealtimeError(status, error);
    this.lastError = classifiedError;

    console.log(`[RealtimeRetry] Error classified as ${classifiedError.type}: ${classifiedError.message}`);

    if (!classifiedError.isRetryable) {
      console.warn(`[RealtimeRetry] Error is not retryable (${classifiedError.type}), graceful degradation`);
      return { scheduled: false, classifiedError };
    }

    const scheduled = this.scheduleRetry(retryCallback);
    return { scheduled, classifiedError };
  }

  /**
   * Reset retry count (call on successful connection)
   */
  reset(): void {
    this.retryCount = 0;
    this.lastError = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Cleanup (call on unmount)
   */
  cleanup(): void {
    this.reset();
  }

  /**
   * Check if currently in a retry cycle
   */
  isRetrying(): boolean {
    return this.timeoutId !== null;
  }

  /**
   * Get remaining retries
   */
  getRemainingRetries(): number {
    return Math.max(0, this.config.maxRetries - this.retryCount);
  }
}

/**
 * Hook-friendly retry state manager
 */
export function createRetryManager(config?: RetryConfig): RealtimeRetryManager {
  return new RealtimeRetryManager(config);
}
