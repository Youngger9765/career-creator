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
  CheckCircle,
  AlertCircle,
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
  return (
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
            <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{client.email}</span>
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
          <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{client.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onEnterRoom(client)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          disabled={submitLoading}
        >
          <Home className="w-4 h-4" />
          進入諮詢室
        </button>
        <button
          onClick={() => onToggleRecords(client.id)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {isRecordsExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onViewClient(client)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEditClient(client)}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeleteClient(client.id, client.name)}
          className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
