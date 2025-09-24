'use client';

import React, { useState, useEffect } from 'react';
import { clientsAPI } from '@/lib/api/clients';
import { Client, ClientCreate, ClientUpdate } from '@/types/client';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Tag,
  Activity,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Home,
} from 'lucide-react';

interface ClientManagementProps {
  className?: string;
}

export function ClientManagement({ className = '' }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsAPI.getMyClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

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
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      active: '活躍',
      inactive: '暫停',
      archived: '封存',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const getRoomStatusBadge = (isActive: boolean, expiresAt?: string) => {
    if (!isActive) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          已結束
        </span>
      );
    }

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            已過期
          </span>
        );
      } else if (daysLeft <= 3) {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            即將到期
          </span>
        );
      }
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        進行中
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">載入客戶資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">客戶管理</h2>
          <p className="text-sm text-gray-600">管理您的諮詢客戶資料</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增客戶
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋客戶姓名或 email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部狀態</option>
          <option value="active">活躍</option>
          <option value="inactive">暫停</option>
          <option value="archived">封存</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總客戶數</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活躍客戶</p>
              <p className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總諮詢次數</p>
              <p className="text-2xl font-bold text-purple-600">
                {clients.reduce((sum, client) => sum + (client.total_consultations || 0), 0)}
              </p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活躍房間</p>
              <p className="text-2xl font-bold text-orange-600">
                {clients.reduce((sum, client) => sum + (client.active_rooms_count || 0), 0)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm || selectedStatus !== 'all' ? '沒有符合條件的客戶' : '尚未新增任何客戶'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    聯絡方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    諮詢統計
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最後諮詢
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const isExpanded = expandedClients.has(client.id);
                  const hasRooms = client.rooms && client.rooms.length > 0;

                  return (
                    <React.Fragment key={client.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {hasRooms && (
                              <button
                                onClick={() => toggleClientExpansion(client.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="展開/收合房間"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {!hasRooms && <div className="w-4" />}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              {client.tags && client.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {client.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                  {client.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{client.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>總諮詢: {client.total_consultations || 0} 次</div>
                            <div>活躍房間: {client.active_rooms_count || 0} 個</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.last_consultation_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(client.last_consultation_date)}
                            </div>
                          ) : (
                            '尚未進行諮詢'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingClient(client)}
                              className="text-blue-600 hover:text-blue-800"
                              title="編輯"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`確定要刪除客戶「${client.name}」嗎？`)) {
                                  // TODO: Implement delete
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded rooms section */}
                      {isExpanded && hasRooms && (
                        <tr>
                          <td colSpan={6} className="px-6 py-0">
                            <div className="bg-gray-50 rounded-lg p-4 my-2">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                諮詢房間 ({client.rooms!.length} 個)
                              </h4>
                              <div className="space-y-2">
                                {client
                                  .rooms!.sort(
                                    (a, b) =>
                                      new Date(b.created_at).getTime() -
                                      new Date(a.created_at).getTime()
                                  )
                                  .map((room, index) => (
                                    <div
                                      key={room.id}
                                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      {/* 時間軸點 */}
                                      <div className="flex flex-col items-center">
                                        <div
                                          className={`w-3 h-3 rounded-full ${room.is_active ? 'bg-green-500' : 'bg-gray-400'} flex-shrink-0`}
                                        />
                                        {index < client.rooms!.length - 1 && (
                                          <div className="w-px h-8 bg-gray-300 mt-1" />
                                        )}
                                      </div>

                                      {/* 房間資訊 */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h5 className="text-sm font-medium text-gray-900 truncate">
                                              {room.name}
                                            </h5>
                                            {room.description && (
                                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {room.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                                            {getRoomStatusBadge(room.is_active, room.expires_at)}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {formatDate(room.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <MessageCircle className="w-3 h-3" />
                                              {room.session_count} 次諮詢
                                            </div>
                                          </div>

                                          <div className="flex gap-2">
                                            <a
                                              href={`/room/${room.id}`}
                                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              進入
                                            </a>
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(room.share_code);
                                                // TODO: Add toast notification
                                              }}
                                              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                              title="複製分享碼"
                                            >
                                              #{room.share_code}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TODO: Add Create/Edit Client Forms */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新增客戶</h3>
            <p className="text-gray-600">建立新客戶的表單開發中...</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">編輯客戶</h3>
            <p className="text-gray-600">編輯客戶「{editingClient.name}」的表單開發中...</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
