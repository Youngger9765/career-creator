'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomsAPI, Room } from '@/lib/api/rooms';

export default function JoinByShareCodePage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = Array.isArray(params.shareCode) ? params.shareCode[0] : params.shareCode;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const loadRoom = async () => {
      if (!shareCode) {
        setError('無效的分享碼');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const roomData = await roomsAPI.getRoomByShareCode(shareCode.toUpperCase());
        setRoom(roomData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '房間不存在或已關閉');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [shareCode]);

  const handleJoinAsVisitor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room || !visitorName.trim()) return;

    try {
      setJoining(true);

      // Store visitor session in localStorage
      const visitorSession = {
        shareCode: room.share_code,
        name: visitorName.trim(),
        joinedAt: new Date().toISOString(),
        sessionId: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      localStorage.setItem('visitor_session', JSON.stringify(visitorSession));

      // Redirect to room
      router.push(`/room/${room.id}?visitor=true&name=${encodeURIComponent(visitorName)}`);
    } catch (error) {
      console.error('Failed to join as visitor:', error);
      setError('加入房間失敗，請重試');
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在驗證房間...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">無法加入房間</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href="/join"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新輸入分享碼
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Room Info Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">加入諮詢房間</h1>
            <div className="bg-blue-500 rounded-lg p-3">
              <div className="text-lg font-semibold">{room.name}</div>
              {room.description && (
                <div className="text-sm text-blue-100 mt-1">{room.description}</div>
              )}
            </div>
          </div>
        </div>

        {/* Join Form */}
        <div className="p-6">
          <form onSubmit={handleJoinAsVisitor} className="space-y-6">
            {/* Room Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>房間代碼：</span>
                <span className="font-mono font-bold text-blue-600">{room.share_code}</span>
              </div>
              <div className="flex justify-between">
                <span>創建時間：</span>
                <span>{formatDate(room.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>狀態：</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {room.is_active ? '開放中' : '已關閉'}
                </span>
              </div>
            </div>

            {/* Visitor Name Input */}
            <div>
              <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-2">
                請輸入您的姓名 *
              </label>
              <input
                id="visitorName"
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="您的姓名或暱稱"
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!room.is_active}
              />
              <p className="text-xs text-gray-500 mt-1">此姓名將顯示給諮詢師</p>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">🔒 隱私說明</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 您將以訪客身份參與諮詢</div>
                <div>• 您的操作將被記錄用於諮詢分析</div>
                <div>• 不會收集其他個人資訊</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={joining || !visitorName.trim() || !room.is_active}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {joining ? '正在加入...' : '加入諮詢房間'}
              </button>

              {!room.is_active && (
                <div className="text-center text-sm text-red-600">此房間已關閉，無法加入</div>
              )}
            </div>
          </form>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
            <Link href="/join" className="block text-blue-600 hover:text-blue-700 text-sm">
              ← 重新輸入分享碼
            </Link>
            <Link href="/" className="block text-gray-600 hover:text-gray-900 text-sm">
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
