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
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

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

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove: baseHandleCardMove, cardSync, updateCards } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.VALUE_RANKING,
    storeKey: 'value',
    isRoomOwner,
    zones: ['rank1', 'rank2', 'rank3', 'others'], // 定義正確的區域：3個排名區域和1個其他區域
  });

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);


  // 處理卡片移動 - 從 GridCanvas 傳來的 zone
  const handleCardMove = (cardId: string, zone: string | null) => {
    baseHandleCardMove(cardId, zone);
  };

  // 從 zone-based state 建構卡片分布
  const rank1Cards = state.cardPlacements.rank1Cards || [];
  const rank2Cards = state.cardPlacements.rank2Cards || [];
  const rank3Cards = state.cardPlacements.rank3Cards || [];
  const othersCards = state.cardPlacements.othersCards || [];

  // 計算已使用的卡片
  const usedCardIds = new Set<string>([
    ...rank1Cards,
    ...rank2Cards,
    ...rank3Cards,
    ...othersCards
  ]);

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
          rank1Cards={rank1Cards}
          rank2Cards={rank2Cards}
          rank3Cards={rank3Cards}
          othersCards={othersCards}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
        />
      }
    />
  );
};

export default ValueRankingGame;
