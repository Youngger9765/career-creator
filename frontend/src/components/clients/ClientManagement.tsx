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
import { ClientTableRow } from './ClientTableRow';
import { RoomListTable } from '../rooms/RoomListTable';
import { DeleteRoomDialog } from '../rooms/DeleteRoomDialog';
import { GAMEPLAY_NAMES } from '@/constants/game-modes';
import { useClientManagement } from '@/hooks/useClientManagement';

interface ClientManagementProps {
  className?: string;
}

export function ClientManagement({ className = '' }: ClientManagementProps) {
  // Use client management hook
  const {
    clients,
    loading,
    searchTerm,
    showCreateForm,
    editingClient,
    viewingClient,
    isEditMode,
    expandedClients,
    submitLoading,
    deletingRoom,
    clientRecords,
    loadingRecords,
    expandedRecords,
    selectedImage,
    filteredClients,
    setSearchTerm,
    setShowCreateForm,
    setEditingClient,
    setViewingClient,
    setIsEditMode,
    setExpandedClients,
    setSubmitLoading,
    setDeletingRoom,
    setSelectedImage,
    loadClients,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    handleVerifyEmail,
    handleDeleteRoomSuccess,
    handleToggleRecords,
  } = useClientManagement();

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
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      客戶資訊
                    </th>
                    <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      聯絡方式
                    </th>
                    <th className="w-[11%] px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      最後諮詢
                    </th>
                    <th className="w-[24%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      備註
                    </th>
                    <th className="w-[14%] px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                    <th className="w-[8%] px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      管理
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.map((client) => {
                    return (
                      <React.Fragment key={client.id}>
                        <ClientTableRow
                          client={client}
                          submitLoading={submitLoading}
                          isRecordsExpanded={expandedRecords.has(client.id)}
                          onEnterRoom={handleEnterRoom}
                          onToggleRecords={handleToggleRecords}
                          onViewClient={(c) => {
                            setViewingClient(c);
                            setIsEditMode(false);
                          }}
                          onEditClient={setEditingClient}
                          onDeleteClient={handleDeleteClient}
                          onVerifyEmail={handleVerifyEmail}
                          formatDate={formatDate}
                        />

                        {/* Expanded Records Row */}
                        {expandedRecords.has(client.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={8} className="px-12 py-6">
                              <div className="space-y-3 ml-8 pl-6 border-l-4 border-blue-500">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <Activity className="w-4 h-4" />
                                  諮詢記錄
                                </h4>

                                {loadingRecords.has(client.id) ? (
                                  <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <p className="mt-2 text-sm text-gray-500">載入記錄中...</p>
                                  </div>
                                ) : clientRecords[client.id] &&
                                  clientRecords[client.id].length > 0 ? (
                                  <div className="space-y-2">
                                    {clientRecords[client.id].map((record) => (
                                      <div
                                        key={record.id}
                                        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex gap-6">
                                          {/* 左欄：日期、玩法、筆記 */}
                                          <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                  {formatDate(record.session_date)}
                                                </p>
                                              </div>
                                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full">
                                                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                  {(record.game_state?.gameplay &&
                                                    GAMEPLAY_NAMES[record.game_state.gameplay]) ||
                                                    record.game_rule_name ||
                                                    '未指定'}
                                                </span>
                                              </div>
                                            </div>

                                            {record.notes && (
                                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                  {record.notes}
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* 右欄：截圖 */}
                                          {record.screenshots && record.screenshots.length > 0 && (
                                            <div className="flex gap-3 flex-wrap">
                                              {record.screenshots.map((url, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => setSelectedImage(url)}
                                                  className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-105"
                                                >
                                                  <img
                                                    src={url}
                                                    alt={`Screenshot ${idx + 1}`}
                                                    className="w-64 h-auto object-contain bg-gray-100 dark:bg-gray-700"
                                                  />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                                                      <Camera className="w-5 h-5 text-gray-800 dark:text-white" />
                                                    </div>
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

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <React.Fragment key={client.id}>
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {client.name}
                        </h3>
                        {client.tags && client.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
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

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3 text-sm">
                      {client.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                            {client.email}
                          </span>
                          {client.email_verified ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                      ) : null}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{client.phone}</span>
                        </div>
                      )}
                      {client.last_consultation_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            最後諮詢: {formatDate(client.last_consultation_date)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {client.notes && (
                      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                          {client.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnterRoom(client)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        disabled={submitLoading}
                      >
                        <Home className="w-4 h-4" />
                        進入諮詢室
                      </button>
                      <button
                        onClick={() => handleToggleRecords(client.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {expandedRecords.has(client.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setViewingClient(client);
                          setIsEditMode(false);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingClient(client)}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Records for Mobile */}
                  {expandedRecords.has(client.id) && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" />
                        諮詢記錄
                      </h4>

                      {loadingRecords.has(client.id) ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-sm text-gray-500">載入記錄中...</p>
                        </div>
                      ) : clientRecords[client.id] && clientRecords[client.id].length > 0 ? (
                        <div className="space-y-3">
                          {clientRecords[client.id].map((record) => (
                            <div
                              key={record.id}
                              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatDate(record.session_date)}
                                  </p>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full">
                                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {(record.game_state?.gameplay &&
                                      GAMEPLAY_NAMES[record.game_state.gameplay]) ||
                                      record.game_rule_name ||
                                      '未指定'}
                                  </span>
                                </div>
                                {record.notes && (
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {record.notes}
                                    </p>
                                  </div>
                                )}
                                {record.screenshots && record.screenshots.length > 0 && (
                                  <div className="space-y-2">
                                    {record.screenshots.map((url, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setSelectedImage(url)}
                                        className="w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                                      >
                                        <img
                                          src={url}
                                          alt={`Screenshot ${idx + 1}`}
                                          className="w-full h-auto object-contain bg-gray-100 dark:bg-gray-700"
                                        />
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
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
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
