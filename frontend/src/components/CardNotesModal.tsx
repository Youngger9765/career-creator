'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CardData } from '@/types/cards';
import { cardEventsAPI } from '@/lib/api/card-events';

interface CardNotesModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  performerInfo?: {
    id?: string;
    name?: string;
    type?: string;
  };
  onNoteSaved?: (cardId: string, notes: string) => void;
}

export function CardNotesModal({
  card,
  isOpen,
  onClose,
  roomId,
  performerInfo,
  onNoteSaved,
}: CardNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset notes when card changes
    if (card) {
      setNotes('');
      setError(null);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSave = async () => {
    if (!notes.trim()) {
      setError('請輸入註記內容');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await cardEventsAPI.addNotes(roomId, card.id, notes.trim(), performerInfo);
      onNoteSaved?.(card.id, notes.trim());
      onClose();
    } catch (err) {
      setError('儲存失敗，請稍後再試');
      console.error('Failed to save notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">新增牌卡註記</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                  card.category === 'technology'
                    ? 'bg-blue-500'
                    : card.category === 'management'
                      ? 'bg-green-500'
                      : card.category === 'creative'
                        ? 'bg-purple-500'
                        : 'bg-gray-500'
                }`}
              >
                {card.category}
              </span>
              <span className="font-medium">{card.title}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{card.description}</p>
            <div className="flex flex-wrap gap-1">
              {card.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Input */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">註記內容</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入您對這張牌卡的觀察、想法或討論要點..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
          <div className="mt-2 text-xs text-gray-500">按下 Ctrl+Enter 快速儲存</div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t">
          <div className="text-sm text-gray-500">
            {performerInfo?.name && <span>註記者：{performerInfo.name}</span>}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !notes.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '儲存中...' : '儲存註記'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
