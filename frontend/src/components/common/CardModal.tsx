/**
 * CardModal - 大卡顯示彈窗
 *
 * 用於顯示完整的卡片資訊（標題、描述、分類等）
 * 在 Sidebar 和 DropZone 中共用
 */

'use client';

import React from 'react';
import { X, RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CardData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string | { front: string; back: string };
  [key: string]: any;
}

interface CardModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  showFlip?: boolean; // 是否顯示翻轉功能（已棄用，改為直接顯示兩面）
  showBothSides?: boolean; // 是否同時顯示正反兩面
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  isOpen,
  onClose,
  showFlip = true,
  showBothSides = true,
}) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  if (!card) return null;

  // 根據卡片ID決定背景色
  const getCardBackground = (cardId: string) => {
    if (cardId.startsWith('mindset_')) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
    } else if (cardId.startsWith('action_')) {
      return 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700';
    } else if (cardId.startsWith('value_')) {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700';
    } else if (cardId.startsWith('career_')) {
      return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700';
    }
    return 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600';
  };

  // 根據卡片ID決定分類標籤顏色
  const getCategoryColor = (cardId: string) => {
    if (cardId.startsWith('mindset_')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (cardId.startsWith('action_')) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (cardId.startsWith('value_')) {
      return 'text-green-600 dark:text-green-400';
    } else if (cardId.startsWith('career_')) {
      return 'text-purple-600 dark:text-purple-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get image URLs - use L size for modal
  const imageUrls: { front: string; back?: string } | null = (
    typeof card.imageUrl === 'object' && card.imageUrl !== null
      ? 'L' in card.imageUrl
        ? card.imageUrl.L || null
        : 'front' in card.imageUrl
          ? card.imageUrl
          : null
      : card.imageUrl
        ? { front: card.imageUrl, back: card.imageUrl }
        : null
  ) as { front: string; back?: string } | null;

  // Check if card has back image
  const hasBackImage = imageUrls?.back !== undefined;

  // 同時顯示兩面的版本
  if (showBothSides) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={hasBackImage ? 'max-w-5xl max-h-[90vh]' : 'max-w-3xl max-h-[90vh]'}
        >
          <div className={hasBackImage ? 'grid grid-cols-2 gap-8' : 'flex justify-center'}>
            {/* 正面 */}
            <div className="flex flex-col">
              <div className="text-base font-semibold text-gray-500 mb-4 text-center">
                {hasBackImage ? '正面' : ''}
              </div>
              <div
                className={`${getCardBackground(card.id)} rounded-xl flex-1 flex flex-col overflow-hidden`}
                style={{ minHeight: '400px', maxHeight: 'calc(90vh - 100px)' }}
              >
                {imageUrls?.front ? (
                  <img
                    src={imageUrls.front}
                    alt={card.title}
                    className="w-full h-full object-contain rounded-xl"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : (
                  <div className="p-10 flex flex-col h-full">
                    {/* 分類標籤 */}
                    {card.category && (
                      <div
                        className={`text-lg font-semibold uppercase tracking-wider ${getCategoryColor(card.id)} mb-6`}
                      >
                        {card.category}
                      </div>
                    )}
                    {/* 標題 */}
                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center break-words leading-relaxed">
                        {card.title}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 背面 - 只在有背面圖片時顯示 */}
            {hasBackImage && (
              <div className="flex flex-col">
                <div className="text-base font-semibold text-gray-500 mb-4 text-center">
                  背面 / 詳細說明
                </div>
                <div
                  className={`${getCardBackground(card.id)} rounded-xl flex-1 flex flex-col overflow-hidden`}
                  style={{ minHeight: '400px', maxHeight: 'calc(90vh - 100px)' }}
                >
                  {imageUrls?.back ? (
                    <img
                      src={imageUrls.back}
                      alt={`${card.title} - 背面`}
                      className="w-full h-full object-contain rounded-xl"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  ) : (
                    <div className="p-10 flex-1 flex flex-col justify-center">
                      <div className="text-xl text-gray-700 dark:text-gray-300 text-center leading-relaxed px-4">
                        {card.description || card.title}
                      </div>
                      {card.category && (
                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-lg text-gray-500 dark:text-gray-400 text-center">
                            分類: <span className={getCategoryColor(card.id)}>{card.category}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 原有的翻轉版本（保留向後兼容）
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">卡片詳情</DialogTitle>
        </DialogHeader>

        {/* 直立長方形大卡片 */}
        <div className="relative flex items-center justify-center py-6">
          <div className="relative" style={{ width: '360px', height: '600px' }}>
            {/* 翻轉按鈕 */}
            {showFlip && (
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute bottom-4 left-4 right-4 px-4 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors z-20 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center gap-2"
                title="翻轉卡片"
              >
                <RotateCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-base font-medium text-gray-600 dark:text-gray-400">翻轉</span>
              </button>
            )}

            {/* 卡片內容 */}
            <div
              className={`${getCardBackground(card.id)} rounded-xl h-full flex flex-col relative overflow-hidden`}
            >
              <div className="p-8 pb-20 flex flex-col h-full relative">
                {!isFlipped ? (
                  // 正面
                  <>
                    {/* 分類標籤 */}
                    {card.category && (
                      <div
                        className={`text-base font-semibold uppercase tracking-wider ${getCategoryColor(card.id)} mb-6`}
                      >
                        {card.category}
                      </div>
                    )}
                    {/* 標題 */}
                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center break-words leading-relaxed">
                        {card.title}
                      </div>
                    </div>
                    {/* 描述 */}
                    {card.description && (
                      <div className="text-lg text-gray-600 dark:text-gray-300 mt-6 text-center leading-relaxed">
                        {card.description}
                      </div>
                    )}
                  </>
                ) : (
                  // 背面 - 顯示詳細說明
                  <div className="flex flex-col h-full">
                    <div className="text-base font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6 text-center">
                      詳細說明
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-xl text-gray-700 dark:text-gray-300 text-center leading-relaxed px-4">
                        {card.description || card.title}
                      </div>
                      {card.category && (
                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-base text-gray-500 dark:text-gray-400 text-center">
                            分類: <span className={getCategoryColor(card.id)}>{card.category}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardModal;
