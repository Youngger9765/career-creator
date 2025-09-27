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
import GameLayout from '../common/GameLayout';
import { useGameState } from '@/stores/game-state-store';

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
  const { state, updateCards } = useGameState(roomId, 'career');
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
    const currentCards = state.cardPlacements.collectedCards || [];

    if (collected) {
      updateCards({ collectedCards: [...currentCards, cardId] });
    } else {
      updateCards({ collectedCards: currentCards.filter((id) => id !== cardId) });
    }
  };

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
          onCardCollect={handleCardCollect}
          onMaxCardsChange={setMaxCards}
        />
      }
    />
  );
};

export default CareerCollectorGame;
