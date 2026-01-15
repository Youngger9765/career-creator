/**
 * ClientTableRow Component
 * Renders a single client row in the desktop table view
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Client } from '@/types/client';
import {
  Mail,
  Phone,
  Edit2,
  Trash2,
  Home,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  MoreVertical,
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
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 140; // 預估選單高度
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // 如果下方空間不夠，向上展開
      const top = spaceBelow < menuHeight 
        ? rect.top - menuHeight - 4 
        : rect.bottom + 4;
      
      setMenuPosition({
        top,
        left: rect.left - 100, // 向左偏移讓選單對齊按鈕
      });
    }
  }, [showMenu]);

  return (
    <tr className="hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
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
          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {formatDate(client.last_consultation_date)}
          </div>
        ) : (
          <span className="text-sm text-gray-400 whitespace-nowrap">尚未諮詢</span>
        )}
      </td>

      {/* Notes */}
      <td className="px-4 py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[200px]">
          {client.notes || <span className="text-gray-300">-</span>}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* 主要操作：進入諮詢室 - 不會斷行 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnterRoom(client);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-full transition-colors whitespace-nowrap"
            title="進入諮詢室"
            disabled={submitLoading}
          >
            <Home className="w-4 h-4" />
            諮詢室
          </button>

          {/* 記錄按鈕 - 獨立明顯 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecords(client.id);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
              isRecordsExpanded
                ? 'text-white bg-[#0056A7]'
                : 'text-[#0056A7] bg-[#0056A7]/10 hover:bg-[#0056A7]/20'
            }`}
            title="查看諮詢記錄"
          >
            <FileText className="w-4 h-4" />
            記錄
            {isRecordsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* 三點選單 */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="更多操作"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 下拉選單 - 使用 Portal 渲染到 body */}
            {showMenu && createPortal(
              <>
                {/* 點擊外部關閉 */}
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowMenu(false)}
                />
                <div 
                  className="fixed w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[9999]"
                  style={{ 
                    top: menuPosition.top,
                    left: menuPosition.left,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewClient(client);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    檢視詳情
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClient(client);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    編輯資料
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClient(client.id, client.name);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除客戶
                  </button>
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
