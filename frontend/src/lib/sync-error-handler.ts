/**
 * 同步錯誤處理器
 * 提供統一的錯誤處理機制
 */

export enum SyncErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  SAVE_ERROR = 'SAVE_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface SyncError extends Error {
  type: SyncErrorType;
  context?: string;
  details?: any;
  timestamp?: number;
  retry?: boolean;
}

export class SyncErrorHandler {
  private static errorQueue: SyncError[] = [];
  private static maxRetries = 3;
  private static retryDelay = 1000; // 初始重試延遲（毫秒）

  /**
   * 處理同步錯誤
   */
  static handleSyncError(
    error: Error | SyncError,
    context: string,
    fallback?: () => void,
    retry: boolean = true
  ): void {
    const syncError = this.normalizeSyncError(error, context);

    // 記錄錯誤
    this.logError(syncError);

    // 顯示用戶友好的錯誤訊息
    this.showUserError(syncError);

    // 執行回滾邏輯
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error('[SyncErrorHandler] Fallback failed:', fallbackError);
      }
    }

    // 決定是否重試
    if (retry && syncError.retry !== false) {
      this.scheduleRetry(syncError);
    }
  }

  /**
   * 標準化錯誤物件
   */
  private static normalizeSyncError(error: Error | SyncError, context: string): SyncError {
    if ('type' in error) {
      return error as SyncError;
    }

    const syncError: SyncError = new Error(error.message) as SyncError;
    syncError.type = this.determineErrorType(error, context);
    syncError.context = context;
    syncError.timestamp = Date.now();
    syncError.stack = error.stack;

    // 根據錯誤類型決定是否重試
    syncError.retry = this.shouldRetry(syncError.type);

    return syncError;
  }

  /**
   * 判斷錯誤類型
   */
  private static determineErrorType(error: Error, context: string): SyncErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return SyncErrorType.CONNECTION_ERROR;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return SyncErrorType.PERMISSION_ERROR;
    }
    if (message.includes('conflict')) {
      return SyncErrorType.CONFLICT_ERROR;
    }
    if (context.includes('save')) {
      return SyncErrorType.SAVE_ERROR;
    }
    if (context.includes('sync')) {
      return SyncErrorType.SYNC_ERROR;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return SyncErrorType.VALIDATION_ERROR;
    }

    return SyncErrorType.UNKNOWN_ERROR;
  }

  /**
   * 決定是否應該重試
   */
  private static shouldRetry(errorType: SyncErrorType): boolean {
    switch (errorType) {
      case SyncErrorType.CONNECTION_ERROR:
      case SyncErrorType.SAVE_ERROR:
      case SyncErrorType.SYNC_ERROR:
        return true;
      case SyncErrorType.PERMISSION_ERROR:
      case SyncErrorType.VALIDATION_ERROR:
        return false;
      case SyncErrorType.CONFLICT_ERROR:
        return true; // 衝突可以通過重試解決
      default:
        return false;
    }
  }

  /**
   * 顯示用戶友好的錯誤訊息
   */
  private static showUserError(error: SyncError): void {
    const message = this.getUserFriendlyMessage(error);

    // 這裡應該整合你的 toast/notification 系統
    // 暫時使用 console
    console.warn(`[User Notice] ${message}`);

    // 如果有全域的 toast 系統，可以這樣使用：
    // if (window.showToast) {
    //   window.showToast({
    //     type: 'error',
    //     message,
    //     duration: 5000,
    //   });
    // }
  }

  /**
   * 取得用戶友好的錯誤訊息
   */
  private static getUserFriendlyMessage(error: SyncError): string {
    switch (error.type) {
      case SyncErrorType.CONNECTION_ERROR:
        return '連線中斷，正在嘗試重新連線...';
      case SyncErrorType.SAVE_ERROR:
        return '儲存失敗，請檢查網路連線';
      case SyncErrorType.SYNC_ERROR:
        return '同步失敗，資料可能不是最新的';
      case SyncErrorType.PERMISSION_ERROR:
        return '您沒有權限執行此操作';
      case SyncErrorType.VALIDATION_ERROR:
        return '資料格式錯誤，請重新嘗試';
      case SyncErrorType.CONFLICT_ERROR:
        return '資料衝突，正在解決...';
      default:
        return '發生錯誤，請重新整理頁面';
    }
  }

  /**
   * 記錄錯誤用於分析
   */
  private static logError(error: SyncError): void {
    // 添加到錯誤隊列
    this.errorQueue.push(error);

    // 保持隊列大小在合理範圍
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50);
    }

    // 開發環境詳細記錄
    if (process.env.NODE_ENV === 'development') {
      console.error('[SyncErrorHandler] Error details:', {
        type: error.type,
        context: error.context,
        message: error.message,
        timestamp: new Date(error.timestamp || Date.now()).toISOString(),
        stack: error.stack,
      });
    }

    // 生產環境可以發送到錯誤追蹤服務
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToErrorTracking(error);
    // }
  }

  /**
   * 安排重試
   */
  private static scheduleRetry(error: SyncError): void {
    const retryCount = this.getRetryCount(error);

    if (retryCount >= this.maxRetries) {
      console.error('[SyncErrorHandler] Max retries reached for:', error.context);
      return;
    }

    // 指數退避
    const delay = this.retryDelay * Math.pow(2, retryCount);

    console.log(
      `[SyncErrorHandler] Scheduling retry ${retryCount + 1}/${this.maxRetries} in ${delay}ms`
    );

    setTimeout(() => {
      // 這裡應該觸發實際的重試邏輯
      // 需要與具體的同步機制整合
      this.incrementRetryCount(error);
    }, delay);
  }

  /**
   * 取得重試次數
   */
  private static getRetryCount(error: SyncError): number {
    const key = `${error.type}_${error.context}`;
    const stored = sessionStorage.getItem(`retry_${key}`);
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * 增加重試次數
   */
  private static incrementRetryCount(error: SyncError): void {
    const key = `${error.type}_${error.context}`;
    const count = this.getRetryCount(error);
    sessionStorage.setItem(`retry_${key}`, String(count + 1));
  }

  /**
   * 清除重試計數
   */
  static clearRetryCount(context: string): void {
    const keys = Object.keys(sessionStorage).filter(
      (key) => key.startsWith('retry_') && key.includes(context)
    );
    keys.forEach((key) => sessionStorage.removeItem(key));
  }

  /**
   * 取得錯誤統計
   */
  static getErrorStats(): {
    total: number;
    byType: Record<SyncErrorType, number>;
    recent: SyncError[];
  } {
    const byType: Record<SyncErrorType, number> = {} as any;

    for (const errorType of Object.values(SyncErrorType)) {
      byType[errorType as SyncErrorType] = 0;
    }

    this.errorQueue.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      byType,
      recent: this.errorQueue.slice(-10),
    };
  }

  /**
   * 清除錯誤隊列
   */
  static clearErrorQueue(): void {
    this.errorQueue = [];
  }
}
