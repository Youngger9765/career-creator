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
  CheckCircle,
  AlertCircle,
  ShieldCheck,
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
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      {/* Client Info */}
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
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
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

      {/* Contact Info */}
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="space-y-1">
          {client.email ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm dark:text-gray-200 truncate" title={client.email}>
                  {client.email}
                </span>
                {/* Email verification icons - Hidden for now */}
                {false && client.email_verified ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : false ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : null}
              </div>
              {/* Email verification button - Hidden for now */}
              {false && !client.email_verified && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerifyEmail(client.id, client.email!);
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

      {/* Last Consultation */}
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

      {/* Notes */}
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-full" title={client.notes || ''}>
          <p className="line-clamp-3 whitespace-pre-wrap break-words">
            {client.notes || <span className="text-gray-400">-</span>}
          </p>
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnterRoom(client);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md"
            title="進入諮詢室"
            disabled={submitLoading}
          >
            <Home className="w-4 h-4" />
            進入諮詢室
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecords(client.id);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all whitespace-nowrap"
            title="查看諮詢記錄"
          >
            {isRecordsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            記錄
          </button>
        </div>
      </td>

      {/* Management */}
      <td className="px-3 py-4">
        <div className="flex flex-col items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewClient(client);
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="檢視"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClient(client);
            }}
            className="flex items-center justify-center w-8 h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            title="編輯"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClient(client.id, client.name);
            }}
            className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="刪除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
