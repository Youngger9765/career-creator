'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Edit,
  Eye,
  MessageSquare,
  FolderOpen,
  Archive,
  Trash2,
} from 'lucide-react';
import { clientsAPI } from '@/lib/api/clients';
import type { Client } from '@/types/client';
import type { Room } from '@/types/api';

interface ClientWithStats extends Client {
  active_rooms_count: number;
  total_consultations: number;
  last_consultation_date?: string;
  rooms?: Room[];
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>(
    'all'
  );
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!userData.roles?.includes('counselor') && !userData.roles?.includes('admin')) {
          router.push('/');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/login');
        return false;
      }
    };

    const loadClients = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch clients from API
        const clientsData = await clientsAPI.getMyClients();

        // Fetch statistics and rooms for each client
        const clientsWithStats = await Promise.all(
          clientsData.map(async (client) => {
            try {
              const [stats, rooms] = await Promise.all([
                clientsAPI.getClientStatistics(client.id),
                clientsAPI.getClientRooms(client.id),
              ]);

              return {
                ...client,
                active_rooms_count: stats.active_rooms_count,
                total_consultations: stats.total_consultations,
                last_consultation_date: stats.last_consultation_date || undefined,
                rooms,
              };
            } catch (err) {
              console.error(`Failed to load stats for client ${client.id}:`, err);
              return {
                ...client,
                active_rooms_count: 0,
                total_consultations: 0,
                rooms: [],
              };
            }
          })
        );

        setClients(clientsWithStats);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setError('無法載入客戶資料，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [router]);

  const handleArchiveClient = async (clientId: string) => {
    if (!confirm('確定要歸檔此客戶嗎？')) return;

    try {
      await clientsAPI.updateClient(clientId, { status: 'archived' });
      // Reload clients after archiving
      const clientsData = await clientsAPI.getMyClients();
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          try {
            const [stats, rooms] = await Promise.all([
              clientsAPI.getClientStatistics(client.id),
              clientsAPI.getClientRooms(client.id),
            ]);

            return {
              ...client,
              active_rooms_count: stats.active_rooms_count,
              total_consultations: stats.total_consultations,
              last_consultation_date: stats.last_consultation_date || undefined,
              rooms,
            };
          } catch (err) {
            return {
              ...client,
              active_rooms_count: 0,
              total_consultations: 0,
              rooms: [],
            };
          }
        })
      );
      setClients(clientsWithStats);
    } catch (error) {
      console.error('Failed to archive client:', error);
      setError('無法歸檔客戶，請稍後再試');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '活躍', className: 'bg-green-100 text-green-700' },
      inactive: { text: '休眠', className: 'bg-gray-100 text-gray-700' },
      archived: { text: '歸檔', className: 'bg-yellow-100 text-yellow-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>{config.text}</span>
    );
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && client.status === 'active') ||
      (filterStatus === 'inactive' && client.status === 'inactive') ||
      (filterStatus === 'archived' && client.status === 'archived');

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">載入客戶資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
              <p className="text-sm text-gray-600">管理您的諮詢客戶與諮詢記錄</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回儀表板
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                新增客戶
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              ✕
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋客戶姓名或 Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部 ({clients.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                活躍 ({clients.filter((c) => c.status === 'active').length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                休眠 ({clients.filter((c) => c.status === 'inactive').length})
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                歸檔 ({clients.filter((c) => c.status === 'archived').length})
              </button>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      {getStatusBadge(client.status)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {client.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        最後諮詢:{' '}
                        {client.last_consultation_date
                          ? formatDate(client.last_consultation_date)
                          : '尚無'}
                      </div>
                    </div>

                    {client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {client.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">備註: {client.notes}</p>
                    )}

                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">活躍房間:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {client.active_rooms_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">總諮詢次數:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {client.total_consultations}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        setExpandedClient(expandedClient === client.id ? null : client.id)
                      }
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                      <FolderOpen className="w-4 h-4" />
                      房間列表
                      {expandedClient === client.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      查看詳情
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                      <Edit className="w-4 h-4" />
                      編輯
                    </button>
                    {client.status !== 'archived' && (
                      <button
                        onClick={() => handleArchiveClient(client.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
                      >
                        <Archive className="w-4 h-4" />
                        歸檔
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Room List */}
                {expandedClient === client.id && client.rooms && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">相關諮詢房間</h4>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {client.rooms.map((room) => (
                        <Link
                          key={room.id}
                          href={`/room/${room.id}`}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{room.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                創建於: {formatDate(room.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                諮詢次數: {room.session_count}
                              </p>
                            </div>
                            {room.is_active ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                活躍
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                已結束
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    {client.rooms.length === 0 && (
                      <p className="text-sm text-gray-500">尚無相關諮詢房間</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{searchTerm ? '找不到符合條件的客戶' : '尚無客戶資料'}</p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新增第一個客戶
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Client Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">新增客戶</h2>
            <p className="text-gray-600 mb-4">新增客戶功能開發中...</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
