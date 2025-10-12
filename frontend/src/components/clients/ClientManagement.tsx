'use client';

import React, { useState, useEffect } from 'react';
import { clientsAPI, consultationRecordsAPI } from '@/lib/api/clients';
import { Client, ClientCreate, ClientUpdate, ConsultationRecord } from '@/types/client';
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
  Eye,
  X,
  Camera,
} from 'lucide-react';
import { ClientForm } from './ClientForm';
import { RoomListTable } from '../rooms/RoomListTable';
import { DeleteRoomDialog } from '../rooms/DeleteRoomDialog';

interface ClientManagementProps {
  className?: string;
}

export function ClientManagement({ className = '' }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<any>(null);
  const [clientRecords, setClientRecords] = useState<Record<string, ConsultationRecord[]>>({});
  const [loadingRecords, setLoadingRecords] = useState<Set<string>>(new Set());
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleDeleteRoomSuccess = (deletedRoomId: string) => {
    // Refresh clients to update room counts
    loadClients();
    setDeletingRoom(null);
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      return matchesSearch;
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

  const handleEnterRoom = async (client: Client) => {
    // 如果已經有預設房間，直接進入
    if (client.default_room_id) {
      window.location.href = `/room/${client.default_room_id}`;
      return;
    }

    // 否則創建一個預設房間
    try {
      setSubmitLoading(true);
      const roomName = `${client.name} 的諮詢室`;
      const roomsAPI = (await import('@/lib/api/rooms')).roomsAPI;
      const newRoom = await roomsAPI.createRoom({
        name: roomName,
        description: '主要諮詢空間',
        client_id: client.id,
      });

      // 進入新創建的房間
      window.location.href = `/room/${newRoom.id}`;
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('創建諮詢室失敗，請稍後再試');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleRecords = async (clientId: string) => {
    const newExpanded = new Set(expandedRecords);

    if (newExpanded.has(clientId)) {
      // 收合
      newExpanded.delete(clientId);
      setExpandedRecords(newExpanded);
    } else {
      // 展開：如果還沒載入過記錄，先載入
      newExpanded.add(clientId);
      setExpandedRecords(newExpanded);

      if (!clientRecords[clientId]) {
        try {
          setLoadingRecords((prev) => new Set(prev).add(clientId));
          const records = await consultationRecordsAPI.getClientRecords(clientId);
          setClientRecords((prev) => ({ ...prev, [clientId]: records }));
        } catch (error) {
          console.error('Failed to load consultation records:', error);
          alert('載入諮詢記錄失敗');
        } finally {
          setLoadingRecords((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        }
      }
    }
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">客戶管理</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">管理您的諮詢客戶資料</p>
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
            {searchTerm ? '沒有符合條件的客戶' : '尚未新增任何客戶'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    客戶資訊
                  </th>
                  <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    聯絡方式
                  </th>
                  <th className="w-[7%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="w-[11%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    諮詢統計
                  </th>
                  <th className="w-[11%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    最後諮詢
                  </th>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    備註
                  </th>
                  <th className="w-[10%] px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => {
                  return (
                    <React.Fragment key={client.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
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
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="space-y-1">
                            {client.email ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span
                                    className="text-sm dark:text-gray-200 truncate"
                                    title={client.email}
                                  >
                                    {client.email}
                                  </span>
                                  {client.email_verified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
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
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm dark:text-gray-200">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">{getStatusBadge(client.status)}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="space-y-1">
                            <div>總諮詢: {client.total_consultations || 0} 次</div>
                            <div>活躍諮詢室: {client.active_rooms_count || 0} 個</div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {client.last_consultation_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(client.last_consultation_date)}
                            </div>
                          ) : (
                            '尚未進行諮詢'
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-full" title={client.notes || ''}>
                            <p className="line-clamp-3 whitespace-pre-wrap break-words">
                              {client.notes || <span className="text-gray-400">-</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnterRoom(client);
                              }}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap"
                              title="進入諮詢室"
                              disabled={submitLoading}
                            >
                              <Home className="w-3 h-3" />
                              進入諮詢室
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRecords(client.id);
                              }}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors whitespace-nowrap"
                              title="查看諮詢記錄"
                            >
                              {expandedRecords.has(client.id) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              記錄
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingClient(client);
                                setIsEditMode(false);
                              }}
                              className="flex items-center justify-center w-6 h-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              title="檢視"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClient(client);
                              }}
                              className="flex items-center justify-center w-6 h-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="編輯"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id, client.name);
                              }}
                              className="flex items-center justify-center w-6 h-6 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Records Row */}
                      {expandedRecords.has(client.id) && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={7} className="px-12 py-6">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                諮詢記錄
                              </h4>

                              {loadingRecords.has(client.id) ? (
                                <div className="text-center py-4">
                                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                  <p className="mt-2 text-sm text-gray-500">載入記錄中...</p>
                                </div>
                              ) : clientRecords[client.id] && clientRecords[client.id].length > 0 ? (
                                <div className="space-y-2">
                                  {clientRecords[client.id].map((record) => (
                                    <div
                                      key={record.id}
                                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    >
                                      <div className="flex gap-6">
                                        {/* 左欄：日期、玩法、筆記 */}
                                        <div className="flex-1 space-y-2">
                                          <div className="space-y-1">
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                              {formatDate(record.session_date)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                              {record.game_rule_name || '未指定'}
                                            </p>
                                          </div>

                                          {record.notes && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pt-2">
                                              {record.notes}
                                            </p>
                                          )}
                                        </div>

                                        {/* 右欄：截圖 */}
                                        {record.screenshots && record.screenshots.length > 0 && (
                                          <div className="flex gap-2 flex-wrap">
                                            {record.screenshots.map((url, idx) => (
                                              <button
                                                key={idx}
                                                onClick={() => setSelectedImage(url)}
                                                className="relative group cursor-pointer"
                                              >
                                                <img
                                                  src={url}
                                                  alt={`Screenshot ${idx + 1}`}
                                                  className="w-64 h-auto object-contain rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center">
                                                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                  尚無諮詢記錄
                                </div>
                              )}
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

      {/* View/Edit Client Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {!isEditMode ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    客戶資訊
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      切換到編輯模式
                    </button>
                    <button
                      onClick={() => {
                        setViewingClient(null);
                        setIsEditMode(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* View Mode Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{viewingClient.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingClient.email || <span className="text-gray-400">尚未設定</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">電話</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingClient.phone || <span className="text-gray-400">尚未設定</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">狀態</label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingClient.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : viewingClient.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {viewingClient.status === 'active'
                        ? '活躍'
                        : viewingClient.status === 'inactive'
                          ? '暫停'
                          : '封存'}
                    </span>
                  </div>

                  {viewingClient.tags && viewingClient.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">標籤</label>
                      <div className="flex flex-wrap gap-1">
                        {viewingClient.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingClient.notes && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">備註</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {viewingClient.notes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        總諮詢次數
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {viewingClient.total_consultations || 0} 次
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        活躍諮詢室
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {viewingClient.rooms?.length || 0} 個
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <ClientForm
                client={viewingClient}
                onSubmit={async (data) => {
                  await handleUpdateClient(viewingClient.id, data as ClientUpdate);
                  setIsEditMode(false);
                  setViewingClient(null);
                }}
                onClose={() => {
                  setIsEditMode(false);
                  setViewingClient(null);
                }}
                loading={submitLoading}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Room Dialog */}
      {deletingRoom && (
        <DeleteRoomDialog
          room={deletingRoom}
          open={!!deletingRoom}
          onClose={() => setDeletingRoom(null)}
          onSuccess={handleDeleteRoomSuccess}
        />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              title="關閉"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size screenshot"
              className="max-w-full max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
