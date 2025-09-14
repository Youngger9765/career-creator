'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DemoAccount } from '@/types/api';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user, demoAccounts, loadDemoAccounts, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDemoAccounts();
  }, [loadDemoAccounts]);

  const handleDemoLogin = async (account: DemoAccount) => {
    setIsLoading(true);
    try {
      await login({
        email: account.email,
        password: 'demo123',
      });
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 mb-6">Ready to start your career consultation session?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">
                  {user.roles.includes('counselor') ? 'Counselor Actions' : 'Your Options'}
                </h2>

                {user.roles.includes('counselor') && (
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-center"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      href="/rooms/create"
                      className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      Create New Room
                    </Link>
                    <Link
                      href="/rooms"
                      className="block w-full bg-blue-100 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-200 transition-colors text-center"
                    >
                      View My Rooms
                    </Link>
                  </div>
                )}

                <Link
                  href="/join"
                  className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center mt-3"
                >
                  Join Room by Code
                </Link>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-4">Quick Access</h2>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Role:</strong> {user.roles.join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email}
                  </div>
                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-center mt-4"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Career Creator</h1>
          <p className="text-xl text-gray-600 mb-2">線上職涯牌卡諮詢平台</p>
          <p className="text-lg text-gray-500">將實體牌卡數位化，支援遠距諮詢與資料累積</p>
        </div>

        {/* Main Actions */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Counselor Login */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">諮詢師登入</h3>
              <p className="text-sm text-gray-600 mb-4">已有帳號的諮詢師請由此登入</p>
              <Link
                href="/login"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                登入
              </Link>
            </div>
          </div>

          {/* New Registration */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-indigo-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">成為諮詢師</h3>
              <p className="text-sm text-gray-600 mb-4">註冊新帳號，開始線上諮詢</p>
              <Link
                href="/register"
                className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                立即註冊
              </Link>
            </div>
          </div>

          {/* Visitor Join */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">訪客加入</h3>
              <p className="text-sm text-gray-600 mb-4">使用分享碼或 QR Code 加入房間</p>
              <Link
                href="/join"
                className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                加入房間
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Accounts Section */}
        {demoAccounts.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 text-center">
                測試帳號（開發用）
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    className="p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-800 text-sm">{account.name}</div>
                    <div className="text-xs text-gray-600">{account.description}</div>
                  </button>
                ))}
              </div>
              {isLoading && <div className="text-center text-gray-600 mt-4">登入中...</div>}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">平台特色</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">即時同步</h3>
              <p className="text-sm text-gray-600">WebSocket 技術確保所有操作即時同步</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">免註冊訪客</h3>
              <p className="text-sm text-gray-600">來訪者無需註冊即可加入諮詢</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">歷史記錄</h3>
              <p className="text-sm text-gray-600">完整保存諮詢過程與牌卡操作記錄</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
