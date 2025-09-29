/**
 * ThreeColumnCanvas - 三欄分類畫布元件
 *
 * 用於職游旅人卡的六大性格分析玩法
 * 提供喜歡、中立、不喜歡三個欄位進行牌卡分類
 * 使用模組化 DropZone 組件實現
 */

'use client';

import React, { useState } from 'react';
import { Heart, Meh, ThumbsDown } from 'lucide-react';
import DropZone from '../common/DropZone';

interface Card {
  id: string;
  title: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

interface ThreeColumnCanvasProps {
  cards?: Card[];
  onCardMove?: (cardId: string, column: 'like' | 'neutral' | 'dislike' | null, broadcast?: boolean) => void;
  maxCardsPerColumn?: number;
  isRoomOwner?: boolean;
  className?: string;
  cardPlacements?: {
    likeCards?: string[];
    neutralCards?: string[];
    dislikeCards?: string[];
  };
  draggedByOthers?: Map<string, string>; // cardId -> performerName
  onDragStart?: (cardId: string) => void;
  onDragEnd?: (cardId: string) => void;
}

const ThreeColumnCanvas: React.FC<ThreeColumnCanvasProps> = ({
  cards = [],
  onCardMove,
  maxCardsPerColumn = 10,
  isRoomOwner = false,
  className = '',
  cardPlacements,
  draggedByOthers,
  onDragStart,
  onDragEnd,
}) => {
  // 使用外部狀態，如果沒有則使用本地狀態
  const likeCards = cardPlacements?.likeCards || [];
  const neutralCards = cardPlacements?.neutralCards || [];
  const dislikeCards = cardPlacements?.dislikeCards || [];
  const [likeLocked, setLikeLocked] = useState(true); // 預設鎖定
  const [neutralLocked, setNeutralLocked] = useState(true); // 預設鎖定
  const [dislikeLocked, setDislikeLocked] = useState(true); // 預設鎖定
  const [localMaxLike, setLocalMaxLike] = useState(maxCardsPerColumn);
  const [localMaxNeutral, setLocalMaxNeutral] = useState(maxCardsPerColumn);
  const [localMaxDislike, setLocalMaxDislike] = useState(maxCardsPerColumn);

  const handleLikeAdd = (cardId: string) => {
    onCardMove?.(cardId, 'like', true);
  };

  const handleLikeRemove = (cardId: string) => {
    onCardMove?.(cardId, null, true);
  };

  const handleLikeReorder = (newCardIds: string[]) => {
    // 排序功能暫時不實作
  };

  const handleNeutralAdd = (cardId: string) => {
    onCardMove?.(cardId, 'neutral', true);
  };

  const handleNeutralRemove = (cardId: string) => {
    onCardMove?.(cardId, null, true);
  };

  const handleNeutralReorder = (newCardIds: string[]) => {
    // 排序功能暫時不實作
  };

  const handleDislikeAdd = (cardId: string) => {
    onCardMove?.(cardId, 'dislike', true);
  };

  const handleDislikeRemove = (cardId: string) => {
    onCardMove?.(cardId, null, true);
  };

  const handleDislikeReorder = (newCardIds: string[]) => {
    // 排序功能暫時不實作
  };

  const handleLikeMaxChange = (newMax: number) => {
    setLocalMaxLike(newMax);
  };

  const handleNeutralMaxChange = (newMax: number) => {
    setLocalMaxNeutral(newMax);
  };

  const handleDislikeMaxChange = (newMax: number) => {
    setLocalMaxDislike(newMax);
  };

  // 自定義卡片渲染，加入拖曳標籤
  const renderCardWithLabel = (card: Card, index: number) => {
    const draggedBy = draggedByOthers?.get(card.id);

    return (
      <div key={card.id} className="relative">
        {/* 拖曳標籤 */}
        {draggedBy && (
          <div className="absolute -top-6 left-0 right-0 z-20 flex justify-center animate-pulse">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
              {draggedBy} 正在移動
            </div>
          </div>
        )}
        {/* 原始卡片內容由 DropZone 處理 */}
      </div>
    );
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${className}`}>
      <div className="min-h-full grid grid-cols-3 gap-4 p-4">
        {/* 喜歡欄位 */}
        <DropZone
          id="like-column"
          cards={cards}
          placedCardIds={likeCards}
          maxCards={localMaxLike}
          title="喜歡"
          icon={Heart}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxLike} 張卡片`}
          className="min-h-96"
          headerClassName="bg-green-100 dark:bg-green-900/30"
          dragOverColor="border-green-500 bg-green-100 dark:bg-green-900/30"
          cardWidth="135px" // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={false}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={likeLocked}
          onMaxCardsChange={handleLikeMaxChange}
          onLockToggle={setLikeLocked}
          onCardAdd={handleLikeAdd}
          onCardRemove={handleLikeRemove}
          onCardReorder={handleLikeReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
        />

        {/* 中立欄位 */}
        <DropZone
          id="neutral-column"
          cards={cards}
          placedCardIds={neutralCards}
          maxCards={localMaxNeutral}
          title="中立"
          icon={Meh}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxNeutral} 張卡片`}
          className="min-h-96"
          headerClassName="bg-gray-100 dark:bg-gray-800"
          dragOverColor="border-gray-500 bg-gray-100 dark:bg-gray-800"
          cardWidth="135px" // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={false}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={neutralLocked}
          onMaxCardsChange={handleNeutralMaxChange}
          onLockToggle={setNeutralLocked}
          onCardAdd={handleNeutralAdd}
          onCardRemove={handleNeutralRemove}
          onCardReorder={handleNeutralReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
        />

        {/* 不喜歡欄位 */}
        <DropZone
          id="dislike-column"
          cards={cards}
          placedCardIds={dislikeCards}
          maxCards={localMaxDislike}
          title="不喜歡"
          icon={ThumbsDown}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxDislike} 張卡片`}
          className="min-h-96"
          headerClassName="bg-red-100 dark:bg-red-900/30"
          dragOverColor="border-red-500 bg-red-100 dark:bg-red-900/30"
          cardWidth="135px" // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={false}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={dislikeLocked}
          onMaxCardsChange={handleDislikeMaxChange}
          onLockToggle={setDislikeLocked}
          onCardAdd={handleDislikeAdd}
          onCardRemove={handleDislikeRemove}
          onCardReorder={handleDislikeReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
        />
      </div>
    </div>
  );
};

export default ThreeColumnCanvas;
