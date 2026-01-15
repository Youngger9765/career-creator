/**
 * ClientMobileCard Component
 * Mobile card view for client list
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
  MoreVertical,
} from 'lucide-react';

interface ClientMobileCardProps {
  client: Client;
  submitLoading?: boolean;
  isRecordsExpanded?: boolean;
  onEnterRoom: (client: Client) => void;
  onToggleRecords: (clientId: string) => void;
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
  formatDate: (dateString: string) => string;
}

export function ClientMobileCard({
  client,
  submitLoading = false,
  isRecordsExpanded = false,
  onEnterRoom,
  onToggleRecords,
  onViewClient,
  onEditClient,
  onDeleteClient,
  formatDate,
}: ClientMobileCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Client Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {client.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {client.name}
            </h3>

            {/* Contact Info */}
            <div className="mt-1 space-y-0.5">
              {client.email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => {
                      onViewClient(client);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    檢視
                  </button>
                  <button
                    onClick={() => {
                      onEditClient(client);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    編輯
                  </button>
                  <button
                    onClick={() => {
                      onDeleteClient(client.id, client.name);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Last Consultation */}
        {client.last_consultation_date && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <div className="flex flex-col">
              <span>最後諮詢</span>
              <span>{formatDate(client.last_consultation_date)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onEnterRoom(client)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl transition-all shadow-sm"
          disabled={submitLoading}
        >
          <Home className="w-4 h-4" />
          諮詢室
        </button>
        <button
          onClick={() => onToggleRecords(client.id)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
            isRecordsExpanded
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          記錄
          {isRecordsExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
