'use client';

import { useState, useEffect, useRef } from 'react';
import { Room } from '@/lib/api/rooms';
import { roomsAPI } from '@/lib/api/rooms';

interface DeleteRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function DeleteRoomDialog({ room, open, onClose, onSuccess }: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus on cancel button when dialog opens (safer default)
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  if (!open) return null;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await roomsAPI.deleteRoom(room.id);
      onSuccess(room.id);
      onClose();
    } catch (err: any) {
      setError(`刪除失敗：${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        role="dialog"
        aria-labelledby="delete-room-title"
        aria-describedby="delete-room-description"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="delete-room-title" className="text-xl font-bold text-gray-800">
            確認刪除房間
          </h2>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p id="delete-room-description" className="text-gray-700">
                確定要刪除房間「{room.name}」嗎？
              </p>
              {room.share_code && (
                <p className="text-sm text-gray-500 mt-1">分享碼: {room.share_code}</p>
              )}
              <p className="text-sm text-red-600 font-medium mt-2">此操作無法復原</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
