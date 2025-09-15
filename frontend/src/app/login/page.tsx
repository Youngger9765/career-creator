'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          // Verify token is still valid by making a test request
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            // Token is valid, redirect to dashboard
            router.push('/dashboard');
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            setCheckingAuth(false);
          }
        } catch (error) {
          // Network error or token invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    console.log('Filling test account...');
    setEmail('demo.counselor@example.com');
    setPassword('demo123');
  };

  const fillTestAccount2 = () => {
    console.log('Filling test account 2...');
    setEmail('test@example.com');
    setPassword('demo123');
  };

  const fillCounselorAccount = () => {
    console.log('Filling counselor account...');
    setEmail('counselor@example.com');
    setPassword('test1234');
  };

  const fillAdminAccount = () => {
    console.log('Filling admin account...');
    setEmail('admin@example.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">諮詢師登入</h2>
          <p className="mt-2 text-center text-sm text-gray-600">登入您的諮詢師帳號</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                電子信箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="電子信箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </div>

          <div className="text-center">
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              還沒有帳號？立即註冊
            </a>
          </div>
        </form>

        {/* Demo accounts for testing */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">開發測試帳號</h3>

          {/* Demo Account 1 */}
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-800">Demo 諮詢師</p>
                <p className="text-xs text-gray-600">demo.counselor@example.com / demo123</p>
              </div>
              <button
                type="button"
                onClick={fillTestAccount}
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                填入
              </button>
            </div>
          </div>

          {/* Test Account */}
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-800">測試諮詢師</p>
                <p className="text-xs text-gray-600">test@example.com / demo123</p>
              </div>
              <button
                type="button"
                onClick={fillTestAccount2}
                className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                填入
              </button>
            </div>
          </div>

          {/* Counselor Account */}
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-800">王諮詢師</p>
                <p className="text-xs text-gray-600">counselor@example.com / test1234</p>
              </div>
              <button
                type="button"
                onClick={fillCounselorAccount}
                className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                填入
              </button>
            </div>
          </div>

          {/* Admin Account */}
          <div className="p-2 bg-white rounded border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-800">系統管理員</p>
                <p className="text-xs text-gray-600">admin@example.com / admin123</p>
              </div>
              <button
                type="button"
                onClick={fillAdminAccount}
                className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                填入
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← 回到首頁
          </a>
        </div>
      </div>
    </div>
  );
}
