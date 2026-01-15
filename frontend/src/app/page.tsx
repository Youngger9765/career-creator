'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DemoAccount } from '@/types/api';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { demoAccounts, loadDemoAccounts, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 判斷是否為開發環境
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsCheckingAuth(false);
    }
    if (isDevelopment) {
      loadDemoAccounts();
    }
  }, [router, loadDemoAccounts, isDevelopment]);

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

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Logo & Brand */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              alt="職游 Logo"
              width={280}
              height={100}
              className="h-auto"
              priority
            />
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            線上職涯牌卡諮詢平台
            <br />
            <span className="text-base text-gray-500">
              將實體牌卡數位化，支援遠距諮詢與資料累積
            </span>
          </p>
        </div>

        {/* Main CTA Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
          {/* 諮詢師登入 */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* 裝飾條 */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500"></div>
            <div className="p-8">
              <div className="text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-10 h-10 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">我是諮詢師</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  已有帳號的諮詢師請由此登入
                  <br />
                  管理您的諮詢室與客戶資料
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 px-6 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  諮詢師登入
                </Link>
              </div>
            </div>
          </div>

          {/* 訪客加入 */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* 裝飾條 */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-teal-500"></div>
            <div className="p-8">
              <div className="text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-10 h-10 text-teal-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">我要加入諮詢</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  使用諮詢師提供的分享碼
                  <br />
                  或掃描 QR Code 加入諮詢室
                </p>
                <Link
                  href="/join"
                  className="inline-block w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3.5 px-6 rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  加入諮詢室
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            平台特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">即時同步</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                智能輪詢技術
                <br />
                確保牌卡操作即時同步
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">免註冊訪客</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                來訪者無需註冊
                <br />
                輸入暱稱即可加入諮詢
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">歷史記錄</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                完整保存諮詢過程
                <br />
                牌卡操作與筆記記錄
              </p>
            </div>
          </div>
        </div>

        {/* Card Types Preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            三大牌卡 · 七種玩法
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 職游旅人卡 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🧭</span>
                </div>
                <h3 className="font-semibold text-gray-800">職游旅人卡</h3>
              </div>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  六大性格分析
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  職業收藏家
                </li>
              </ul>
            </div>

            {/* 職能盤點卡 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-800">職能盤點卡</h3>
              </div>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  優劣勢分析
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  成長計畫
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  職位拆解
                </li>
              </ul>
            </div>

            {/* 價值導航卡 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💎</span>
                </div>
                <h3 className="font-semibold text-gray-800">價值導航卡</h3>
              </div>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                  價值觀排序
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                  生活改造王
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Accounts Section - Development Only */}
        {isDevelopment && demoAccounts.length > 0 && (
          <div className="max-w-2xl mx-auto mt-16">
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                🛠️ 開發測試帳號
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-800 text-sm">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.description}</div>
                  </button>
                ))}
              </div>
              {isLoading && <div className="text-center text-gray-600 mt-4">登入中...</div>}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            {/* navicareer Logo */}
            <div className="flex justify-center mb-6">
              <a
                href="https://navicareer.tw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/navicareer-logo.png"
                  alt="職游 navicareer"
                  width={180}
                  height={60}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
            {/* Description */}
            <p className="text-center text-sm text-gray-500 leading-relaxed mb-6 px-4">
              職游是職涯助人者的成長導航，提供職涯諮詢師課程、獨家生涯牌卡與課程，
              <br className="hidden md:block" />
              並創造諮詢媒合、諮詢師交流等平台，期待無論是助人者還是來訪者，都能發揮所長，熱愛自己的生活！
            </p>
            {/* Copyright */}
            <div className="text-center">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} 職游 Career Creator. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
