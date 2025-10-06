/**
 * CollectionCanvas - 職業收藏家畫布元件
 *
 * 用於職游旅人卡的職業收藏玩法
 * 提供一個空白收藏區，讓玩家拖曳卡片來收藏
 * 最多可收藏15張職業卡
 */

'use client';

import React from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Star } from 'lucide-react';
import DropZone from '../common/DropZone';

interface CollectionCanvasProps {
  cards?: CardData[];
  collectedCardIds?: string[];
  onCardCollect?: (cardId: string, collected: boolean) => void;
  onCardReorder?: (newCardIds: string[]) => void;
  maxCards?: number;
  onMaxCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
  draggedByOthers?: Map<string, string>;
  onDragStart?: (cardId: string) => void;
  onDragEnd?: (cardId: string) => void;
}

const CollectionCanvas: React.FC<CollectionCanvasProps> = ({
  cards = [],
  collectedCardIds: externalCollectedCardIds,
  onCardCollect,
  onCardReorder,
  maxCards = 15,
  onMaxCardsChange,
  isRoomOwner = false,
  className = '',
  draggedByOthers,
  onDragStart,
  onDragEnd,
}) => {
  // 使用外部狀態，不再內部管理
  const collectedCardIds = externalCollectedCardIds || [];

  // 處理卡片添加
  const handleCardAdd = (cardId: string) => {
    // 檢查是否已收藏
    if (collectedCardIds.includes(cardId)) {
      return;
    }

    // 通知外部添加卡片
    onCardCollect?.(cardId, true);
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    // 通知外部移除卡片
    onCardCollect?.(cardId, false);
  };

  // 處理卡片重新排序
  const handleCardReorder = (newCardIds: string[]) => {
    onCardReorder?.(newCardIds);
  };

  // 處理上限變更
  const handleMaxCardsChange = (newMax: number) => {
    onMaxCardsChange?.(newMax);
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${className}`}>
      <div className="min-h-full">
        <DropZone
          id="collection-zone"
          cards={cards}
          placedCardIds={collectedCardIds}
          maxCards={maxCards}
          title="職涯收藏"
          subtitle="收藏你感興趣的職業"
          icon={Star}
          emptyMessage="拖曳卡片到此處開始收藏"
          emptySubMessage={`最多可收藏 ${maxCards} 張職業卡`}
          className="min-h-96"
          headerClassName="bg-purple-100 dark:bg-purple-900/30"
          dragOverColor="border-purple-500 bg-purple-100 dark:bg-purple-900/30"
          cardWidth="150px"
          cardHeight="200px"
          showCardNumbers={false}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          onMaxCardsChange={handleMaxCardsChange}
          onCardAdd={handleCardAdd}
          onCardRemove={handleCardRemove}
          onCardReorder={handleCardReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
        />
      </div>
    </div>
  );
};

export default CollectionCanvas;
