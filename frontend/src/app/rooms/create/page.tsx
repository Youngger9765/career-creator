'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/stores/room-store';
import { useAuthStore } from '@/stores/auth-store';
import { clientsAPI } from '@/lib/api/clients';
import type { Client } from '@/types/client';
import Link from 'next/link';
import Image from 'next/image';

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

  // Load clients when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('counselor')) {
      loadClients();

      // Check if client info is passed in URL
      const params = new URLSearchParams(window.location.search);
      const clientParam = params.get('client');
      if (clientParam) {
        try {
          const clientInfo = JSON.parse(decodeURIComponent(clientParam));
          if (clientInfo.client_id) {
            // Format date as YYYY-MM-DD
            const today = new Date();
            const dateStr = today
              .toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/\//g, '-');

            setFormData((prev) => ({
              ...prev,
              clientId: clientInfo.client_id,
              name: `${clientInfo.client_name} 的諮詢室-${dateStr}`,
            }));
          }
        } catch (error) {
          console.error('Failed to parse client info:', error);
        }
      }
    }
  }, [isAuthenticated, user]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientsData = await clientsAPI.getMyClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expirationDays: 7, // Default 7 days
    clientId: '', // Selected client ID
    clientEmail: '', // New client email
    clientName: '', // New client name
    clientPhone: '', // New client phone
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">檢查認證狀態...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-6">
            <Link href="/">
              <Image src="/logos/current/logo.png" alt="職游" width={80} height={80} className="mx-auto" />
            </Link>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center border border-white/50">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">請先登入</h1>
            <p className="text-gray-500 mb-6">需要登入才能創建諮詢室</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
            >
              前往登入頁面
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!user?.roles.includes('counselor') && !user?.roles.includes('admin')) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-6">
            <Link href="/">
              <Image src="/logos/current/logo.png" alt="職游" width={80} height={80} className="mx-auto" />
            </Link>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center border border-white/50">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">權限不足</h1>
            <p className="text-gray-500 mb-6">只有諮詢師才能創建諮詢室</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all"
            >
              返回首頁
            </Link>
          </div>
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

      // Create new client if needed
      let clientId = formData.clientId;
      if (formData.clientId === 'new' && formData.clientEmail) {
        const newClient = await clientsAPI.createClient({
          email: formData.clientEmail,
          name: formData.clientName || formData.clientEmail,
          phone: formData.clientPhone,
        });
        clientId = newClient.id;
      }

      const room = await createRoom({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        expires_at: expiresAt.toISOString(),
        client_id: clientId && clientId !== '' ? clientId : undefined,
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
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/dashboard">
            <Image src="/logos/current/logo.png" alt="職游" width={80} height={80} className="mx-auto" />
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">創建諮詢室</h1>
            <p className="text-gray-500">設定您的職業諮詢會話</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
                諮詢室名稱 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例：張同學的職業探索諮詢"
                maxLength={100}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 placeholder-gray-400 transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">諮詢室名稱將顯示給所有參與者</p>
            </div>

            {/* Room Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-2">
                諮詢室描述
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="描述這次諮詢的目標和重點..."
                maxLength={500}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none text-gray-900 placeholder-gray-400 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length}/500 字 (選填)
              </p>
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">關聯客戶</label>
              <div className="space-y-3">
                <select
                  value={formData.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all"
                  disabled={loadingClients}
                >
                  <option value="">
                    {loadingClients ? '載入客戶列表中...' : '選擇既有客戶或新增客戶'}
                  </option>
                  <option value="new">+ 新增客戶</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>

                {formData.clientId === 'new' && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <input
                      type="email"
                      placeholder="客戶 Email *"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      required={formData.clientId === 'new'}
                    />
                    <input
                      type="text"
                      placeholder="客戶姓名"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    />
                    <input
                      type="tel"
                      placeholder="客戶電話 (選填)"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">將此諮詢室關聯到特定客戶，方便管理諮詢記錄</p>
            </div>

            {/* Expiration Settings */}
            <div>
              <label
                htmlFor="expirationDays"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                諮詢室有效期限
              </label>
              <select
                id="expirationDays"
                value={formData.expirationDays}
                onChange={(e) => handleInputChange('expirationDays', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all"
              >
                <option value={1}>1 天</option>
                <option value={3}>3 天</option>
                <option value={7}>7 天（預設）</option>
                <option value={14}>14 天</option>
                <option value={30}>30 天</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                諮詢室將在 {formData.expirationDays} 天後自動過期
              </p>
            </div>

            {/* Counselor Info */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                諮詢師資訊
              </h3>
              <div className="space-y-1 text-sm text-amber-700">
                <div><span className="text-amber-600">姓名：</span>{user.name}</div>
                <div><span className="text-amber-600">信箱：</span>{user.email}</div>
              </div>
            </div>

            {/* Room Features */}
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
              <h3 className="font-medium text-teal-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                諮詢室功能
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-teal-700">
                <div className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  職業卡牌系統
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  即時協作
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  操作歷史記錄
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  分享碼加入
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <div className="text-sm text-red-600 text-center">{error}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-center font-medium"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl hover:from-teal-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-teal-500/25"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    創建中...
                  </span>
                ) : (
                  '創建諮詢室'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center">
              創建諮詢室後，系統會自動生成分享碼供客戶加入
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
