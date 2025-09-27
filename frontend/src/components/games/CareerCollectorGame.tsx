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
import CardItem from '../game-cards/CardItem';
import GameInfoBar from '../game-info/GameInfoBar';

interface CareerCollectorGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const CareerCollectorGame: React.FC<CareerCollectorGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'career',
  deckType = 'career_cards_100',
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
    <div className="h-full flex flex-col">
      {/* 遊戲資訊欄 */}
      <GameInfoBar
        mode="職涯收藏"
        gameplay="職涯收藏家"
        canvas="收藏展示畫布"
        deckName={mainDeck?.name || '職業卡'}
        totalCards={mainDeck?.cards?.length || 0}
        availableCards={availableCards.length}
      />

      {/* 主要遊戲區域 */}
      <div className="flex-1 flex">
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
    </div>
  );
};

export default CareerCollectorGame;
