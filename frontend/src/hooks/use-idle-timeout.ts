/**
 * useIdleTimeout Hook
 * 追蹤用戶閒置時間，30 分鐘無操作後顯示警告對話框
 * 60 秒倒數後若無回應，自動關閉房間連線
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseIdleTimeoutOptions {
  /**
   * 閒置超時時間（毫秒）
   * @default 30 * 60 * 1000 (30 minutes)
   */
  timeoutMs?: number;

  /**
   * 警告倒數時間（毫秒）
   * @default 60 * 1000 (60 seconds)
   */
  warningMs?: number;

  /**
   * 超時後的回調函數（自動存檔並關閉連線）
   */
  onTimeout: () => void;

  /**
   * 活動依賴項（任何變化都會重置計時器）
   */
  activities?: any[];

  /**
   * 是否啟用閒置超時（預設啟用）
   */
  enabled?: boolean;
}

export interface UseIdleTimeoutReturn {
  /**
   * 是否顯示警告對話框
   */
  showWarning: boolean;

  /**
   * 倒數秒數（60 -> 0）
   */
  countdown: number;

  /**
   * 重置計時器（用戶點擊「繼續」時調用）
   */
  resetTimer: () => void;

  /**
   * 手動觸發超時
   */
  triggerTimeout: () => void;
}

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 60 seconds

export function useIdleTimeout(options: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warningMs = DEFAULT_WARNING_MS,
    onTimeout,
    activities = [],
    enabled = true,
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningMs / 1000);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Keep onTimeout in ref to avoid re-subscribing
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  /**
   * Reset timer to current time
   */
  const resetTimer = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setShowWarning(false);
    setCountdown(warningMs / 1000);

    // Clear countdown interval if running
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Clear timeout if scheduled
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    console.log('[useIdleTimeout] Timer reset');
  }, [warningMs]);

  /**
   * Start countdown when warning is shown
   */
  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setCountdown(warningMs / 1000);

    console.log('[useIdleTimeout] 🔔 Starting warning countdown');

    // Countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          // Time's up - cleanup interval
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
        return Math.max(0, newCount);
      });
    }, 1000);

    // Schedule actual timeout
    timeoutIdRef.current = setTimeout(() => {
      console.log('[useIdleTimeout] ⏰ Timeout reached, triggering onTimeout');
      onTimeoutRef.current();
    }, warningMs);
  }, [warningMs]);

  /**
   * Manually trigger timeout
   */
  const triggerTimeout = useCallback(() => {
    console.log('[useIdleTimeout] Manual timeout trigger');
    onTimeoutRef.current();
  }, []);

  /**
   * Check idle time periodically
   */
  useEffect(() => {
    if (!enabled) {
      console.log('[useIdleTimeout] Disabled');
      return;
    }

    console.log('[useIdleTimeout] Starting idle check (timeout:', timeoutMs / 1000 / 60, 'min)');

    // Check every 10 seconds
    checkIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityTimeRef.current;

      // Only log when close to timeout (last 5 minutes)
      if (elapsed > timeoutMs - 5 * 60 * 1000 && elapsed < timeoutMs) {
        const remaining = Math.round((timeoutMs - elapsed) / 1000 / 60);
        console.log(`[useIdleTimeout] ⏳ ${remaining} minutes until idle timeout`);
      }

      if (elapsed >= timeoutMs && !showWarning) {
        console.log('[useIdleTimeout] 🚨 Idle timeout reached');
        startCountdown();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [enabled, timeoutMs, showWarning, startCountdown]);

  /**
   * Reset timer when activities change
   */
  useEffect(() => {
    if (!enabled) return;

    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...activities]);

  return {
    showWarning,
    countdown,
    resetTimer,
    triggerTimeout,
  };
}
