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
  onCardMove?: (cardId: string, zone: 'advantage' | 'disadvantage' | null) => void;
  maxCardsPerZone?: number;
  maxAdvantageCards?: number;
  maxDisadvantageCards?: number;
  onMaxAdvantageCardsChange?: (newMax: number) => void;
  onMaxDisadvantageCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
}

const TwoZoneCanvas: React.FC<TwoZoneCanvasProps> = ({
  cards = [],
  onCardMove,
  maxCardsPerZone = 5,
  maxAdvantageCards = 5,
  maxDisadvantageCards = 5,
  onMaxAdvantageCardsChange,
  onMaxDisadvantageCardsChange,
  isRoomOwner = false,
  className = '',
}) => {
  const [advantageCards, setAdvantageCards] = useState<string[]>([]);
  const [disadvantageCards, setDisadvantageCards] = useState<string[]>([]);
  const [advantageLocked, setAdvantageLocked] = useState(false);
  const [disadvantageLocked, setDisadvantageLocked] = useState(false);
  const [localMaxAdvantage, setLocalMaxAdvantage] = useState(maxAdvantageCards);
  const [localMaxDisadvantage, setLocalMaxDisadvantage] = useState(maxDisadvantageCards);

  const handleAdvantageAdd = (cardId: string) => {
    // 如果卡片在劣勢區，先移除
    if (disadvantageCards.includes(cardId)) {
      setDisadvantageCards((prev) => prev.filter((id) => id !== cardId));
    }
    setAdvantageCards((prev) => [...prev, cardId]);
    onCardMove?.(cardId, 'advantage');
  };

  const handleAdvantageRemove = (cardId: string) => {
    setAdvantageCards((prev) => prev.filter((id) => id !== cardId));
    onCardMove?.(cardId, null);
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
    onCardMove?.(cardId, 'disadvantage');
  };

  const handleDisadvantageRemove = (cardId: string) => {
    setDisadvantageCards((prev) => prev.filter((id) => id !== cardId));
    onCardMove?.(cardId, null);
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
    <div className={`w-full h-full p-4 ${className}`}>
      <div className="h-full grid grid-cols-2 gap-6">
        {/* 優勢區域 */}
        <DropZone
          id="advantage-zone"
          cards={cards}
          placedCardIds={advantageCards}
          maxCards={localMaxAdvantage}
          title="優勢"
          subtitle="我擅長的技能"
          icon={TrendingUp}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxAdvantage} 張卡片`}
          className="h-full"
          headerClassName="bg-green-100 dark:bg-green-900/30"
          dragOverColor="border-green-500 bg-green-100 dark:bg-green-900/30"
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
        />

        {/* 劣勢區域 */}
        <DropZone
          id="disadvantage-zone"
          cards={cards}
          placedCardIds={disadvantageCards}
          maxCards={localMaxDisadvantage}
          title="劣勢"
          subtitle="需要加強的技能"
          icon={TrendingDown}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxDisadvantage} 張卡片`}
          className="h-full"
          headerClassName="bg-red-100 dark:bg-red-900/30"
          dragOverColor="border-red-500 bg-red-100 dark:bg-red-900/30"
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
        />
      </div>
    </div>
  );
};

export default TwoZoneCanvas;
