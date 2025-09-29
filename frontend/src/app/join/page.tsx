'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomsAPI } from '../../lib/api/rooms';
import Link from 'next/link';

export default function JoinRoomPage() {
  const router = useRouter();
  const [shareCode, setShareCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = shareCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError('請輸入 6 位分享碼');
      return;
    }

    setIsVerifying(true);
    try {
      // Verify room exists by share code
      const room = await roomsAPI.getRoomByShareCode(code);

      if (room) {
        // Room exists, redirect to join/[shareCode] page
        router.push(`/join/${code}`);
      }
    } catch (error: any) {
      console.error('Failed to verify room:', error);
      if (error.response?.status === 404) {
        setError('找不到此諮詢室，請確認分享碼是否正確');
      } else if (error.response?.status === 410) {
        setError('此諮詢室已過期或已結束');
      } else {
        setError('驗證失敗，請稍後再試');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">加入諮詢室</h1>
          <p className="text-gray-600 dark:text-gray-300">請輸入諮詢室分享碼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Share Code Input */}
          <div>
            <label
              htmlFor="shareCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              諮詢室分享碼
            </label>
            <input
              id="shareCode"
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              placeholder="請輸入 6 位分享碼 (例: ABC123)"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-wider placeholder:text-gray-400"
              required
              disabled={isVerifying}
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">分享碼由諮詢師提供</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying || shareCode.length !== 6}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isVerifying ? '驗證中...' : '繼續'}
          </button>
        </form>

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
