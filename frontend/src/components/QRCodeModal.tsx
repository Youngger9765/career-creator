'use client';

import { useState } from 'react';
import { Room, roomsAPI } from '@/lib/api/rooms';

interface QRCodeModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ room, isOpen, onClose }: QRCodeModalProps) {
  const [copying, setCopying] = useState(false);

  if (!isOpen) return null;

  const shareLink = roomsAPI.generateShareLink(room.share_code);
  const qrCodeUrl = roomsAPI.generateQRCodeUrl(room.share_code);

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('分享連結已複製到剪貼簿！');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(`分享連結：${shareLink}`);
    } finally {
      setCopying(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">分享房間</h2>
            <p className="text-sm text-gray-600 mt-1">{room.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-gray-50 rounded-lg">
              <img
                src={qrCodeUrl}
                alt="Room QR Code"
                className="w-48 h-48 mx-auto"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  img.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-sm">QR Code 載入失敗</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              掃描 QR Code 快速加入房間
            </p>
          </div>

          {/* Room Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">房間資訊</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">房間名稱：</span>
                <span className="text-blue-900 font-medium">{room.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">分享碼：</span>
                <span className="text-blue-900 font-mono font-bold">{room.share_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">狀態：</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  room.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {room.is_active ? '開放中' : '已關閉'}
                </span>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分享連結
            </label>
            <div className="flex">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                disabled={copying}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm font-medium"
              >
                {copying ? '複製中...' : '複製'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">📱 如何使用</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="font-medium mr-2">1.</span>
                <span>將 QR Code 或連結分享給來訪者</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2">2.</span>
                <span>來訪者掃描或點擊連結進入</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2">3.</span>
                <span>來訪者輸入姓名即可加入諮詢</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
