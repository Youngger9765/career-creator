/**
 * CareerCollectorGame - 職涯收藏家玩法
 *
 * 使用職能盤點卡進行收藏
 * 包含單一收藏區域，可設定收藏上限
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import CollectionCanvas from '../game-canvases/CollectionCanvas';
import GameLayout from '../common/GameLayout';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

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
  const [maxCards, setMaxCards] = useState(15);

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove, cardSync } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.CAREER_COLLECTOR,
    storeKey: 'career',
    isRoomOwner,
    zones: ['collected'], // 定義這個遊戲的區域
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

  // 計算已收藏的卡片
  const collectedCardIds = state.cardPlacements.collectedCards || [];
  const usedCardIds = new Set(collectedCardIds);

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '職涯收藏',
        gameplay: '職涯收藏家',
        canvas: '收藏展示畫布',
        deckName: mainDeck?.name || '職業卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'career',
            label: '職游旅人卡',
            cards: availableCards,
            color: 'purple',
            type: 'career',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={
        <CollectionCanvas
          cards={mainDeck?.cards || []}
          collectedCardIds={collectedCardIds}
          maxCards={maxCards}
          isRoomOwner={isRoomOwner}
          onCardCollect={(cardId, collected) =>
            handleCardMove(cardId, collected ? 'collected' : null)
          }
          onMaxCardsChange={setMaxCards}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
        />
      }
    />
  );
};

export default CareerCollectorGame;
