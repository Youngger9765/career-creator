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
import GameLayout from '../common/GameLayout';
import { useGameState } from '@/stores/game-state-store';

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
  deckType = 'skill_cards_52',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [maxAdvantageCards, setMaxAdvantageCards] = useState(5);
  const [maxDisadvantageCards, setMaxDisadvantageCards] = useState(5);

  // 使用 GameStateStore 管理狀態
  const { state, updateCards } = useGameState(roomId, 'advantage');

  // 從 Store 取得已使用的牌
  const usedCards = new Set([
    ...(state.cardPlacements.advantageCards || []),
    ...(state.cardPlacements.disadvantageCards || []),
  ]);

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
    const currentPlacements = { ...state.cardPlacements };

    // 先從所有區域移除該卡片
    if (currentPlacements.advantageCards) {
      currentPlacements.advantageCards = currentPlacements.advantageCards.filter(
        (id) => id !== cardId
      );
    }
    if (currentPlacements.disadvantageCards) {
      currentPlacements.disadvantageCards = currentPlacements.disadvantageCards.filter(
        (id) => id !== cardId
      );
    }

    // 如果有新區域，加入該卡片
    if (zone !== null) {
      if (zone === 'advantage') {
        if (!currentPlacements.advantageCards) currentPlacements.advantageCards = [];
        currentPlacements.advantageCards.push(cardId);
      } else if (zone === 'disadvantage') {
        if (!currentPlacements.disadvantageCards) currentPlacements.disadvantageCards = [];
        currentPlacements.disadvantageCards.push(cardId);
      }
    }

    // 更新 Store
    updateCards(currentPlacements);
  };

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '技能評估',
        gameplay: '優劣勢分析',
        canvas: '雙區域畫布',
        deckName: mainDeck?.name || '職能盤點卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'skill',
            label: '職能盤點卡',
            cards: availableCards,
            color: 'blue',
            type: 'skill',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={
        <TwoZoneCanvas
          cards={mainDeck?.cards || []}
          advantageCardIds={state.cardPlacements.advantageCards || []}
          disadvantageCardIds={state.cardPlacements.disadvantageCards || []}
          isRoomOwner={isRoomOwner}
          maxAdvantageCards={maxAdvantageCards}
          maxDisadvantageCards={maxDisadvantageCards}
          onMaxAdvantageCardsChange={setMaxAdvantageCards}
          onMaxDisadvantageCardsChange={setMaxDisadvantageCards}
          onCardMove={handleCardMove}
        />
      }
    />
  );
};

export default AdvantageAnalysisGame;
