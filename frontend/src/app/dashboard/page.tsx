'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api/auth';
import { roomsAPI } from '../../lib/api/rooms';
import { clientsAPI } from '../../lib/api/clients';
import { cardEventsAPI } from '../../lib/api/card-events';
import { Room, CardEvent } from '../../types/api';
import { ClientManagement } from '../../components/clients/ClientManagement';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Archive,
  LogOut,
  Edit2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  User,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { EditRoomDialog } from '@/components/rooms/EditRoomDialog';
import { DeleteRoomDialog } from '@/components/rooms/DeleteRoomDialog';
import { RoomCard } from '@/components/rooms/RoomCard';
import { useRoomExpiration } from '@/hooks/use-room-expiration';

interface DashboardStats {
  totalRooms: number;
  activeRooms: number;
  totalSessions: number;
  recentEvents: CardEvent[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    activeRooms: 0,
    totalSessions: 0,
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clients' | 'active' | 'history'>(
    'overview'
  );

  // Room filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [clientFilter, setClientFilter] = useState<'all' | 'with_client' | 'no_client'>('all');

  // Client count state
  const [clientCount, setClientCount] = useState(0);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  const roomExpiration = useRoomExpiration();

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

        // Load rooms
        const myRooms = await roomsAPI.getMyRooms();
        setRooms(myRooms);

        // Load client count
        const clients = await clientsAPI.getMyClients();
        setClientCount(clients.length);

        // Calculate stats using the new expiration hook
        const activeRooms = roomExpiration.filterActiveRooms(myRooms);

        // Load recent events from all rooms
        const recentEvents: CardEvent[] = [];
        for (const room of myRooms.slice(0, 5)) {
          try {
            const events = await cardEventsAPI.getLatestRoomEvents(room.id, 5);
            recentEvents.push(...events);
          } catch (error) {
            console.error(`Failed to load events for room ${room.id}:`, error);
          }
        }

        setStats({
          totalRooms: myRooms.length,
          activeRooms: activeRooms.length,
          totalSessions: myRooms.reduce((sum, room) => sum + (room.session_count || 1), 0),
          recentEvents: recentEvents.slice(0, 10),
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoomStatus = (room: Room) => {
    return roomExpiration.getRoomStatus(room);
  };

  const getDaysRemaining = (expiresAt: string | undefined) => {
    return roomExpiration.getDaysRemaining(expiresAt) || 0;
  };

  const handleEditSuccess = (updatedRoom: Room) => {
    setRooms(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    setEditingRoom(null);
  };

  const handleDeleteSuccess = (deletedRoomId: string) => {
    setRooms(rooms.filter((r) => r.id !== deletedRoomId));
    setDeletingRoom(null);
    // Update stats
    const newRooms = rooms.filter((r) => r.id !== deletedRoomId);
    const activeRooms = roomExpiration.filterActiveRooms(newRooms);
    setStats((prev) => ({
      ...prev,
      totalRooms: newRooms.length,
      activeRooms: activeRooms.length,
    }));
  };

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

  const activeRooms = roomExpiration.filterActiveRooms(rooms);
  const historyRooms = roomExpiration.filterInactiveRooms(rooms);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">諮詢師儀表板</h1>
              <p className="text-sm text-gray-600 truncate">
                歡迎回來，{user?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {user?.roles?.includes('admin') && (
                <Link
                  href="/admin/database"
                  className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">資料庫管理</span>
                  <span className="sm:hidden">管理</span>
                </Link>
              )}
              <Link
                href="/rooms/create"
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">創建新房間</span>
                <span className="sm:hidden">創建</span>
              </Link>
              <Link
                href="/join"
                className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">加入房間</span>
                <span className="sm:hidden">加入</span>
              </Link>
              <button
                onClick={() => {
                  if (confirm('確定要登出嗎？')) {
                    authAPI.logout();
                  }
                }}
                className="px-3 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">登出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards - Only show on overview tab for mobile */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
          selectedTab === 'overview' ? 'block' : 'hidden sm:block'
        }`}
      >
        <div className="flex flex-wrap gap-3 sm:grid sm:grid-cols-1 md:grid-cols-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex items-center gap-3 sm:block min-w-0">
            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 sm:p-3">
              <Archive className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 sm:flex sm:items-center sm:justify-between sm:mt-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">總房間數</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex items-center gap-3 sm:block min-w-0">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0 sm:p-3">
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0 sm:flex sm:items-center sm:justify-between sm:mt-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">活躍房間</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.activeRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex items-center gap-3 sm:block min-w-0">
            <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 sm:p-3">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0 sm:flex sm:items-center sm:justify-between sm:mt-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">總諮詢次數</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex items-center gap-3 sm:block min-w-0">
            <div className="p-2 bg-orange-100 rounded-full flex-shrink-0 sm:p-3">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="min-w-0 sm:flex sm:items-center sm:justify-between sm:mt-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">本週活動</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.recentEvents.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="bg-white rounded-lg shadow hidden sm:block">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                總覽
              </button>
              <button
                onClick={() => setSelectedTab('clients')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'clients'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                客戶個案 ({clientCount})
              </button>
              <button
                onClick={() => setSelectedTab('active')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'active'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                諮商室 ({activeRooms.length})
              </button>
              <button
                onClick={() => setSelectedTab('history')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                歷史記錄 ({historyRooms.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活動</h3>
                  {stats.recentEvents.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between py-3 border-b"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded">
                              <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {event.performer_name || '未知用戶'} - {event.event_type}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(event.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">尚無活動記錄</p>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'clients' && (
              <div className="space-y-6">
                <ClientManagement />
              </div>
            )}

            {selectedTab === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">活躍房間列表</h3>
                  <Link
                    href="/rooms/create"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    新建房間
                  </Link>
                </div>

                {activeRooms.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            房間資訊
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            諮詢次數
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            建立時間
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">操作</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeRooms.map((room) => (
                          <tr key={room.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">{room.name}</div>
                                <div className="text-sm text-gray-500">#{room.share_code}</div>
                                {room.description && (
                                  <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                    {room.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                活躍中
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {room.session_count || 0} 次
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(room.created_at)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/room/${room.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                                >
                                  進入
                                </Link>
                                <button
                                  onClick={() => setEditingRoom(room)}
                                  className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-yellow-700 text-xs font-medium rounded-md hover:bg-yellow-50 transition-colors"
                                >
                                  編輯
                                </button>
                                <button
                                  onClick={() => setDeletingRoom(room)}
                                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                                >
                                  刪除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">沒有活躍的房間</h3>
                    <p className="text-sm text-gray-500 mb-4">建立新的諮詢房間開始使用</p>
                    <Link
                      href="/rooms/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      建立第一個房間
                    </Link>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">歷史記錄</h3>

                {historyRooms.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            房間資訊
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            諮詢次數
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            建立時間
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">操作</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historyRooms.map((room) => (
                          <tr key={room.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">{room.name}</div>
                                <div className="text-sm text-gray-500">#{room.share_code}</div>
                                {room.description && (
                                  <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                    {room.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                已過期
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {room.session_count || 0} 次
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(room.created_at)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/room/${room.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                                >
                                  查看
                                </Link>
                                <button
                                  onClick={() => setEditingRoom(room)}
                                  className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-yellow-700 text-xs font-medium rounded-md hover:bg-yellow-50 transition-colors"
                                >
                                  編輯
                                </button>
                                <button
                                  onClick={() => setDeletingRoom(room)}
                                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                                >
                                  刪除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    <Archive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">沒有歷史記錄</h3>
                    <p className="text-sm text-gray-500">完成的諮詢房間會顯示在這裡</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Room Dialog */}
      {editingRoom && (
        <EditRoomDialog
          room={editingRoom}
          open={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Room Dialog */}
      {deletingRoom && (
        <DeleteRoomDialog
          room={deletingRoom}
          open={!!deletingRoom}
          onClose={() => setDeletingRoom(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
      {/* Mobile Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            {selectedTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">最近活動</h3>
                {stats.recentEvents.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between py-3 border-b"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.performer_name || '未知用戶'} - {event.event_type}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(event.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">尚無活動記錄</p>
                )}
              </div>
            )}

            {selectedTab === 'clients' && (
              <div className="space-y-4">
                <ClientManagement />
              </div>
            )}

            {selectedTab === 'active' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">活躍房間</h3>
                <div className="space-y-3">
                  {activeRooms.map((room) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {room.name}
                          </h4>
                          <p className="text-xs text-gray-500">#{room.share_code}</p>
                        </div>
                        <Link
                          href={`/room/${room.id}`}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded"
                        >
                          進入
                        </Link>
                      </div>
                    </div>
                  ))}
                  {activeRooms.length === 0 && (
                    <p className="text-gray-500 text-center py-8">沒有活躍的房間</p>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">歷史記錄</h3>
                <div className="space-y-3">
                  {historyRooms.map((room) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {room.name}
                          </h4>
                          <p className="text-xs text-gray-500">#{room.share_code}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {historyRooms.length === 0 && (
                    <p className="text-gray-500 text-center py-8">沒有歷史記錄</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden">
        <nav className="flex justify-around">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 ${
              selectedTab === 'overview' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">總覽</span>
          </button>
          <button
            onClick={() => setSelectedTab('clients')}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 relative ${
              selectedTab === 'clients' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">客戶</span>
            {clientCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {clientCount > 99 ? '99+' : clientCount}
              </div>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 relative ${
              selectedTab === 'active' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Activity className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">諮商室</span>
            {activeRooms.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeRooms.length > 99 ? '99+' : activeRooms.length}
              </div>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 relative ${
              selectedTab === 'history' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Archive className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">歷史</span>
            {historyRooms.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                {historyRooms.length > 99 ? '99+' : historyRooms.length}
              </div>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
