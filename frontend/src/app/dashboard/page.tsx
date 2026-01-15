'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import { clientsAPI } from '../../lib/api/clients';
import { ClientManagement } from '../../components/clients/ClientManagement';
import { LogOut, Users, Home, Settings, ChevronLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';

type NavItem = 'clients';

export default function DashboardPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItem>('clients');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Client count state
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return false;
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return false;
      }

      try {
        const userData = JSON.parse(userStr);

        // Check if user must change password
        if (userData.must_change_password) {
          router.push('/change-password');
          return false;
        }

        // Check if user is counselor
        if (!userData.roles?.includes('counselor') && !userData.roles?.includes('admin')) {
          router.push('/');
          return false;
        }
        setUser(userData);
        return true;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/login');
        return false;
      }
    };

    const loadDashboardData = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);

        // Load client count
        const clients = await clientsAPI.getMyClients();
        setClientCount(clients.length);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">載入儀表板資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-amber-50/50 via-white to-teal-50/50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex md:flex-shrink-0 h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="flex flex-col w-full h-full bg-white/80 backdrop-blur-sm border-r border-gray-200/60 shadow-lg">
          {/* Logo / Title */}
          <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200/60">
            {!sidebarCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logos/current/logo.png"
                  alt="職游 Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={sidebarCollapsed ? '展開側邊欄' : '收合側邊欄'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="px-4 py-4 border-b border-gray-200/60">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/rooms/create"
                  className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-amber-700">創建諮詢室</span>
                </Link>
                <Link
                  href="/join"
                  className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-teal-700">加入諮詢室</span>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <button
              onClick={() => setActiveNav('clients')}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-3.5 text-sm font-medium rounded-xl transition-all ${
                activeNav === 'clients'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={sidebarCollapsed ? '客戶管理' : ''}
            >
              <Users className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && (
                <>
                  客戶管理
                  {clientCount > 0 && (
                    <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      activeNav === 'clients' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {clientCount}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && clientCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
              )}
            </button>
          </nav>

          {/* User Info & Actions */}
          <div className="border-t border-gray-200/60 p-3 space-y-2">
            {!sidebarCollapsed && (
              <div className="px-3 py-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-2">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.full_name || user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}

            {user?.roles?.includes('admin') && (
              <Link
                href="/admin/database"
                className={`flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'px-4'
                } py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-xl transition-colors`}
                title={sidebarCollapsed ? '資料庫管理' : ''}
              >
                <Settings className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                {!sidebarCollapsed && '資料庫管理'}
              </Link>
            )}

            {sidebarCollapsed && (
              <>
                <Link
                  href="/rooms/create"
                  className="flex items-center justify-center px-2 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                  title="創建諮詢室"
                >
                  <Plus className="w-4 h-4" />
                </Link>
                <Link
                  href="/join"
                  className="flex items-center justify-center px-2 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                  title="加入諮詢室"
                >
                  <UserPlus className="w-4 h-4" />
                </Link>
              </>
            )}

            <button
              onClick={() => {
                if (confirm('確定要登出嗎？')) {
                  logout();
                  window.location.href = '/';
                }
              }}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors`}
              title={sidebarCollapsed ? '登出' : ''}
            >
              <LogOut className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              {!sidebarCollapsed && '登出'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logos/current/logo.png"
                  alt="職游 Logo"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/rooms/create"
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 shadow-sm"
                >
                  創建
                </Link>
                <Link
                  href="/join"
                  className="px-3 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-medium rounded-lg hover:from-teal-600 hover:to-teal-700 shadow-sm"
                >
                  加入
                </Link>
                <button
                  onClick={() => {
                    if (confirm('確定要登出嗎？')) {
                      logout();
                      window.location.href = '/';
                    }
                  }}
                  className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Welcome Banner */}
          <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              歡迎回來，{user?.full_name || user?.name || '諮詢師'}！
            </h1>
            <p className="text-gray-500 text-sm">
              您目前有 <span className="text-amber-600 font-semibold">{clientCount}</span> 位客戶，開始今天的諮詢吧！
            </p>
          </div>

          {activeNav === 'clients' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60">
              <div className="p-6">
                <ClientManagement />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
