'use client';

import React from 'react';
import Link from 'next/link';
import { Room } from '@/types/api';
import { ExternalLink, Calendar, Clock, Users, MessageCircle, Copy, Home } from 'lucide-react';

interface RoomListTableProps {
  rooms: Room[];
  showClient?: boolean;
  emptyMessage?: string;
}

export function RoomListTable({
  rooms,
  showClient = true,
  emptyMessage = '沒有諮詢室記錄',
}: RoomListTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return '無期限';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return '已過期';
    if (days === 0) return '今天到期';
    return `${days} 天`;
  };

  const getStatusBadge = (room: Room) => {
    if (room.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          活躍中
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        已結束
      </span>
    );
  };

  const copyShareCode = (shareCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareCode);
    alert(`已複製分享碼: ${shareCode}`);
  };

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              諮詢室資訊
            </th>
            {showClient && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客戶
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              狀態
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              諮詢次數
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              剩餘時間
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              建立時間
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rooms.map((room) => (
            <tr key={room.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{room.name}</div>
                    {room.description && (
                      <div className="text-xs text-gray-500 mt-1">{room.description}</div>
                    )}
                  </div>
                </div>
              </td>
              {showClient && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {room.primary_client_name || <span className="text-gray-400">無客戶</span>}
                  </div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(room)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-gray-900">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  {room.session_count || 0} 次
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {getDaysRemaining(room.expires_at || null)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(room.created_at)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/room/${room.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    進入諮詢室
                  </Link>
                  <button
                    onClick={(e) => copyShareCode(room.share_code, e)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-gray-200"
                    title="複製分享碼"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="font-mono">#{room.share_code}</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
