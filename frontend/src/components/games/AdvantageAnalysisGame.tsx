/**
 * AdvantageAnalysisGame - 優劣勢分析玩法
 *
 * 使用職能盤點卡進行優劣勢分析
 * 包含兩個區域：優勢、劣勢
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import TwoZoneCanvas from '../game-canvases/TwoZoneCanvas';
import CardItem from '../game-canvases/CardItem';

interface AdvantageAnalysisGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const AdvantageAnalysisGame: React.FC<AdvantageAnalysisGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'skill',
  deckType = 'skill',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [maxAdvantageCards, setMaxAdvantageCards] = useState(5);
  const [maxDisadvantageCards, setMaxDisadvantageCards] = useState(5);

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 處理卡片移動
  const handleCardMove = (cardId: string, zone: 'advantage' | 'disadvantage' | null) => {
    if (zone === null) {
      // 卡片被移除，回到左邊
      setUsedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      // 卡片被放置到某個區域
      setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
    }
  };

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  return (
    <div className="h-full flex">
      {/* 左側卡片區 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          職能盤點卡 ({availableCards.length})
        </h3>
        <div className="space-y-2">
          {availableCards.map((card: any) => (
            <div key={card.id} className="cursor-move">
              <CardItem
                id={card.id}
                title={card.title}
                description={card.description}
                category={card.category}
                isDraggable={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右側畫布區 */}
      <div className="flex-1">
        <TwoZoneCanvas
          cards={mainDeck?.cards || []}
          isRoomOwner={isRoomOwner}
          maxAdvantageCards={maxAdvantageCards}
          maxDisadvantageCards={maxDisadvantageCards}
          onMaxAdvantageCardsChange={setMaxAdvantageCards}
          onMaxDisadvantageCardsChange={setMaxDisadvantageCards}
          onCardMove={handleCardMove}
        />
      </div>
    </div>
  );
};

export default AdvantageAnalysisGame;
