/**
 * CollectionCanvas - 職業收藏家畫布元件
 *
 * 用於職游旅人卡的職業收藏玩法
 * 提供一個空白收藏區，讓玩家拖曳卡片來收藏
 * 最多可收藏15張職業卡
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Star } from 'lucide-react';
import DropZone from '../common/DropZone';

interface CollectionCanvasProps {
  cards?: CardData[];
  collectedCardIds?: string[];
  onCardCollect?: (cardId: string, collected: boolean) => void;
  maxCards?: number;
  onMaxCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
}

const CollectionCanvas: React.FC<CollectionCanvasProps> = ({
  cards = [],
  collectedCardIds: externalCollectedCardIds,
  onCardCollect,
  maxCards = 15,
  onMaxCardsChange,
  isRoomOwner = false,
  className = '',
}) => {
  // 收藏的卡片ID列表 - 優先使用外部狀態
  const [collectedCardIds, setCollectedCardIds] = useState<string[]>(
    externalCollectedCardIds || []
  );
  const [isLimitLocked, setIsLimitLocked] = useState(false);

  // 同步外部狀態
  React.useEffect(() => {
    if (externalCollectedCardIds) {
      setCollectedCardIds(externalCollectedCardIds);
    }
  }, [externalCollectedCardIds]);

  // 處理卡片添加
  const handleCardAdd = (cardId: string) => {
    // 檢查是否已收藏
    if (collectedCardIds.includes(cardId)) {
      return;
    }

    // 添加到收藏
    setCollectedCardIds((prev) => [...prev, cardId]);
    onCardCollect?.(cardId, true);
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    setCollectedCardIds((prev) => prev.filter((id) => id !== cardId));
    onCardCollect?.(cardId, false);
  };

  // 處理卡片重新排序
  const handleCardReorder = (newCardIds: string[]) => {
    setCollectedCardIds(newCardIds);
  };

  // 處理上限變更
  const handleMaxCardsChange = (newMax: number) => {
    onMaxCardsChange?.(newMax);
  };

  const hasCards = collectedCardIds.length > 0;

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
          cardWidth="135px"  // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={false}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={isLimitLocked || hasCards}
          onMaxCardsChange={handleMaxCardsChange}
          onLockToggle={setIsLimitLocked}
          onCardAdd={handleCardAdd}
          onCardRemove={handleCardRemove}
          onCardReorder={handleCardReorder}
        />
      </div>
    </div>
  );
};

export default CollectionCanvas;
