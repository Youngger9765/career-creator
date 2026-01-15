'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomsAPI } from '../../lib/api/rooms';
import Link from 'next/link';
import Image from 'next/image';

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
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logos/current/logo.png"
              alt="職游 Logo"
              width={120}
              height={120}
              className="mx-auto"
              priority
            />
          </Link>
        </div>

        {/* 主卡片 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">加入諮詢室</h1>
            <p className="text-gray-500">輸入諮詢師提供的分享碼</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Share Code Input */}
            <div>
              <label
                htmlFor="shareCode"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                諮詢室分享碼
              </label>
              <input
                id="shareCode"
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-gray-200 bg-white text-gray-900 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-center text-3xl font-mono tracking-[0.5em] placeholder:text-gray-300 placeholder:tracking-[0.3em] transition-all"
                required
                disabled={isVerifying}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2 text-center">6 位英數字分享碼</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <div className="text-sm text-red-600 text-center">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || shareCode.length !== 6}
              className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  驗證中...
                </span>
              ) : (
                '加入諮詢室'
              )}
            </button>
          </form>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首頁
            </Link>
          </div>
        </div>

        {/* 底部說明 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            沒有分享碼？請聯繫您的諮詢師取得
          </p>
        </div>
      </div>
    </main>
  );
}
