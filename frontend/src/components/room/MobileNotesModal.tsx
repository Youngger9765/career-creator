/**
 * MobileNotesModal - 手機版筆記+截圖模態框
 *
 * 支援：
 * 1. 先寫筆記後截圖
 * 2. 先截圖後寫筆記
 * 3. 只寫筆記不截圖
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Camera, X, Save } from 'lucide-react';

interface MobileNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string, screenshotBlob: Blob | null) => Promise<void>;
  onCapture: () => Promise<Blob | null>;
  isSubmitting?: boolean;
}

export function MobileNotesModal({
  isOpen,
  onClose,
  onSubmit,
  onCapture,
  isSubmitting = false,
}: MobileNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 清除狀態當 modal 關閉
  useEffect(() => {
    if (!isOpen) {
      // 延遲清除，避免動畫時閃爍
      setTimeout(() => {
        setNotes('');
        setScreenshotUrl(null);
        setScreenshotBlob(null);
      }, 300);
    }
  }, [isOpen]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const blob = await onCapture();
      if (blob) {
        setScreenshotBlob(blob);
        const url = URL.createObjectURL(blob);
        setScreenshotUrl(url);
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('截圖失敗，請重試');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!notes.trim() && !screenshotBlob) {
      alert('請至少輸入筆記或截圖');
      return;
    }

    try {
      await onSubmit(notes, screenshotBlob);
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
      alert('送出失敗，請重試');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[70] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">諮詢記錄</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              諮詢筆記
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="記錄本次諮詢的重點、發現、後續建議..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{notes.length} 字</div>
          </div>

          {/* Screenshot Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              牌卡截圖
            </label>

            {screenshotUrl ? (
              <div className="relative">
                <img
                  src={screenshotUrl}
                  alt="截圖預覽"
                  className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => {
                    setScreenshotUrl(null);
                    setScreenshotBlob(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">尚未截圖</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <button
            onClick={handleCapture}
            disabled={isCapturing || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
          >
            <Camera className="w-5 h-5" />
            {isCapturing ? '截圖中...' : screenshotUrl ? '重新截圖' : '截圖牌卡畫面'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!notes.trim() && !screenshotBlob)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? '送出中...' : '送出記錄'}
          </button>
        </div>
      </div>
    </>
  );
}
