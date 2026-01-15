'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authAPI } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 判斷是否為開發環境
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Simple token check
    const token = localStorage.getItem('access_token');
    if (token) {
      // Has token, redirect to dashboard
      router.push('/dashboard');
    } else {
      setCheckingAuth(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-2 text-gray-600">檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ email, password });
      console.log('Login successful:', response);

      // authAPI already stores token and user in localStorage
      // Check if user must change password
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.must_change_password) {
          // Redirect to change password page
          window.location.href = '/change-password';
          return;
        }
      }

      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = () => {
    setEmail('demo.counselor@example.com');
    setPassword('demo123');
  };

  const fillTestAccount2 = () => {
    setEmail('test@example.com');
    setPassword('demo123');
  };

  const fillCounselorAccount = () => {
    setEmail('counselor@example.com');
    setPassword('test1234');
  };

  const fillAdminAccount = () => {
    setEmail('demo.admin@example.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <a href="/" className="inline-block">
            <Image
              src="/logos/current/logo.png"
              alt="職游 Logo"
              width={200}
              height={72}
              className="mx-auto"
              priority
            />
          </a>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-800">諮詢師登入</h2>
          <p className="mt-2 text-center text-sm text-gray-500">登入您的諮詢師帳號</p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                電子信箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="請輸入電子信箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-black bg-brand-gold hover:bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </div>

          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">
              忘記密碼？
            </a>
          </div>
        </form>

        {/* Demo accounts for testing - Development Only */}
        {isDevelopment && (
          <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-xl">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🛠️ 開發測試帳號</h3>

            <div className="space-y-2">
              <div className="p-2 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-800">Demo 諮詢師</p>
                  <p className="text-xs text-gray-500">demo.counselor@example.com</p>
                </div>
                <button
                  type="button"
                  onClick={fillTestAccount}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  填入
                </button>
              </div>

              <div className="p-2 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-800">測試諮詢師</p>
                  <p className="text-xs text-gray-500">test@example.com</p>
                </div>
                <button
                  type="button"
                  onClick={fillTestAccount2}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  填入
                </button>
              </div>

              <div className="p-2 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-800">王諮詢師</p>
                  <p className="text-xs text-gray-500">counselor@example.com</p>
                </div>
                <button
                  type="button"
                  onClick={fillCounselorAccount}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  填入
                </button>
              </div>

              <div className="p-2 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-800">系統管理員</p>
                  <p className="text-xs text-gray-500">demo.admin@example.com</p>
                </div>
                <button
                  type="button"
                  onClick={fillAdminAccount}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  填入
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">
            ← 回到首頁
          </a>
        </div>
      </div>
    </div>
  );
}
