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
import CardItem from '../game-cards/CardItem';
import { Card } from '@/components/ui/card';
import { useGameState } from '@/stores/game-state-store';
import GameInfoBar from '../game-info/GameInfoBar';

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
    <div className="h-full flex flex-col">
      {/* 遊戲資訊欄 */}
      <GameInfoBar
        mode="職涯探索"
        gameplay="六大性格分析"
        canvas="三欄分類畫布"
        deckName={mainDeck?.name || '職游旅人卡'}
        totalCards={mainDeck?.cards?.length || 0}
        availableCards={availableCards.length}
      />

      {/* 主要遊戲區域 */}
      <div className="flex-1 flex">
        {/* 左側卡片區 */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              職游旅人卡 ({availableCards.length})
            </h3>
            <button
              onClick={() => {
                updateCards({
                  likeCards: [],
                  neutralCards: [],
                  dislikeCards: [],
                });
              }}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              重置
            </button>
          </div>
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
            cardPlacements={state.cardPlacements}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalityAnalysisGame;
