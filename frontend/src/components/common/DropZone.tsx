/**
 * DropZone - 通用拖放區域組件
 *
 * 一個隨插即用的拖放區域組件，類似 PDFUploader
 * 各畫布只需要導入並配置佈局即可
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, LucideIcon, Edit2, Lock, Unlock, Save, X } from 'lucide-react';

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

  // 功能開關
  showCardNumbers?: boolean;
  showRemoveButton?: boolean;
  allowReorder?: boolean;
  showCounter?: boolean;

  // 管理功能
  isEditable?: boolean;
  isLocked?: boolean;
  onMaxCardsChange?: (newMax: number) => void;
  onLockToggle?: (locked: boolean) => void;

  // 事件回調
  onCardAdd?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  onCardReorder?: (cardIds: string[]) => void;

  // 自定義渲染
  renderCard?: (card: CardData, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({
  id,
  cards,
  placedCardIds,
  maxCards = 5,
  title,
  subtitle,
  icon: Icon,
  emptyMessage = '拖曳卡片到此處',
  emptySubMessage,
  className = '',
  headerClassName = '',
  contentClassName = '',
  dragOverColor = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  showCardNumbers = true,
  showRemoveButton = true,
  allowReorder = true,
  showCounter = true,
  isEditable = false,
  isLocked = false,
  onMaxCardsChange,
  onLockToggle,
  onCardAdd,
  onCardRemove,
  onCardReorder,
  renderCard,
  renderHeader,
  renderEmpty,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempMaxCards, setTempMaxCards] = useState(maxCards);
  const [localLocked, setLocalLocked] = useState(isLocked);

  // 同步外部 isLocked 狀態
  useEffect(() => {
    setLocalLocked(isLocked);
  }, [isLocked]);

  // 同步外部 maxCards 狀態
  useEffect(() => {
    setTempMaxCards(maxCards);
  }, [maxCards]);

  // 判斷是否有卡片（影響是否能編輯上限）
  const hasCards = placedCardIds.length > 0;
  // 當有卡片時自動鎖定，或手動鎖定
  const effectivelyLocked = localLocked || hasCards;

  const handleDrop = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);

    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;

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
  };

  const isOverLimit = placedCardIds.length >= maxCards;

  // 預設卡片渲染 - 直立長方形樣式
  const defaultRenderCard = (card: CardData, index: number) => (
    <div
      key={card.id}
      className="relative w-[100px]"
      draggable={allowReorder}
      onDragStart={(e) => allowReorder && handleCardDragStart(e, card.id, index)}
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

      {/* 卡片內容 - 直立長方形 */}
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-move h-[140px] flex flex-col">
        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center break-words flex-1 flex items-center justify-center px-1">
          {card.title}
        </div>
        {card.description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 text-center">
            {card.description}
          </div>
        )}
      </div>

      {/* 最後一張卡片後的插入線 */}
      {allowReorder && dragOverIndex === index + 1 && index === placedCardIds.length - 1 && (
        <div className="absolute right-0 top-0 w-0.5 h-full bg-blue-500 animate-pulse -mr-1" />
      )}
    </div>
  );

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
              className={`flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {Icon && <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                  <div>
                    {title && (
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* 鎖定按鈕 */}
                  {isEditable && (
                    <button
                      onClick={() => {
                        if (!hasCards) {
                          const newLocked = !localLocked;
                          setLocalLocked(newLocked);
                          onLockToggle?.(newLocked);
                        }
                      }}
                      className={`p-1 rounded text-xs ${
                        hasCards
                          ? 'bg-yellow-500 text-white cursor-default'
                          : localLocked
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                      title={hasCards ? '有卡片時自動鎖定' : localLocked ? '點擊解鎖' : '點擊鎖定'}
                    >
                      {effectivelyLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  {/* 計數器和編輯 */}
                  {showCounter && (
                    <div className="flex items-center space-x-1">
                      {isEditingLimit ? (
                        <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md px-2 py-1 border-2 border-blue-500">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {placedCardIds.length} /
                          </span>
                          <input
                            type="text"
                            value={tempMaxCards.toString()}
                            onChange={(e) => {
                              // 允許清空和輸入任何數字
                              const value = e.target.value;

                              // 如果輸入的不是數字，直接返回
                              if (value !== '' && !/^\d*$/.test(value)) {
                                return;
                              }

                              // 允許暫時清空（顯示空白）
                              if (value === '') {
                                setTempMaxCards(0);
                                return;
                              }

                              // 設定數字值
                              const numValue = parseInt(value);
                              setTempMaxCards(numValue);
                            }}
                            onBlur={() => {
                              // 失去焦點時，如果是0或無效值，設為1
                              if (tempMaxCards === 0) {
                                setTempMaxCards(1);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const finalValue = Math.max(1, tempMaxCards);
                                setTempMaxCards(finalValue);
                                onMaxCardsChange?.(finalValue);
                                setIsEditingLimit(false);
                                if (!localLocked && !hasCards) {
                                  setLocalLocked(true);
                                  onLockToggle?.(true);
                                }
                              } else if (e.key === 'Escape') {
                                setTempMaxCards(maxCards);
                                setIsEditingLimit(false);
                              }
                            }}
                            className="w-12 text-xs text-center bg-yellow-50 dark:bg-gray-700 border-b border-blue-500 outline-none text-gray-900 dark:text-gray-100 font-bold"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            onClick={() => {
                              // 儲存時確保至少為1
                              const finalValue = Math.max(1, tempMaxCards);
                              setTempMaxCards(finalValue);
                              onMaxCardsChange?.(finalValue);
                              setIsEditingLimit(false);
                              // 編輯完成後自動鎖定
                              if (!localLocked && !hasCards) {
                                setLocalLocked(true);
                                onLockToggle?.(true);
                              }
                            }}
                            className="text-green-600 hover:text-green-700 p-0.5"
                            title="儲存並鎖定"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setTempMaxCards(maxCards);
                              setIsEditingLimit(false);
                            }}
                            className="text-red-600 hover:text-red-700 p-0.5"
                            title="取消"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`
                        text-xs font-medium px-2 py-1 rounded flex items-center space-x-1
                        ${
                          isOverLimit
                            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }
                      `}
                          >
                            <span>
                              {placedCardIds.length} / {maxCards}
                            </span>
                          </span>

                          {/* 編輯按鈕 - 在數字右邊 */}
                          {isEditable && !effectivelyLocked && (
                            <button
                              onClick={() => {
                                setTempMaxCards(maxCards);
                                setIsEditingLimit(true);
                              }}
                              className="p-1 rounded text-xs bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                              title="編輯上限"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isOverLimit && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            </div>
          )}

      {/* 內容區域 */}
      <div className={`flex-1 overflow-y-auto p-3 ${contentClassName}`}>
        {placedCardIds.length === 0 ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            defaultRenderEmpty()
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {placedCardIds.map((cardId, index) => {
              const card = cards.find((c) => c.id === cardId);
              if (!card) return null;

              return (
                <div key={cardId} className="group">
                  {renderCard ? renderCard(card, index) : defaultRenderCard(card, index)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropZone;
