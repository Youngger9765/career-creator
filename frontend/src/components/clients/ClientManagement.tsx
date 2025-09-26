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
  CheckCircle,
  ShieldCheck,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { ClientForm } from './ClientForm';
import { RoomListTable } from '../rooms/RoomListTable';

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
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleCreateClient = async (data: ClientCreate | ClientUpdate) => {
    try {
      setSubmitLoading(true);
      const newClient = await clientsAPI.createClient(data as ClientCreate);
      setClients((prev) => [newClient, ...prev]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('新增客戶失敗，請稍後再試');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateClient = async (clientId: string, data: ClientUpdate) => {
    try {
      setSubmitLoading(true);
      const updatedClient = await clientsAPI.updateClient(clientId, data);
      setClients((prev) => prev.map((client) => (client.id === clientId ? updatedClient : client)));
      setEditingClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('更新客戶資料失敗，請稍後再試');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`確定要刪除客戶「${clientName}」嗎？此操作會將客戶狀態設為封存。`)) {
      return;
    }

    try {
      await clientsAPI.updateClient(clientId, { status: 'archived' });
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, status: 'archived' as const } : client
        )
      );
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('刪除客戶失敗，請稍後再試');
    }
  };

  const handleVerifyEmail = async (clientId: string, clientEmail: string) => {
    alert(
      `未來功能：系統將寄送驗證信件到 ${clientEmail}\n\n客戶將收到驗證連結，點擊後即可完成 Email 驗證。\n\n此功能正在開發中，敬請期待！`
    );
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 封存的客戶排到最後
      if (a.status === 'archived' && b.status !== 'archived') return 1;
      if (a.status !== 'archived' && b.status === 'archived') return -1;

      // 其他按建立時間排序（新的在前）
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">客戶管理</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">管理您的諮詢客戶資料</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              全部狀態
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'active'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              活躍
            </button>
            <button
              onClick={() => setSelectedStatus('inactive')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'inactive'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              暫停
            </button>
            <button
              onClick={() => setSelectedStatus('archived')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'archived'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              封存
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增客戶
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="搜尋客戶姓名或 email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"
        />
      </div>

      {/* Client List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm || selectedStatus !== 'all' ? '沒有符合條件的客戶' : '尚未新增任何客戶'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    客戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    聯絡方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    諮詢統計
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    最後諮詢
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => {
                  const isExpanded = expandedClients.has(client.id);
                  const hasRooms = client.rooms && client.rooms.length > 0;

                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => toggleClientExpansion(client.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClientExpansion(client.id);
                              }}
                              className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-200 transition-colors mt-0.5"
                              title="展開/收合諮詢室"
                            >
                              <div
                                className={`w-0 h-0 border-l-[8px] border-l-gray-600 border-y-[5px] border-y-transparent transform transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {client.name}
                              </div>
                              {client.tags && client.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {client.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    >
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="space-y-1">
                            {client.email ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm dark:text-gray-200">{client.email}</span>
                                  {client.email_verified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                  )}
                                </div>
                                {!client.email_verified && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerifyEmail(client.id, client.email!);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                                    title="驗證 Email"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    驗證 Email
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-amber-400" />
                                <span className="text-sm text-amber-600">無Email</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm dark:text-gray-200">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="space-y-1">
                            <div>總諮詢: {client.total_consultations || 0} 次</div>
                            <div>活躍諮詢室: {client.active_rooms_count || 0} 個</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {client.last_consultation_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(client.last_consultation_date)}
                            </div>
                          ) : (
                            '尚未進行諮詢'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClient(client);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="編輯"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id, client.name);
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
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-0 pb-2">
                            <div className="ml-12 mr-6 border-l-2 border-gray-200 pl-6">
                              <div className="">
                                {hasRooms ? (
                                  <>
                                    <RoomListTable
                                      rooms={client.rooms!.sort(
                                        (a, b) =>
                                          new Date(b.created_at).getTime() -
                                          new Date(a.created_at).getTime()
                                      )}
                                      showClient={false}
                                      emptyMessage="尚無諮詢室"
                                    />

                                    {/* 創建諮詢室按鈕 - 虛線框樣式 */}
                                    <div className="mt-4">
                                      <button
                                        onClick={() => {
                                          // 跳轉到創建諮詢室頁面，帶入客戶資訊
                                          const clientInfo = encodeURIComponent(
                                            JSON.stringify({
                                              client_id: client.id,
                                              client_name: client.name,
                                              client_email: client.email,
                                            })
                                          );
                                          window.location.href = `/rooms/create?client=${clientInfo}`;
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600 transition-colors"
                                      >
                                        <Plus className="w-5 h-5" />
                                        <span className="font-medium">創建諮詢室</span>
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  /* 沒有房間時顯示創建按鈕 */
                                  <div className="text-center py-6">
                                    <p className="text-gray-400 text-sm mb-3">尚未創建任何諮詢室</p>
                                    <button
                                      onClick={() => {
                                        // 跳轉到創建諮詢室頁面，帶入客戶資訊
                                        const clientInfo = encodeURIComponent(
                                          JSON.stringify({
                                            client_id: client.id,
                                            client_name: client.name,
                                            client_email: client.email,
                                          })
                                        );
                                        window.location.href = `/rooms/create?client=${clientInfo}`;
                                      }}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Plus className="w-5 h-5" />
                                      <span className="font-medium">創建第一個諮詢室</span>
                                    </button>
                                  </div>
                                )}
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

      {/* Create Client Form */}
      {showCreateForm && (
        <ClientForm
          onSubmit={handleCreateClient}
          onClose={() => setShowCreateForm(false)}
          loading={submitLoading}
        />
      )}

      {/* Edit Client Form */}
      {editingClient && (
        <ClientForm
          client={editingClient}
          onSubmit={(data) => handleUpdateClient(editingClient.id, data as ClientUpdate)}
          onClose={() => setEditingClient(null)}
          loading={submitLoading}
        />
      )}
    </div>
  );
}
