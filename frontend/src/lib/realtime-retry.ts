/**
 * Supabase Realtime Connection Retry Utility
 *
 * Prevents quota exhaustion by implementing:
 * 1. Exponential backoff (1s, 2s, 4s, 8s... max 30s)
 * 2. Maximum retry attempts (default 5)
 * 3. Jitter to prevent thundering herd
 */

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
};

export class RealtimeRetryManager {
  private retryCount = 0;
  private config: Required<RetryConfig>;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(config: RetryConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
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
      return false;
    }

    const delay = this.getNextDelay();
    this.retryCount++;

    console.log(`[RealtimeRetry] Scheduling retry ${this.retryCount}/${this.config.maxRetries} in ${Math.round(delay)}ms`);

    this.timeoutId = setTimeout(callback, delay);
    return true;
  }

  /**
   * Reset retry count (call on successful connection)
   */
  reset(): void {
    this.retryCount = 0;
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
}

/**
 * Hook-friendly retry state manager
 */
export function createRetryManager(config?: RetryConfig): RealtimeRetryManager {
  return new RealtimeRetryManager(config);
}
