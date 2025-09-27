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
import { useGameState } from '@/stores/game-state-store';

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
  deckType = 'career_cards_100',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [maxCardsPerColumn, setMaxCardsPerColumn] = useState(10);

  // 使用 GameStateStore 管理狀態
  const { state, updateCards } = useGameState(roomId, 'personality');

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

  // 處理卡片移動
  const handleCardMove = (cardId: string, column: 'like' | 'neutral' | 'dislike' | null) => {
    const currentPlacements = { ...state.cardPlacements };

    // 先從所有欄位移除該卡片
    if (currentPlacements.likeCards) {
      currentPlacements.likeCards = currentPlacements.likeCards.filter((id) => id !== cardId);
    }
    if (currentPlacements.neutralCards) {
      currentPlacements.neutralCards = currentPlacements.neutralCards.filter((id) => id !== cardId);
    }
    if (currentPlacements.dislikeCards) {
      currentPlacements.dislikeCards = currentPlacements.dislikeCards.filter((id) => id !== cardId);
    }

    // 如果有新欄位，加入該卡片
    if (column !== null) {
      const columnKey = `${column}Cards`;
      if (columnKey === 'likeCards') {
        if (!currentPlacements.likeCards) currentPlacements.likeCards = [];
        currentPlacements.likeCards.push(cardId);
      } else if (columnKey === 'neutralCards') {
        if (!currentPlacements.neutralCards) currentPlacements.neutralCards = [];
        currentPlacements.neutralCards.push(cardId);
      } else if (columnKey === 'dislikeCards') {
        if (!currentPlacements.dislikeCards) currentPlacements.dislikeCards = [];
        currentPlacements.dislikeCards.push(cardId);
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
        mode: '職游旅人',
        gameplay: '六大性格分析',
        canvas: '三欄分類畫布',
        deckName: mainDeck?.name || '職游旅人卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'personality',
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
        <ThreeColumnCanvas
          cards={mainDeck?.cards || []}
          isRoomOwner={isRoomOwner}
          maxCardsPerColumn={maxCardsPerColumn}
          onCardMove={handleCardMove}
          cardPlacements={state.cardPlacements}
        />
      }
    />
  );
};

export default PersonalityAnalysisGame;
