/**
 * Room Card Component with Statistics
 * 諮詢室卡片元件包含統計資料
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Room } from '@/types/api';
import { roomsAPI } from '@/lib/api/rooms';
import { useRoomStatistics } from '@/hooks/use-room-statistics';
import { RoomStatisticsCard } from './RoomStatisticsCard';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  getRoomStatus: (room: Room) => { label: string; color: string };
  formatDate: (date: string) => string;
  getDaysRemaining: (date: string) => number;
}

export function RoomCard({
  room,
  onEdit,
  onDelete,
  getRoomStatus,
  formatDate,
  getDaysRemaining,
}: RoomCardProps) {
  const [showStatistics, setShowStatistics] = useState(false);

  const {
    statistics,
    isLoading: statsLoading,
    error: statsError,
    loadStatistics,
  } = useRoomStatistics(room.id, { autoLoad: false });

  const handleShowStatistics = () => {
    if (!showStatistics && !statistics && !statsLoading) {
      loadStatistics();
    }
    setShowStatistics(!showStatistics);
  };

  // 取得狀態說明文字
  const getStatusDescription = (label: string) => {
    switch (label) {
      case '有效期內':
        return '諮詢室在有效期限內，可正常使用';
      case '即將過期':
        return '諮詢室將在24小時內過期，請儘快使用';
      case '已過期':
        return '諮詢室已超過有效期限，無法進入';
      case '已停用':
        return '諮詢室已被手動停用，無法進入';
      default:
        return '';
    }
  };

  const roomStatus = getRoomStatus(room);

  return (
    <TooltipProvider>
      <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Main Room Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{room.name}</h4>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${roomStatus.color}`}>
                {roomStatus.label}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-gray-100 rounded-full transition-colors">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">{getStatusDescription(roomStatus.label)}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>創建：{formatDate(room.created_at)}</span>
            </div>
            {room.expires_at && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>剩餘 {getDaysRemaining(room.expires_at)} 天</span>
              </div>
            )}
            <div className="font-mono text-blue-600">分享碼：{room.share_code}</div>
            {room.description && (
              <div className="text-gray-500 text-xs mt-2">{room.description}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-3">
            {/* Main Enter Button - Prominent and Elegant */}
            <Link
              href={`/room/${room.id}`}
              className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-base rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              進入諮詢室
            </Link>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(room)}
                className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="編輯諮詢室"
              >
                <Edit2 className="w-4 h-4 inline mr-1" />
                編輯
              </button>
              {room.is_active && (
                <button
                  onClick={async () => {
                    if (confirm(`確定要結束「${room.name}」嗎？`)) {
                      try {
                        await roomsAPI.closeRoom(room.id);
                        alert('諮詢室已結束');
                        window.location.reload();
                      } catch (error) {
                        console.error('Failed to close room:', error);
                        alert('結束諮詢室失敗');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-orange-50 text-orange-600 text-sm rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                  title="結束諮詢室"
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  結束
                </button>
              )}
              <button
                onClick={() => onDelete(room)}
                className="flex-1 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                title="刪除諮詢室"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                刪除
              </button>
            </div>
          </div>

          {/* Statistics Toggle */}
          <button
            onClick={handleShowStatistics}
            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-700 text-sm rounded-md hover:bg-gray-100 transition-colors border-t"
          >
            <BarChart3 className="w-4 h-4" />
            <span>查看統計</span>
            {showStatistics ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Statistics Section */}
        {showStatistics && (
          <div className="border-t bg-gray-50 p-4">
            <RoomStatisticsCard
              roomId={room.id}
              isLoading={statsLoading}
              statistics={statistics}
              error={statsError}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
