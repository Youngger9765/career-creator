'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '../../stores/room-store';
import { useAuthStore } from '../../stores/auth-store';
import { useVisitorJoin } from '../../hooks/use-visitor-join';
import Link from 'next/link';

export default function JoinRoomPage() {
  const router = useRouter();
  const { joinRoomByShareCode, isLoading, error } = useRoomStore();
  const { isAuthenticated, user } = useAuthStore();
  const visitorJoin = useVisitorJoin();

  const [shareCode, setShareCode] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [joinAsVisitor, setJoinAsVisitor] = useState(!isAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shareCode.trim()) {
      return;
    }

    try {
      if (joinAsVisitor || !isAuthenticated) {
        // Validate visitor name
        if (!visitorName.trim()) {
          return;
        }

        // Join as visitor using the new API
        await visitorJoin.joinRoomAndRedirect(shareCode.trim().toUpperCase(), visitorName.trim());
        return;
      }

      // Join as authenticated user
      await joinRoomByShareCode(shareCode.trim().toUpperCase());

      // Get the room ID and redirect
      const currentRoom = useRoomStore.getState().currentRoom;
      if (currentRoom) {
        router.push(`/room/${currentRoom.id}`);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">加入諮詢室</h1>
          <p className="text-gray-600">請輸入諮詢室分享碼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Share Code Input */}
          <div>
            <label htmlFor="shareCode" className="block text-sm font-medium text-gray-700 mb-2">
              諮詢室分享碼
            </label>
            <input
              id="shareCode"
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              placeholder="請輸入 6 位分享碼 (例: ABC123)"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-wider"
              required
            />
            <p className="text-xs text-gray-500 mt-1">分享碼由諮詢師提供</p>
          </div>

          {/* Join Mode Selection */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">加入方式:</div>

            {isAuthenticated ? (
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="joinMode"
                    checked={!joinAsVisitor}
                    onChange={() => setJoinAsVisitor(false)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">以用戶身份加入</div>
                    <div className="text-sm text-gray-600">
                      使用 {user?.name} ({user?.roles.join(', ')})
                    </div>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="joinMode"
                    checked={joinAsVisitor}
                    onChange={() => setJoinAsVisitor(true)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">以訪客身份加入</div>
                    <div className="text-sm text-gray-600">匿名參與諮詢</div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">將以訪客身份加入諮詢室</div>
              </div>
            )}
          </div>

          {/* Visitor Name Input */}
          {joinAsVisitor && (
            <div>
              <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-2">
                您的姓名
              </label>
              <input
                id="visitorName"
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={joinAsVisitor}
              />
            </div>
          )}

          {/* Error Display */}
          {(error || visitorJoin.error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error || visitorJoin.error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              visitorJoin.isLoading ||
              !shareCode.trim() ||
              (joinAsVisitor && !visitorName.trim())
            }
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading || visitorJoin.isLoading ? '加入中...' : '加入諮詢室'}
          </button>
        </form>

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
          <Link href="/" className="block text-blue-600 hover:text-blue-700 text-sm">
            ← 返回首頁
          </Link>

          {!isAuthenticated && (
            <div className="text-sm text-gray-600">
              有帳號嗎？
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                立即登入
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
