'use client';

import { useState } from 'react';
import { Room } from '@/lib/api/rooms';
import { roomsAPI } from '@/lib/api/rooms';

interface EditRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedRoom: Room) => void;
}

export function EditRoomDialog({ room, open, onClose, onSuccess }: EditRoomDialogProps) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('房間名稱不能為空');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedRoom = await roomsAPI.updateRoom(room.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onSuccess(updatedRoom);
      onClose();
    } catch (err: any) {
      setError(`更新失敗：${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        role="dialog"
        aria-labelledby="edit-room-title"
        aria-describedby="edit-room-description"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="edit-room-title" className="text-xl font-bold text-gray-800">
            編輯房間
          </h2>
          <button onClick={onClose} aria-label="關閉" className="text-gray-400 hover:text-gray-600">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-1">
              房間名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="房間名稱"
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/100 字</p>
          </div>

          <div>
            <label
              htmlFor="room-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              房間描述
            </label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              aria-label="房間描述"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 字</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
