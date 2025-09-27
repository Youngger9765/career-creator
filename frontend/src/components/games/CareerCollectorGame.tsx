/**
 * CareerCollectorGame - 職涯收藏家玩法
 *
 * 使用職能盤點卡進行收藏
 * 包含單一收藏區域，可設定收藏上限
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import CollectionCanvas from '../game-canvases/CollectionCanvas';
import CardItem from '../game-canvases/CardItem';

interface CareerCollectorGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const CareerCollectorGame: React.FC<CareerCollectorGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'skill',
  deckType = 'skill',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [maxCards, setMaxCards] = useState(15);

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 處理卡片收藏
  const handleCardCollect = (cardId: string, collected: boolean) => {
    if (collected) {
      setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
    } else {
      setUsedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
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
        <CollectionCanvas
          cards={mainDeck?.cards || []}
          maxCards={maxCards}
          isRoomOwner={isRoomOwner}
          onCardCollect={handleCardCollect}
          onMaxCardsChange={setMaxCards}
        />
      </div>
    </div>
  );
};

export default CareerCollectorGame;
