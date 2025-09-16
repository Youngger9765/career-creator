/**
 * Room Card Component with Statistics
 * 房間卡片元件包含統計資料
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Room } from '@/types/api';
import { roomsAPI } from '@/lib/api/rooms';
import { useRoomStatistics } from '@/hooks/use-room-statistics';
import { RoomStatisticsCard } from './RoomStatisticsCard';
import { Calendar, Clock, Edit2, Trash2, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

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

  return (
    <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Main Room Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900">{room.name}</h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getRoomStatus(room).color}`}
          >
            {getRoomStatus(room).label}
          </span>
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
          {room.description && <div className="text-gray-500 text-xs mt-2">{room.description}</div>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <Link
            href={`/room/${room.id}`}
            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            進入
          </Link>
          <button
            onClick={() => onEdit(room)}
            className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="編輯房間"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(room)}
            className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            title="刪除房間"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {room.is_active && (
            <button
              onClick={async () => {
                if (confirm(`確定要結束「${room.name}」嗎？`)) {
                  try {
                    await roomsAPI.closeRoom(room.id);
                    alert('房間已結束');
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to close room:', error);
                    alert('結束房間失敗');
                  }
                }
              }}
              className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
              title="結束房間"
            >
              結束
            </button>
          )}
        </div>

        {/* Statistics Toggle */}
        <button
          onClick={handleShowStatistics}
          className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-700 text-sm rounded-md hover:bg-gray-100 transition-colors border-t"
        >
          <BarChart3 className="w-4 h-4" />
          <span>查看統計</span>
          {showStatistics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
  );
}
