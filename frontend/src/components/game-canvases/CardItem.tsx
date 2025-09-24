/**
 * CardItem - 統一的卡片元件
 *
 * 提供一致的卡片外觀和拖放功能
 * 支援移除按鈕和狀態管理
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CardItemProps {
  id: string;
  title: string;
  description?: string;
  category?: string;
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
  isDraggable = true,
  showRemoveButton = false,
  isUsed = false,
  onRemove,
  onDragStart,
  className = '',
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable && onDragStart) {
      onDragStart(e);
    } else if (isDraggable) {
      e.dataTransfer.setData('cardId', id);
    }
  };

  return (
    <div
      className={`
        relative group
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm hover:shadow-md
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
      <div className="p-3 space-y-1 flex flex-col h-full">
        {/* 分類標籤 */}
        {category && (
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
