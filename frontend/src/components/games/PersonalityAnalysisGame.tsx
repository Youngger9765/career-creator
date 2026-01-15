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
import GameLayout from '../common/GameLayout';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

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
  deckType = 'riasec_explanation',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [maxCardsPerColumn, setMaxCardsPerColumn] = useState(10);

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove, handleCardReorder, cardSync } =
    useUnifiedCardSync({
      roomId,
      gameType: GAMEPLAY_IDS.PERSONALITY_ASSESSMENT,
      storeKey: GAMEPLAY_IDS.PERSONALITY_ASSESSMENT,
      isRoomOwner,
      zones: ['like', 'neutral', 'dislike'], // 定義這個遊戲的區域
    });

  // 從 Store 取得已使用的牌
  const usedCards = new Set([
    ...(state.cardPlacements.likeCards || []),
    ...(state.cardPlacements.neutralCards || []),
    ...(state.cardPlacements.dislikeCards || []),
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

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '職游旅人',
        gameplay: '六大性格分析',
        canvas: '三欄分類畫布',
        deckName: mainDeck?.name || '解說卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'personality',
            label: '解說卡',
            cards: availableCards,
            color: 'purple',
            type: 'career',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      enableViewModeToggle={true}
      defaultViewMode="grid"
      canvas={(viewMode, onViewModeChange) => (
        <ThreeColumnCanvas
          cards={mainDeck?.cards || []}
          isRoomOwner={isRoomOwner}
          maxCardsPerColumn={maxCardsPerColumn}
          onCardMove={handleCardMove}
          onCardReorder={handleCardReorder}
          cardPlacements={state.cardPlacements}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}
    />
  );
};

export default PersonalityAnalysisGame;
