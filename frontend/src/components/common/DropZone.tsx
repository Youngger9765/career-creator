/**
 * DropZone - 通用拖放區域組件
 *
 * 一個隨插即用的拖放區域組件，類似 PDFUploader
 * 各畫布只需要導入並配置佈局即可
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, LucideIcon, RotateCw, Eye, LayoutGrid, List } from 'lucide-react';
import CardModal from './CardModal';

// 簡化的卡片介面
interface CardData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

export interface DropZoneProps {
  // 核心配置
  id: string;
  cards: CardData[];
  placedCardIds: string[];
  maxCards?: number;

  // 卡片驗證
  allowedCardTypes?: string[]; // 允許的卡片類型，根據 cardId 前綴判斷
  cardTypeValidator?: (cardId: string) => boolean; // 自定義卡片類型驗證器

  // UI 配置
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  emptyMessage?: string;
  emptySubMessage?: string;

  // 樣式（可選）
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  dragOverColor?: string;
  zoneColorScheme?: 'default' | 'green' | 'red' | 'yellow'; // 區域顏色主題

  // 卡片尺寸配置
  cardWidth?: string | number; // 預設 '90px'
  cardHeight?: string | number; // 預設 '160px'

  // 功能開關
  showCardNumbers?: boolean;
  showRemoveButton?: boolean;
  allowReorder?: boolean;
  showCounter?: boolean;
  compactMode?: boolean; // 精簡模式 - 只顯示標題條

  // 管理功能
  isEditable?: boolean;
  isLocked?: boolean;
  onMaxCardsChange?: (newMax: number) => void;
  onLockToggle?: (locked: boolean) => void;

  // 事件回調
  onCardAdd?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  onCardReorder?: (cardIds: string[]) => void;
  onCardDragStart?: (cardId: string) => void;
  onCardDragEnd?: (cardId: string) => void;

  // 拖曳標籤
  draggedByOthers?: Map<string, string>; // cardId -> performerName

  // 自定義渲染
  renderCard?: (card: CardData, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;

  // 全域視圖模式（由外部控制）
  viewMode?: 'grid' | 'compact';
  onViewModeChange?: (mode: 'grid' | 'compact') => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  id,
  cards,
  placedCardIds,
  maxCards = 5,
  allowedCardTypes,
  cardTypeValidator,
  title,
  subtitle,
  icon: Icon,
  emptyMessage = '拖曳卡片到此處',
  emptySubMessage,
  className = '',
  headerClassName = '',
  contentClassName = '',
  dragOverColor = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  zoneColorScheme = 'default',
  cardWidth = '180px',
  cardHeight = '240px',
  showCardNumbers = true,
  showRemoveButton = true,
  allowReorder = true,
  showCounter = true,
  compactMode = false,
  isEditable = false,
  isLocked = false,
  onMaxCardsChange,
  onLockToggle,
  onCardAdd,
  onCardRemove,
  onCardReorder,
  onCardDragStart,
  onCardDragEnd,
  draggedByOthers,
  renderCard,
  renderHeader,
  renderEmpty,
  viewMode: externalViewMode,
  onViewModeChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [tempMaxCards, setTempMaxCards] = useState(maxCards);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [viewingCard, setViewingCard] = useState<CardData | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'compact'>('grid');
  
  // 如果有外部控制的 viewMode，使用外部的；否則使用內部的
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = externalViewMode ? () => {} : setInternalViewMode;
  // 如果有外部 onViewModeChange，隱藏內部 toggle
  const hasExternalViewMode = !!onViewModeChange;

  // 同步外部 maxCards 狀態
  useEffect(() => {
    setTempMaxCards(maxCards);
  }, [maxCards]);

  // 卡片類型驗證函數
  const isCardTypeAllowed = (cardId: string): boolean => {
    // 如果有自定義驗證器，優先使用
    if (cardTypeValidator) {
      return cardTypeValidator(cardId);
    }

    // 如果沒有指定允許的卡片類型，則允許所有類型
    if (!allowedCardTypes || allowedCardTypes.length === 0) {
      return true;
    }

    // 檢查卡片ID是否符合允許的類型前綴
    return allowedCardTypes.some((type) => cardId.startsWith(type));
  };

  const handleDrop = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);

    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;

    // 檢查卡片類型是否允許
    if (!isCardTypeAllowed(cardId)) {
      return; // 靜默拒絕，不顯示任何提示
    }

    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex') || '-1');
    const sourceZone = e.dataTransfer.getData('sourceZone');

    // 檢查是否已存在
    const cardExists = placedCardIds.includes(cardId);

    // 檢查是否超過限制
    if (placedCardIds.length >= maxCards && !cardExists) {
      return;
    }

    // 如果是新卡片，添加
    if (!cardExists) {
      onCardAdd?.(cardId);
    }
    // 如果是重新排序
    else if (allowReorder && insertIndex !== undefined && sourceZone === id) {
      const newCardIds = [...placedCardIds];
      const currentIndex = newCardIds.indexOf(cardId);
      newCardIds.splice(currentIndex, 1);

      let adjustedIndex = insertIndex;
      if (sourceIndex !== -1 && sourceIndex < insertIndex) {
        adjustedIndex = Math.max(0, insertIndex - 1);
      }

      newCardIds.splice(adjustedIndex, 0, cardId);
      onCardReorder?.(newCardIds);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有當真正離開區域時才重置狀態
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleCardDragStart = (e: React.DragEvent, cardId: string, index: number) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceZone', id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    onCardDragStart?.(cardId);
  };

  const handleCardDragEnd = (cardId: string) => {
    onCardDragEnd?.(cardId);
  };

  const isOverLimit = placedCardIds.length >= maxCards;

  // 根據區域顏色主題或卡片ID決定背景色
  const getCardBackground = (cardId: string) => {
    // 如果有指定區域顏色主題，優先使用
    if (zoneColorScheme === 'green') {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600';
    } else if (zoneColorScheme === 'red') {
      return 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-300 dark:border-red-600';
    } else if (zoneColorScheme === 'yellow') {
      return 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-600';
    }
    
    // 預設根據卡片ID判斷
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

  // 翻轉卡片
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // 預設卡片渲染 - 直立長方形樣式
  const defaultRenderCard = (card: CardData, index: number) => {
    const isFlipped = flippedCards.has(card.id);
    const draggedBy = draggedByOthers?.get(card.id);

    return (
      <div
        key={card.id}
        className="relative group flex-shrink-0"
        style={{ width: cardWidth }}
        draggable={allowReorder}
        onDragStart={(e) => allowReorder && handleCardDragStart(e, card.id, index)}
        onDragEnd={() => allowReorder && handleCardDragEnd(card.id)}
        onDragOver={(e) => {
          if (!allowReorder) return;
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const insertIndex = x < rect.width / 2 ? index : index + 1;
          setDragOverIndex(insertIndex);
        }}
        onDrop={(e) => {
          if (!allowReorder) return;
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const insertIndex = x < rect.width / 2 ? index : index + 1;
          handleDrop(e, insertIndex);
        }}
      >
        {/* 插入線 */}
        {allowReorder && dragOverIndex === index && (
          <div className="absolute left-0 top-0 w-0.5 h-full bg-blue-500 animate-pulse -ml-1" />
        )}

        {/* 拖曳標籤 - 顯示誰在移動 */}
        {draggedBy && (
          <div className="absolute -top-8 left-0 right-0 z-30 flex justify-center animate-pulse">
            <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
              {draggedBy} 正在移動
            </div>
          </div>
        )}

        {/* 卡片編號 */}
        {showCardNumbers && (
          <div className="absolute -top-2 -left-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center z-10">
            <span className="text-[10px] font-bold">{index + 1}</span>
          </div>
        )}

        {/* 移除按鈕 */}
        {showRemoveButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCardRemove?.(card.id);
            }}
            className="absolute -top-2 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
            title="移除卡片"
          >
            ×
          </button>
        )}

        {/* 卡片內容 */}
        <div
          className={`rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col relative overflow-hidden`}
          style={{ width: cardWidth, height: cardHeight }}
          onClick={() => setViewingCard(card)}
        >
          {/* 底部翻轉按鈕（只有有背面時才顯示） */}
          {(() => {
            const imageUrls =
              typeof card.imageUrl === 'object'
                ? card.imageUrl?.M || card.imageUrl
                : null;
            const hasBack = imageUrls?.back && imageUrls.back !== imageUrls.front;
            return hasBack ? (
              <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardFlip(card.id);
                  }}
                  className="flex-1 px-2 py-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-md flex items-center justify-center gap-1 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors border border-gray-200/30 dark:border-gray-600/30 shadow-sm"
                  title="翻轉卡片"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">翻轉</span>
                </button>
              </div>
            ) : null;
          })()}
          {(() => {
            // Get image URLs - use M size for dropzone cards
            const imageUrls =
              typeof card.imageUrl === 'object'
                ? card.imageUrl?.M || card.imageUrl
                : card.imageUrl
                  ? { front: card.imageUrl, back: card.imageUrl }
                  : null;

            if (imageUrls) {
              // 有圖片時顯示圖片
              return (
                <img
                  src={isFlipped ? imageUrls.back : imageUrls.front}
                  alt={isFlipped ? `${card.title} - 背面` : card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              );
            }

            // 沒有圖片時顯示文字卡片
            return (
              <div className="p-3 pb-12 flex flex-col h-full">
                {!isFlipped ? (
                  // 正面
                  <>
                    {/* 分類標籤 */}
                    {card.category && (
                      <div
                        className={`text-[10px] font-semibold uppercase tracking-wider ${getCategoryColor(card.id)} mb-2`}
                      >
                        {card.category}
                      </div>
                    )}
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center break-words flex-1 flex items-center justify-center px-1">
                      {card.title}
                    </div>
                    {card.description && (
                      <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-2 line-clamp-3 text-center">
                        {card.description}
                      </div>
                    )}
                  </>
                ) : (
                  // 背面 - 顯示更詳細的說明或其他內容
                  <div className="flex flex-col h-full">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 text-center">
                      詳細說明
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-xs text-gray-700 dark:text-gray-300 text-center leading-relaxed px-2">
                        {card.description || card.title}
                      </div>
                      {card.category && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                            分類: <span className={getCategoryColor(card.id)}>{card.category}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 最後一張卡片後的插入線 */}
        {allowReorder && dragOverIndex === index + 1 && index === placedCardIds.length - 1 && (
          <div className="absolute right-0 top-0 w-0.5 h-full bg-blue-500 animate-pulse -mr-1" />
        )}
      </div>
    );
  };

  // Compact 模式卡片渲染 - 橫向標題條
  const compactRenderCard = (card: CardData, index: number) => {
    const draggedBy = draggedByOthers?.get(card.id);

    return (
      <div
        key={card.id}
        className="relative w-full"
        draggable={allowReorder}
        onDragStart={(e) => allowReorder && handleCardDragStart(e, card.id, index)}
        onDragEnd={() => allowReorder && handleCardDragEnd(card.id)}
        onDragOver={(e) => {
          if (!allowReorder) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOverIndex(index);
        }}
        onDrop={(e) => {
          if (!allowReorder) return;
          e.preventDefault();
          e.stopPropagation();
          handleDrop(e, index);
        }}
      >
        {/* 插入線 */}
        {allowReorder && dragOverIndex === index && (
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
        )}

        {/* 拖曳標籤 */}
        {draggedBy && (
          <div className="absolute -top-6 left-0 right-0 z-30 flex justify-center animate-pulse">
            <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
              {draggedBy} 正在移動
            </div>
          </div>
        )}

        {/* 標題條 - 點擊查看大卡 */}
        <div
          className={`${getCardBackground(card.id)} border rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 hover:shadow-md transition-all cursor-pointer group`}
          onClick={() => setViewingCard(card)}
        >
          {/* 左側：編號 + 標題 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {showCardNumbers && (
              <div className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold">{index + 1}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {card.title}
              </p>
              {card.category && (
                <p
                  className={`text-[10px] font-medium ${getCategoryColor(card.id)} uppercase tracking-wide`}
                >
                  {card.category}
                </p>
              )}
            </div>
          </div>

          {/* 右側：移除按鈕 */}
          {showRemoveButton && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCardRemove?.(card.id);
                }}
                className="p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 font-bold text-sm"
                title="移除卡片"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* 最後一張卡片後的插入線 */}
        {allowReorder && dragOverIndex === index + 1 && index === placedCardIds.length - 1 && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
        )}
      </div>
    );
  };

  // 預設空狀態渲染
  const defaultRenderEmpty = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      )}
      <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
      {emptySubMessage && (
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{emptySubMessage}</p>
      )}
    </div>
  );

  return (
    <div
      className={`
        h-full flex flex-col rounded-xl border-2 transition-all duration-200
        ${
          isDragOver && !isOverLimit
            ? dragOverColor
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        }
        ${className}
      `}
      onDrop={(e) => handleDrop(e)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* 標題區域 */}
      {renderHeader
        ? renderHeader()
        : (title || subtitle || showCounter) && (
            <div
              className={`flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700 ${headerClassName || 'bg-gray-50 dark:bg-gray-900'}`}
            >
              {/* 第一行：標題 + 計數器 */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className={`w-4 h-4 ${headerClassName?.includes('text-white') ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />}
                  {title && (
                    <h3 className={`text-sm font-bold ${headerClassName?.includes('text-white') ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {title}
                    </h3>
                  )}
                </div>
                {/* 計數器 */}
                {showCounter && (
                  <span
                    className={`
                      text-xs font-bold px-2 py-0.5 rounded
                      ${headerClassName?.includes('text-white') ? 'bg-white/20 text-white' : isOverLimit ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    {placedCardIds.length}/{maxCards}
                  </span>
                )}
              </div>
              {/* 第二行：上限編輯 + 視圖切換 */}
              <div className="flex items-center justify-between">
                {/* 數量編輯器 */}
                {isEditable && showCounter ? (
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${headerClassName?.includes('text-white') ? 'text-white/70' : 'text-gray-500'}`}>上限:</span>
                    <input
                      type="text"
                      value={tempMaxCards.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value !== '' && !/^\d*$/.test(value)) return;
                        setTempMaxCards(value === '' ? 0 : parseInt(value));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const finalValue = Math.max(1, tempMaxCards);
                          setTempMaxCards(finalValue);
                          onMaxCardsChange?.(finalValue);
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={() => {
                        const finalValue = Math.max(1, tempMaxCards);
                        if (finalValue !== maxCards) {
                          setTempMaxCards(finalValue);
                          onMaxCardsChange?.(finalValue);
                        }
                      }}
                      className="w-8 text-xs text-center px-1 py-0.5 bg-white/90 border-0 rounded focus:ring-1 focus:ring-white outline-none text-gray-900 font-medium"
                      onFocus={(e) => e.target.select()}
                    />
                    <span className={`text-xs ${headerClassName?.includes('text-white') ? 'text-white/70' : 'text-gray-500'}`}>張</span>
                  </div>
                ) : (
                  <div />
                )}
                {/* 視圖模式切換（只有在沒有外部控制時顯示） */}
                {!hasExternalViewMode && (
                  <div className={`flex items-center gap-0.5 rounded p-0.5 ${headerClassName?.includes('text-white') ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-sm'
                          : 'hover:bg-white/50'
                      }`}
                      title="網格模式"
                    >
                      <LayoutGrid className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`p-1 rounded transition-colors ${
                        viewMode === 'compact'
                          ? 'bg-white shadow-sm'
                          : 'hover:bg-white/50'
                      }`}
                      title="列表模式"
                    >
                      <List className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* 內容區域 */}
      <div className={`flex-1 min-h-0 overflow-y-auto p-4 ${contentClassName}`}>
        {placedCardIds.length === 0 ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            defaultRenderEmpty()
          )
        ) : (
          <div
            className={
              viewMode === 'compact'
                ? 'flex flex-col gap-2'
                : 'flex flex-wrap justify-center gap-4'
            }
          >
            {placedCardIds.map((cardId, index) => {
              const card = cards.find((c) => c.id === cardId);
              if (!card) return null;

              // 使用自定義渲染或根據視圖模式選擇渲染方式
              if (renderCard) {
                return (
                  <div key={cardId} className="group">
                    {renderCard(card, index)}
                  </div>
                );
              }

              // Compact 模式 - 橫向標題條
              if (viewMode === 'compact') {
                return compactRenderCard(card, index);
              }

              // Grid 模式 - 完整卡片
              return defaultRenderCard(card, index);
            })}
          </div>
        )}
      </div>

      {/* CardModal for viewing large cards */}
      <CardModal card={viewingCard} isOpen={!!viewingCard} onClose={() => setViewingCard(null)} />
    </div>
  );
};

export default DropZone;
