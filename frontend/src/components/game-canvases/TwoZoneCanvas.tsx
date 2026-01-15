/**
 * TwoZoneCanvas - 優劣勢雙區畫布元件
 *
 * 用於職能盤點卡的優劣勢分析玩法
 * 提供優勢和劣勢兩個區域，每區最多放5張卡片
 * 使用模組化 DropZone 組件實現
 */

'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import DropZone from '../common/DropZone';

interface Card {
  id: string;
  title: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

interface TwoZoneCanvasProps {
  cards?: Card[];
  advantageCardIds?: string[];
  disadvantageCardIds?: string[];
  onCardMove?: (
    cardId: string,
    zone: 'advantage' | 'disadvantage' | null,
    broadcast?: boolean
  ) => void;
  maxCardsPerZone?: number;
  maxAdvantageCards?: number;
  maxDisadvantageCards?: number;
  onMaxAdvantageCardsChange?: (newMax: number) => void;
  onMaxDisadvantageCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
  draggedByOthers?: Map<string, string>; // cardId -> performerName
  onDragStart?: (cardId: string) => void;
  onDragEnd?: (cardId: string) => void;
  viewMode?: 'grid' | 'compact';
}

const TwoZoneCanvas: React.FC<TwoZoneCanvasProps> = ({
  cards = [],
  advantageCardIds,
  disadvantageCardIds,
  onCardMove,
  maxCardsPerZone = 5,
  maxAdvantageCards = 5,
  maxDisadvantageCards = 5,
  onMaxAdvantageCardsChange,
  onMaxDisadvantageCardsChange,
  isRoomOwner = false,
  className = '',
  draggedByOthers,
  onDragStart,
  onDragEnd,
  viewMode,
}) => {
  const [advantageCards, setAdvantageCards] = useState<string[]>(advantageCardIds || []);
  const [disadvantageCards, setDisadvantageCards] = useState<string[]>(disadvantageCardIds || []);
  const [advantageLocked, setAdvantageLocked] = useState(false);
  const [disadvantageLocked, setDisadvantageLocked] = useState(false);
  const [localMaxAdvantage, setLocalMaxAdvantage] = useState(maxAdvantageCards);
  const [localMaxDisadvantage, setLocalMaxDisadvantage] = useState(maxDisadvantageCards);

  // 同步外部狀態
  React.useEffect(() => {
    if (advantageCardIds !== undefined) {
      setAdvantageCards(advantageCardIds);
    }
  }, [advantageCardIds]);

  React.useEffect(() => {
    if (disadvantageCardIds !== undefined) {
      setDisadvantageCards(disadvantageCardIds);
    }
  }, [disadvantageCardIds]);

  const handleAdvantageAdd = (cardId: string) => {
    // 如果卡片在劣勢區，先移除
    if (disadvantageCards.includes(cardId)) {
      setDisadvantageCards((prev) => prev.filter((id) => id !== cardId));
    }
    setAdvantageCards((prev) => [...prev, cardId]);
    onCardMove?.(cardId, 'advantage', true);
  };

  const handleAdvantageRemove = (cardId: string) => {
    setAdvantageCards((prev) => prev.filter((id) => id !== cardId));
    onCardMove?.(cardId, null, true);
  };

  const handleAdvantageReorder = (newCardIds: string[]) => {
    setAdvantageCards(newCardIds);
  };

  const handleDisadvantageAdd = (cardId: string) => {
    // 如果卡片在優勢區，先移除
    if (advantageCards.includes(cardId)) {
      setAdvantageCards((prev) => prev.filter((id) => id !== cardId));
    }
    setDisadvantageCards((prev) => [...prev, cardId]);
    onCardMove?.(cardId, 'disadvantage', true);
  };

  const handleDisadvantageRemove = (cardId: string) => {
    setDisadvantageCards((prev) => prev.filter((id) => id !== cardId));
    onCardMove?.(cardId, null, true);
  };

  const handleDisadvantageReorder = (newCardIds: string[]) => {
    setDisadvantageCards(newCardIds);
  };

  const handleAdvantageMaxChange = (newMax: number) => {
    setLocalMaxAdvantage(newMax);
    onMaxAdvantageCardsChange?.(newMax);
  };

  const handleDisadvantageMaxChange = (newMax: number) => {
    setLocalMaxDisadvantage(newMax);
    onMaxDisadvantageCardsChange?.(newMax);
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${className}`}>
      <div className="min-h-full grid grid-cols-2 gap-6 lg:gap-8 p-8 lg:p-12">
        {/* 優勢區域 */}
        <DropZone
          id="advantage-zone"
          cards={cards}
          placedCardIds={advantageCards}
          maxCards={localMaxAdvantage}
          title="優勢"
          icon={TrendingUp}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxAdvantage} 張卡片`}
          className="min-h-96"
          headerClassName="bg-green-100 dark:bg-green-900/30"
          dragOverColor="border-green-500 bg-green-100 dark:bg-green-900/30"
          cardWidth="135px" // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={true}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={advantageLocked}
          onMaxCardsChange={handleAdvantageMaxChange}
          onLockToggle={setAdvantageLocked}
          onCardAdd={handleAdvantageAdd}
          onCardRemove={handleAdvantageRemove}
          onCardReorder={handleAdvantageReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
          viewMode={viewMode}
        />

        {/* 劣勢區域 */}
        <DropZone
          id="disadvantage-zone"
          cards={cards}
          placedCardIds={disadvantageCards}
          maxCards={localMaxDisadvantage}
          title="劣勢"
          icon={TrendingDown}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxDisadvantage} 張卡片`}
          className="min-h-96"
          headerClassName="bg-red-100 dark:bg-red-900/30"
          dragOverColor="border-red-500 bg-red-100 dark:bg-red-900/30"
          cardWidth="135px"
          cardHeight="240px"
          showCardNumbers={true}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={disadvantageLocked}
          onMaxCardsChange={handleDisadvantageMaxChange}
          onLockToggle={setDisadvantageLocked}
          onCardAdd={handleDisadvantageAdd}
          onCardRemove={handleDisadvantageRemove}
          onCardReorder={handleDisadvantageReorder}
          onCardDragStart={onDragStart}
          onCardDragEnd={onDragEnd}
          draggedByOthers={draggedByOthers}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default TwoZoneCanvas;
