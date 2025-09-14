'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api/auth';
import { roomsAPI, Room } from '@/lib/api/rooms';
import QRCodeModal from '@/components/QRCodeModal';

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [qrModalRoom, setQrModalRoom] = useState<Room | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (!authAPI.isAuthenticated()) {
        router.push('/login');
        return false;
      }

      const userData = authAPI.getStoredUser();
      if (!userData) {
        router.push('/login');
        return false;
      }

      setUser(userData);
      return true;
    };

    const loadRooms = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);
        const myRooms = await roomsAPI.getMyRooms();
        setRooms(myRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [router]);

  const handleLogout = () => {
    authAPI.logout();
  };

  const copyShareLink = async (shareCode: string) => {
    const shareLink = roomsAPI.generateShareLink(shareCode);
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('分享連結已複製到剪貼簿！');
    } catch (err) {
      alert(`分享連結：${shareLink}`);
    }
  };

  const handleCloseRoom = async (roomId: string, roomName: string) => {
    if (confirm(`確定要結束「${roomName}」嗎？房間將會關閉。`)) {
      try {
        await roomsAPI.closeRoom(roomId);
        alert('房間已結束');
        // Reload rooms
        const myRooms = await roomsAPI.getMyRooms();
        setRooms(myRooms);
      } catch (error) {
        console.error('Failed to close room:', error);
        alert('結束房間失敗，請重試');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">載入中...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">房間管理</h1>
              <p className="text-sm text-gray-600">歡迎回來，{user.full_name || user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                儀表板
              </Link>
              <Link
                href="/rooms/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 創建新房間
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入房間列表中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有創建任何房間</h3>
            <p className="text-gray-600 mb-6">創建您的第一個諮詢房間來開始使用系統</p>
            <Link
              href="/rooms/create"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              創建第一個房間
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
                      {room.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        room.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {room.is_active ? '活躍' : '已關閉'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span>分享碼：</span>
                      <span className="font-mono font-medium text-blue-600">{room.share_code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>創建時間：</span>
                      <span>{formatDate(room.created_at)}</span>
                    </div>
                    {room.expires_at && (
                      <div className="flex items-center justify-between">
                        <span>有效期限：</span>
                        <span className={isExpired(room.expires_at) ? 'text-red-600' : ''}>
                          {isExpired(room.expires_at) ? '已過期' : formatDate(room.expires_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/room/${room.id}`}
                      className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      進入房間
                    </Link>
                    <button
                      onClick={() => copyShareLink(room.share_code)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                      title="複製分享連結"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setQrModalRoom(room)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                      title="顯示 QR Code"
                    >
                      📱
                    </button>
                    {room.is_active && (
                      <button
                        onClick={() => handleCloseRoom(room.id, room.name)}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                        title="結束房間"
                      >
                        結束
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        {qrModalRoom && (
          <QRCodeModal
            room={qrModalRoom}
            isOpen={!!qrModalRoom}
            onClose={() => setQrModalRoom(null)}
          />
        )}
      </main>
    </div>
  );
}
