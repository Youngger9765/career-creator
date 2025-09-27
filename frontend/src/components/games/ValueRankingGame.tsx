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
import { useGameState } from '@/stores/game-state-store';

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
  const { state, updateCards } = useGameState(roomId, 'value');

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
    const currentGrid = state.cardPlacements.gridCards || Array(9).fill(null);
    let newGrid = [...currentGrid];

    if (position === null) {
      // 卡片被移除，從網格中清除
      const cardIndex = newGrid.indexOf(cardId);
      if (cardIndex !== -1) {
        newGrid[cardIndex] = null;
      }
    } else {
      // 卡片被放置到網格中
      const gridIndex = position.row * 3 + position.col;
      if (gridIndex >= 0 && gridIndex < 9) {
        newGrid[gridIndex] = cardId;
      }
    }

    updateCards({ gridCards: newGrid });
  };

  // 計算已使用的卡片
  const gridCards = state.cardPlacements.gridCards || Array(9).fill(null);
  const usedCardIds = new Set(gridCards.filter((id) => id !== null));

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

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
      canvas={
        <GridCanvas
          cards={mainDeck?.cards || []}
          onCardMove={handleCardMove}
          gridState={gridCards}
        />
      }
    />
  );
};

export default ValueRankingGame;
