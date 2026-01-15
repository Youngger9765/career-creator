'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { roomsAPI, Room } from '../../../lib/api/rooms';
import { useVisitorJoin } from '../../../hooks/use-visitor-join';

export default function JoinByShareCodePage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = Array.isArray(params.shareCode) ? params.shareCode[0] : params.shareCode;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState('');

  const visitorJoin = useVisitorJoin();

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
        setError(err instanceof Error ? err.message : '諮詢室不存在或已關閉');
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
      await visitorJoin.joinRoomAndRedirect(room.share_code, visitorName.trim());
    } catch (error) {
      console.error('Failed to join as visitor:', error);
      setError(error instanceof Error ? error.message : '加入諮詢室失敗，請重試');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-600">正在驗證諮詢室...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-6">
            <Link href="/">
              <Image
                src="/logos/current/logo.png"
                alt="職游"
                width={80}
                height={80}
                className="mx-auto"
              />
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center border border-white/50">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">無法加入諮詢室</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/join"
                className="block w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all font-medium shadow-lg shadow-amber-500/25"
              >
                重新輸入分享碼
              </Link>
              <Link
                href="/"
                className="block w-full px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <Image
              src="/logos/current/logo.png"
              alt="職游"
              width={80}
              height={80}
              className="mx-auto"
            />
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/50">
          {/* Room Info Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-3">加入諮詢室</h1>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-lg font-semibold">{room.name}</div>
                {room.description && (
                  <div className="text-sm text-teal-100 mt-1">{room.description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Join Form */}
          <div className="p-6">
            <form onSubmit={handleJoinAsVisitor} className="space-y-5">
              {/* Room Details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">諮詢室代碼</span>
                  <span className="font-mono font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{room.share_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">創建時間</span>
                  <span className="text-gray-700">{formatDate(room.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">狀態</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {room.is_active ? '開放中' : '已關閉'}
                  </span>
                </div>
              </div>

              {/* Visitor Name Input */}
              <div>
                <label htmlFor="visitorName" className="block text-sm font-medium text-gray-600 mb-2">
                  請輸入您的姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="visitorName"
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="您的姓名或暱稱"
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 bg-white text-gray-900 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                  required
                  disabled={!room.is_active}
                />
                <p className="text-xs text-gray-400 mt-2">此姓名將顯示給諮詢師</p>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  隱私說明
                </h3>
                <div className="text-xs text-amber-700 space-y-1">
                  <div>• 您將以訪客身份參與諮詢</div>
                  <div>• 您的操作將被記錄用於諮詢分析</div>
                  <div>• 不會收集其他個人資訊</div>
                </div>
              </div>

              {/* Error Display */}
              {(error || visitorJoin.error) && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="text-sm text-red-600 text-center">{error || visitorJoin.error}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={visitorJoin.isLoading || !visitorName.trim() || !room.is_active}
                  className="w-full py-4 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl hover:from-teal-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                >
                  {visitorJoin.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      正在加入...
                    </span>
                  ) : (
                    '加入諮詢室'
                  )}
                </button>

                {!room.is_active && (
                  <div className="text-center text-sm text-red-500 bg-red-50 py-2 rounded-xl">
                    此諮詢室已關閉，無法加入
                  </div>
                )}
              </div>
            </form>

            {/* Navigation */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-6">
              <Link href="/join" className="inline-flex items-center gap-1 text-gray-500 hover:text-teal-600 text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                重新輸入
              </Link>
              <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
