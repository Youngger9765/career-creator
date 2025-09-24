'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api/auth';
import { roomsAPI } from '../../lib/api/rooms';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">諮詢師儀表板</h1>
              <p className="text-sm text-gray-600">歡迎回來，{user?.full_name || user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.roles?.includes('admin') && (
                <Link
                  href="/admin/database"
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  資料庫管理
                </Link>
              )}
              <Link
                href="/rooms/create"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                創建新房間
              </Link>
              <Link
                href="/join"
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                加入房間
              </Link>
              <Link
                href="/rooms"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                房間列表
              </Link>
              <button
                onClick={() => {
                  if (confirm('確定要登出嗎？')) {
                    authAPI.logout();
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總房間數</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Archive className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活躍房間</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRooms}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總諮詢次數</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">本週活動</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentEvents.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
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
                客戶管理
              </button>
              <button
                onClick={() => setSelectedTab('active')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'active'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                活躍房間 ({activeRooms.length})
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onEdit={setEditingRoom}
                    onDelete={setDeletingRoom}
                    getRoomStatus={getRoomStatus}
                    formatDate={formatDate}
                    getDaysRemaining={getDaysRemaining}
                  />
                ))}

                {activeRooms.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    沒有活躍的房間
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'history' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {historyRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onEdit={setEditingRoom}
                    onDelete={setDeletingRoom}
                    getRoomStatus={getRoomStatus}
                    formatDate={formatDate}
                    getDaysRemaining={getDaysRemaining}
                  />
                ))}

                {historyRooms.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">沒有歷史記錄</div>
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
    </div>
  );
}
