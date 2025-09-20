'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/stores/room-store';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export default function CreateRoomPage() {
  const router = useRouter();
  const { createRoom, isLoading, error } = useRoomStore();
  const { isAuthenticated, user } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check localStorage for auth token
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setCheckingAuth(false);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      // If we have valid token but store not updated, update it
      if (!isAuthenticated && token) {
        useAuthStore.setState({
          user: userData,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }

    setCheckingAuth(false);
  }, [isAuthenticated]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expirationDays: 7, // Default 7 days
  });

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">檢查認證狀態...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">請先登入</h1>
          <p className="text-gray-600 mb-6">需要登入才能創建諮詢房間</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            前往登入頁面
          </Link>
        </div>
      </main>
    );
  }

  if (!user?.roles.includes('counselor') && !user?.roles.includes('admin')) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">權限不足</h1>
          <p className="text-gray-600 mb-6">只有諮詢師才能創建房間</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            返回首頁
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + formData.expirationDays);

      const room = await createRoom({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        expires_at: expiresAt.toISOString(),
      });

      // Redirect to the new room
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">創建諮詢房間</h1>
          <p className="text-gray-600">設定您的職業諮詢會話</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              房間名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="例：張同學的職業探索諮詢"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">房間名稱將顯示給所有參與者</p>
          </div>

          {/* Room Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              房間描述
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="描述這次諮詢的目標和重點..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 字 (選填)
            </p>
          </div>

          {/* Expiration Settings */}
          <div>
            <label
              htmlFor="expirationDays"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              房間有效期限
            </label>
            <select
              id="expirationDays"
              value={formData.expirationDays}
              onChange={(e) => handleInputChange('expirationDays', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value={1}>1 天</option>
              <option value={3}>3 天</option>
              <option value={7}>7 天（預設）</option>
              <option value={14}>14 天</option>
              <option value={30}>30 天</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              房間將在 {formData.expirationDays} 天後自動過期，過期後將無法進入
            </p>
          </div>

          {/* Counselor Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">諮詢師資訊</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div>
                <strong>姓名:</strong> {user.name}
              </div>
              <div>
                <strong>角色:</strong> {user.roles.join(', ')}
              </div>
              <div>
                <strong>信箱:</strong> {user.email}
              </div>
            </div>
          </div>

          {/* Room Features */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">房間功能特色</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                職業卡牌系統
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                即時協作
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                操作歷史記錄
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                分享碼加入
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link
              href="/"
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '創建中...' : '創建房間'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            創建房間後，系統會自動生成分享碼供客戶加入
          </div>
        </div>
      </div>
    </main>
  );
}
