'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DemoAccount } from '@/types/api';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Users, FileText, Play } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { demoAccounts, loadDemoAccounts, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
      await login({ email: account.email, password: 'demo123' });
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section - 大膽的首屏設計 */}
      <section className="relative min-h-screen flex items-center">
        {/* 背景裝飾 - 有機形狀 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 主要漸層背景 */}
          <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-bl from-[#7AB7B7]/20 via-[#FFCC3A]/10 to-transparent" />
          {/* 有機形狀 */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#7AB7B7]/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#FFCC3A]/20 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-10 w-[200px] h-[200px] bg-[#0056A7]/10 rounded-full blur-2xl" />
          {/* 裝飾線條 - 移到不會干擾 logo 的位置 */}
          <div className="absolute top-[60%] left-20 w-20 h-1 bg-[#FFCC3A] rounded-full" />
          <div className="absolute bottom-1/3 right-1/3 w-16 h-1 bg-[#7AB7B7] rounded-full" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左側：文字內容 */}
            <div className="space-y-8">
              {/* Logo */}
              <div className="mb-4">
                <Image
                  src="/images/logo.png"
                  alt="職游 Logo"
                  width={200}
                  height={70}
                  className="h-auto"
                  priority
                />
              </div>

              {/* 大標題 - 表達性字型 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                讓職涯諮詢
                <br />
                <span className="text-[#7AB7B7]">更有溫度</span>
              </h1>

              {/* 副標題 */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                將實體牌卡數位化，打造遠距諮詢的最佳體驗。
                <br />
                <span className="text-gray-500">即時同步、免註冊訪客、完整記錄。</span>
              </p>

              {/* CTA 按鈕組 - 黑色主按鈕 */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white text-lg font-bold rounded-full hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  諮詢師登入
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-800 text-lg font-bold rounded-full border-2 border-gray-200 hover:border-[#7AB7B7] hover:text-[#7AB7B7] transition-all duration-300"
                >
                  加入諮詢室
                </Link>
              </div>
            </div>

            {/* 右側：視覺元素 - 卡片預覽 */}
            <div className="hidden lg:block relative">
              <div className="relative w-full h-[500px]">
                {/* 主卡片 */}
                <div className="absolute top-10 left-10 w-64 h-96 bg-white rounded-2xl shadow-2xl p-6 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-64 bg-gradient-to-br from-[#0056A7] to-[#0056A7]/80 rounded-xl flex items-center justify-center">
                    <span className="text-white text-6xl">🧭</span>
                  </div>
                  <p className="text-center mt-6 font-bold text-gray-800 text-xl">職游旅人卡</p>
                </div>
                {/* 次卡片 */}
                <div className="absolute top-32 right-10 w-56 h-80 bg-white rounded-2xl shadow-xl p-5 transform rotate-[8deg] hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-52 bg-gradient-to-br from-[#FFCC3A] to-[#FFCC3A]/80 rounded-xl flex items-center justify-center">
                    <span className="text-white text-5xl">📊</span>
                  </div>
                  <p className="text-center mt-4 font-bold text-gray-800 text-lg">職能盤點卡</p>
                </div>
                {/* 第三卡片 */}
                <div className="absolute bottom-10 left-1/3 w-48 h-72 bg-white rounded-2xl shadow-lg p-4 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-44 bg-gradient-to-br from-[#7AB7B7] to-[#7AB7B7]/80 rounded-xl flex items-center justify-center">
                    <span className="text-white text-4xl">💎</span>
                  </div>
                  <p className="text-center mt-4 font-bold text-gray-800 text-base">價值導航卡</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 向下滾動提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-gray-300 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* How It Works - 步驟引導 */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              三步驟開始諮詢
            </h2>
            <p className="text-gray-500 text-lg">簡單、快速、無負擔</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#FFCC3A] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black text-black">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">諮詢師登入</h3>
                <p className="text-gray-500">
                  使用您的帳號登入，進入專屬的諮詢管理後台。
                </p>
              </div>
              {/* 連接線 */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#7AB7B7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">邀請來訪者</h3>
                <p className="text-gray-500">
                  分享諮詢室連結或 QR Code，來訪者免註冊即可加入。
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200" />
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#0056A7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">開始諮詢</h3>
                <p className="text-gray-500">
                  選擇牌卡與玩法，即時同步操作，完整記錄諮詢過程。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - 功能亮點 */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左側：功能列表 */}
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                為諮詢師打造的
                <br />
                <span className="text-[#FFCC3A]">專業工具</span>
              </h2>

              <div className="space-y-6">
                {/* Feature Item */}
                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">即時同步</h3>
                    <p className="text-gray-500">智能輪詢技術，確保諮詢師與來訪者的操作即時同步。</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">免註冊訪客</h3>
                    <p className="text-gray-500">來訪者無需註冊帳號，輸入暱稱即可加入諮詢室。</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">完整記錄</h3>
                    <p className="text-gray-500">自動保存諮詢過程，包含牌卡操作、截圖與筆記。</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：三大牌卡 */}
            <div className="bg-gray-50 rounded-3xl p-8 lg:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                三大牌卡 · 七種玩法
              </h3>
              <div className="space-y-4">
                {/* 職游旅人卡 */}
                <div className="bg-white rounded-2xl p-5 border-l-4 border-[#0056A7] hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🧭</span>
                    <h4 className="font-bold text-gray-900">職游旅人卡</h4>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-[#0056A7]/10 text-[#0056A7] text-sm rounded-full font-medium">六大性格分析</span>
                    <span className="px-3 py-1 bg-[#0056A7]/10 text-[#0056A7] text-sm rounded-full font-medium">職業收藏家</span>
                  </div>
                </div>

                {/* 職能盤點卡 */}
                <div className="bg-white rounded-2xl p-5 border-l-4 border-[#FFCC3A] hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📊</span>
                    <h4 className="font-bold text-gray-900">職能盤點卡</h4>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-[#FFCC3A]/20 text-[#B8860B] text-sm rounded-full font-medium">優劣勢分析</span>
                    <span className="px-3 py-1 bg-[#FFCC3A]/20 text-[#B8860B] text-sm rounded-full font-medium">成長計畫</span>
                    <span className="px-3 py-1 bg-[#FFCC3A]/20 text-[#B8860B] text-sm rounded-full font-medium">職位拆解</span>
                  </div>
                </div>

                {/* 價值導航卡 */}
                <div className="bg-white rounded-2xl p-5 border-l-4 border-[#7AB7B7] hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">💎</span>
                    <h4 className="font-bold text-gray-900">價值導航卡</h4>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-[#7AB7B7]/20 text-[#5A9A9A] text-sm rounded-full font-medium">價值觀排序</span>
                    <span className="px-3 py-1 bg-[#7AB7B7]/20 text-[#5A9A9A] text-sm rounded-full font-medium">生活改造王</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - 行動呼籲 */}
      <section className="py-24 bg-gradient-to-br from-[#0056A7] to-[#003d75] relative overflow-hidden">
        {/* 裝飾 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7AB7B7]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FFCC3A]/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
              準備好開始了嗎？
            </h2>
            <p className="text-xl text-white/80 mb-10">
              立即體驗數位化職涯諮詢的全新可能
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#FFCC3A] text-black text-lg font-bold rounded-full hover:bg-[#FFD966] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                立即開始
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/10 text-white text-lg font-bold rounded-full border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                我是來訪者
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts - Development Only */}
      {isDevelopment && demoAccounts.length > 0 && (
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-6 max-w-2xl">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
                🛠️ 開發測試帳號
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-800 text-sm">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 bg-[#2D3436]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <a href="https://navicareer.tw" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/navicareer-logo.png"
                  alt="職游 navicareer"
                  width={140}
                  height={45}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
            <p className="text-sm text-gray-300 text-center md:text-right max-w-md">
              職游是職涯助人者的成長導航，期待無論是助人者還是來訪者，都能發揮所長，熱愛自己的生活！
            </p>
              </div>
          <div className="mt-8 pt-6 border-t border-gray-600 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} 職游 Career Creator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
