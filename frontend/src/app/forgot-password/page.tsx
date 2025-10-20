'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setDevToken(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '請求失敗');
      }

      const data = await response.json();
      setSuccess(true);

      // In development, show the token
      if (data.dev_token) {
        setDevToken(data.dev_token);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : '請求失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">忘記密碼</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            輸入您的電子信箱，我們將發送重設密碼連結給您
          </p>
        </div>

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {devToken
                    ? '重設密碼連結已產生（開發模式）'
                    : '如果該電子信箱存在，您將收到重設密碼的連結'}
                </p>
              </div>
            </div>
          </div>
        )}

        {devToken && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-yellow-800 mb-2">開發模式：重設密碼連結</p>
              <a
                href={`/reset-password?token=${devToken}`}
                className="text-sm text-blue-600 hover:text-blue-800 break-all"
              >
                /reset-password?token={devToken}
              </a>
              <p className="text-xs text-yellow-700 mt-2">
                在正式環境中，此連結將透過電子郵件發送
              </p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
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
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="電子信箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? '發送中...' : '發送重設連結'}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <a href="/login" className="block text-sm text-gray-600 hover:text-gray-900">
            ← 返回登入
          </a>
        </div>
      </div>
    </div>
  );
}
