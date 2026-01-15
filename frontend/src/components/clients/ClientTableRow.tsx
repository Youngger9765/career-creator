/**
 * ClientTableRow Component
 * Renders a single client row in the desktop table view
 */

import React from 'react';
import type { Client } from '@/types/client';
import {
  Mail,
  Phone,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  Home,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
} from 'lucide-react';

interface ClientTableRowProps {
  client: Client;
  submitLoading?: boolean;
  isRecordsExpanded?: boolean;
  onEnterRoom: (client: Client) => void;
  onToggleRecords: (clientId: string) => void;
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
  onVerifyEmail: (clientId: string, clientEmail: string) => void;
  formatDate: (dateString: string) => string;
}

export function ClientTableRow({
  client,
  submitLoading = false,
  isRecordsExpanded = false,
  onEnterRoom,
  onToggleRecords,
  onViewClient,
  onEditClient,
  onDeleteClient,
  onVerifyEmail,
  formatDate,
}: ClientTableRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Client Info */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-700 font-semibold text-sm">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {client.name}
            </div>
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {client.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Contact Info */}
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          {client.email ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate max-w-[180px]" title={client.email}>
                {client.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              <span>未設定</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      </td>

      {/* Last Consultation */}
      <td className="px-4 py-4">
        {client.last_consultation_date ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(client.last_consultation_date)}
          </div>
        ) : (
          <span className="text-sm text-gray-400">尚未諮詢</span>
        )}
      </td>

      {/* Notes */}
      <td className="px-4 py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[200px]">
          {client.notes || <span className="text-gray-300">-</span>}
        </p>
      </td>

      {/* Actions - 合併操作與管理 */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* 主要操作：進入諮詢室 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnterRoom(client);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
            title="進入諮詢室"
            disabled={submitLoading}
          >
            <Home className="w-3.5 h-3.5" />
            諮詢室
          </button>

          {/* 記錄按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecords(client.id);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isRecordsExpanded
                ? 'text-teal-700 bg-teal-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="查看諮詢記錄"
          >
            <FileText className="w-3.5 h-3.5" />
            {isRecordsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 分隔線 */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* 次要操作 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewClient(client);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="檢視詳情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClient(client);
            }}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="編輯"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClient(client.id, client.name);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="刪除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
