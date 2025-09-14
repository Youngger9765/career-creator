'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api/auth-simple';
import { roomsAPI, Room } from '@/lib/api/rooms';
import { cardEventsAPI, CardEvent } from '@/lib/api/card-events';
import { Calendar, Users, Clock, TrendingUp, Activity, Archive } from 'lucide-react';

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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'active' | 'history'>('overview');

  useEffect(() => {
    const checkAuth = () => {
      if (!authAPI.isAuthenticated()) {
        router.push('/login');
        return false;
      }

      const userData = authAPI.getStoredUser();
      if (!userData) {
        router.push('/login');
        return false;
      }

      // Check if user is counselor
      if (!userData.roles?.includes('counselor') && !userData.roles?.includes('admin')) {
        router.push('/');
        return false;
      }

      setUser(userData);
      return true;
    };

    const loadDashboardData = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);

        // Load rooms
        const myRooms = await roomsAPI.getMyRooms();
        setRooms(myRooms);

        // Calculate stats
        const activeRooms = myRooms.filter(
          (room) => room.is_active && (!room.expires_at || new Date(room.expires_at) > new Date())
        );

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
    if (!room.is_active) return { label: '已關閉', color: 'bg-gray-100 text-gray-800' };
    if (room.expires_at && new Date(room.expires_at) < new Date()) {
      return { label: '已過期', color: 'bg-red-100 text-red-800' };
    }
    return { label: '活躍中', color: 'bg-green-100 text-green-800' };
  };

  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
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

  const activeRooms = rooms.filter(
    (room) => room.is_active && (!room.expires_at || new Date(room.expires_at) > new Date())
  );
  const historyRooms = rooms.filter(
    (room) => !room.is_active || (room.expires_at && new Date(room.expires_at) < new Date())
  );

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
              <Link
                href="/rooms/create"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                創建新房間
              </Link>
              <Link
                href="/rooms"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                房間列表
              </Link>
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

            {selectedTab === 'active' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeRooms.map((room) => (
                  <div
                    key={room.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{room.name}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoomStatus(room).color}`}
                      >
                        {getRoomStatus(room).label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>創建：{formatDate(room.created_at)}</span>
                      </div>
                      {room.expires_at && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>剩餘 {getDaysRemaining(room.expires_at)} 天</span>
                        </div>
                      )}
                      <div className="font-mono text-blue-600">分享碼：{room.share_code}</div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/room/${room.id}`}
                        className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        進入房間
                      </Link>
                      {room.is_active && (
                        <button
                          onClick={async () => {
                            if (confirm(`確定要結束「${room.name}」嗎？`)) {
                              try {
                                await roomsAPI.closeRoom(room.id);
                                alert('房間已結束');
                                window.location.reload();
                              } catch (error) {
                                console.error('Failed to close room:', error);
                                alert('結束房間失敗');
                              }
                            }
                          }}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          title="結束房間"
                        >
                          結束
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {activeRooms.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    沒有活躍的房間
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'history' && (
              <div className="space-y-4">
                {historyRooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          創建於 {formatDate(room.created_at)}
                          {room.expires_at && ` • 過期於 ${formatDate(room.expires_at)}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoomStatus(room).color}`}
                      >
                        {getRoomStatus(room).label}
                      </span>
                    </div>
                  </div>
                ))}

                {historyRooms.length === 0 && (
                  <div className="text-center py-12 text-gray-500">沒有歷史記錄</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
