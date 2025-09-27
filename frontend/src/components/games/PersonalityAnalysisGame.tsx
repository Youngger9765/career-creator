/**
 * PersonalityAnalysisGame - 六大性格分析玩法
 *
 * 使用職游旅人卡進行性格分析
 * 包含三欄分類：喜歡、中立、不喜歡
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import ThreeColumnCanvas from '../game-canvases/ThreeColumnCanvas';
import CardItem from '../game-canvases/CardItem';
import { Card } from '@/components/ui/card';

interface PersonalityAnalysisGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const PersonalityAnalysisGame: React.FC<PersonalityAnalysisGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'personality',
  deckType = 'personality',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [maxCardsPerColumn, setMaxCardsPerColumn] = useState(10);

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
  const handleCardMove = (cardId: string, column: 'like' | 'neutral' | 'dislike' | null) => {
    if (column === null) {
      // 卡片被移除，回到左邊
      setUsedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      // 卡片被放置到某一欄
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
          職游旅人卡 ({availableCards.length})
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
        <ThreeColumnCanvas
          cards={mainDeck?.cards || []}
          isRoomOwner={isRoomOwner}
          maxCardsPerColumn={maxCardsPerColumn}
          onCardMove={handleCardMove}
        />
      </div>
    </div>
  );
};

export default PersonalityAnalysisGame;
