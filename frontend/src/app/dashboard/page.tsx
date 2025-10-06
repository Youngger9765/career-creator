'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { clientsAPI } from '../../lib/api/clients';
import { ClientManagement } from '../../components/clients/ClientManagement';
import { LogOut, Users, Home, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

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
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">載入儀表板資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="flex flex-col w-full bg-white border-r border-gray-200">
          {/* Logo / Title */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">諮詢師儀表板</h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={sidebarCollapsed ? '展開側邊欄' : '收合側邊欄'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-1">
            <button
              onClick={() => setActiveNav('clients')}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-3 text-sm font-medium rounded-lg transition-colors ${
                activeNav === 'clients'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={sidebarCollapsed ? '客戶管理' : ''}
            >
              <Users className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && (
                <>
                  客戶管理
                  {clientCount > 0 && (
                    <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {clientCount}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && clientCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

            {/* Future navigation items can be added here */}
          </nav>

          {/* User Info & Actions */}
          <div className="border-t border-gray-200 p-2 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-4 py-2 mb-2">
                <p className="text-sm font-medium text-gray-900 truncate">
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
                } py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors`}
                title={sidebarCollapsed ? '資料庫管理' : ''}
              >
                <Settings className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                {!sidebarCollapsed && '資料庫管理'}
              </Link>
            )}

            <Link
              href="/rooms/create"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors`}
              title={sidebarCollapsed ? '創建諮詢室' : ''}
            >
              <Home className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              {!sidebarCollapsed && '創建諮詢室'}
            </Link>

            <Link
              href="/join"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors`}
              title={sidebarCollapsed ? '加入諮詢室' : ''}
            >
              <Home className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              {!sidebarCollapsed && '加入諮詢室'}
            </Link>

            <button
              onClick={() => {
                if (confirm('確定要登出嗎？')) {
                  logout();
                  window.location.href = '/';
                }
              }}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-4'
              } py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors`}
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
        <header className="md:hidden bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">諮詢師儀表板</h1>
                <p className="text-xs text-gray-600 truncate">
                  {user?.full_name || user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/rooms/create"
                  className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                >
                  創建
                </Link>
                <Link
                  href="/join"
                  className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
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
                  className="px-3 py-2 border border-red-300 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          {activeNav === 'clients' && (
            <div className="bg-white rounded-lg shadow">
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
