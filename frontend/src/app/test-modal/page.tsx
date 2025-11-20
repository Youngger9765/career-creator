'use client';

import { useState } from 'react';
import CardModal from '@/components/common/CardModal';

/**
 * Test page for CardModal - verify Windows DPI scaling fix
 * No authentication required
 */
export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testCard = {
    id: 'test_card_1',
    title: '測試卡片',
    description: '這是用來測試 Windows DPI 縮放修復的卡片',
    category: '測試分類',
    imageUrl: {
      front:
        'https://storage.googleapis.com/career-creator-card/cards/career_card_realistic_front_L.png',
      back: 'https://storage.googleapis.com/career-creator-card/cards/career_card_realistic_back_L.png',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">CardModal 測試頁面</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Windows DPI 縮放修復測試</h2>
          <p className="text-gray-600 mb-4">
            此頁面用於測試 CardModal 在 Windows 125% DPI 縮放下是否正常顯示。
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">修復內容：</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>DialogContent 加上 max-h-[90vh] 限制最大高度</li>
              <li>容器高度改為響應式 (min: 400px, max: calc(90vh - 100px))</li>
              <li>圖片加上 inline style maxWidth/maxHeight: 100%</li>
            </ul>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            開啟測試 Modal
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">測試說明：</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>在 Windows 電腦上開啟此頁面</li>
            <li>點擊「開啟測試 Modal」按鈕</li>
            <li>確認 Modal 大小適中，不會超出螢幕</li>
            <li>確認卡片圖片不會異常放大</li>
          </ol>
        </div>
      </div>

      <CardModal
        card={testCard}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showBothSides={true}
      />
    </div>
  );
}
