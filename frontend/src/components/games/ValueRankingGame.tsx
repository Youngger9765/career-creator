/**
 * ValueRankingGame - 價值觀排序玩法
 *
 * 使用價值導航卡進行價值觀排序
 * 包含3x3網格佈局
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GridCanvas from '../game-canvases/GridCanvas';
import GameLayout from '../common/GameLayout';

interface ValueRankingGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const ValueRankingGame: React.FC<ValueRankingGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'value',
  deckType = 'value_cards_36',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());

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
  const handleCardMove = (cardId: string, position: { row: number; col: number } | null) => {
    if (position === null) {
      // 卡片被移除，回到左邊
      setUsedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      // 卡片被放置到網格中
      setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
    }
  };

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '價值導航',
        gameplay: '價值觀排序',
        canvas: '3x3網格畫布',
        deckName: mainDeck?.name || '價值導航卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'value',
            label: '價值導航卡',
            cards: availableCards,
            color: 'green',
            type: 'value',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={<GridCanvas cards={mainDeck?.cards || []} onCardMove={handleCardMove} />}
    />
  );
};

export default ValueRankingGame;
