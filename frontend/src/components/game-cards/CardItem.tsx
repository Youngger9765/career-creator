/**
 * CardItem - 統一的卡片元件
 *
 * 提供一致的卡片外觀和拖放功能
 * 支援移除按鈕和狀態管理
 */

'use client';

import React, { useState } from 'react';
import { X, RotateCw } from 'lucide-react';

interface CardItemProps {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type?: 'skill' | 'action' | 'value' | 'career'; // 添加類型以區分顏色
  imageUrl?: any; // Card image URLs
  isDraggable?: boolean;
  showRemoveButton?: boolean;
  isUsed?: boolean;
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

const CardItem: React.FC<CardItemProps> = ({
  id,
  title,
  description,
  category,
  type,
  imageUrl,
  isDraggable = true,
  showRemoveButton = false,
  isUsed = false,
  onRemove,
  onDragStart,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  // 根據卡片類型或ID前綴決定背景色
  const getCardBackground = () => {
    if (type === 'skill' || id.startsWith('skill_')) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
    } else if (type === 'action' || id.startsWith('action_')) {
      return 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700';
    } else if (type === 'value' || id.startsWith('value_')) {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700';
    } else if (type === 'career' || id.startsWith('career_')) {
      return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700';
    }
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  // 根據卡片類型決定分類標籤顏色
  const getCategoryColor = () => {
    if (type === 'skill' || id.startsWith('skill_')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (type === 'action' || id.startsWith('action_')) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (type === 'value' || id.startsWith('value_')) {
      return 'text-green-600 dark:text-green-400';
    } else if (type === 'career' || id.startsWith('career_')) {
      return 'text-purple-600 dark:text-purple-400';
    }
    return 'text-gray-500 dark:text-gray-400';
  };
  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable && onDragStart) {
      onDragStart(e);
    } else if (isDraggable) {
      e.dataTransfer.setData('cardId', id);
    }
  };

  // Get image URLs - use M size for card items
  const imageUrls =
    typeof imageUrl === 'object' && imageUrl !== null
      ? 'M' in imageUrl
        ? imageUrl.M || null // M size
        : 'front' in imageUrl
          ? imageUrl // Direct { front, back } object
          : null
      : imageUrl
        ? { front: imageUrl, back: imageUrl }
        : null;

  return (
    <div
      className={`
        relative group
        ${getCardBackground()}
        border
        rounded-lg shadow-sm hover:shadow-lg
        transition-all duration-200
        w-full aspect-[3/4]
        ${isDraggable ? 'cursor-move' : 'cursor-default'}
        ${isUsed ? 'opacity-40 pointer-events-none' : ''}
        ${className}
      `}
      draggable={isDraggable && !isUsed}
      onDragStart={handleDragStart}
    >
      {/* 移除按鈕 */}
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="
            absolute -top-2 -right-2 z-10
            w-6 h-6 rounded-full
            bg-red-500 hover:bg-red-600
            text-white
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            shadow-md
          "
          aria-label="移除卡片"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* 卡片內容 - 直立長方形格式 */}
      <div className="p-3 pb-10 space-y-1 flex flex-col h-full relative overflow-hidden">
        {/* 翻面按鈕 - 在卡片內容底部 */}
        {!isUsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="absolute bottom-2 right-2 left-2 px-2 py-0.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded flex items-center justify-center gap-1 hover:bg-white dark:hover:bg-gray-700 transition-colors z-20 border border-gray-200 dark:border-gray-600 shadow-sm"
            title="翻轉卡片"
          >
            <RotateCw className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">翻轉</span>
          </button>
        )}
        {imageUrls ? (
          // 有圖片時顯示圖片
          <img
            src={isFlipped ? imageUrls.back : imageUrls.front}
            alt={isFlipped ? `${title} - 背面` : title}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          // 沒有圖片時顯示原本的文字卡片
          <>
            {!isFlipped ? (
              // 正面
              <>
                {/* 分類標籤 */}
                {category && (
                  <div
                    className={`text-[10px] font-medium uppercase tracking-wider ${getCategoryColor()}`}
                  >
                    {category}
                  </div>
                )}

                {/* 標題 */}
                <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-2">
                  {title}
                </h4>

                {/* 描述 */}
                {description && (
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
                    {description}
                  </p>
                )}
              </>
            ) : (
              // 背面 - 顯示更詳細的說明
              <div className="flex flex-col h-full">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 text-center">
                  詳細說明
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[11px] text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                    {description || title}
                  </div>
                  {category && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                        分類: <span className={getCategoryColor()}>{category}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 已使用遮罩 */}
      {isUsed && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">已使用</span>
        </div>
      )}
    </div>
  );
};

export default CardItem;
