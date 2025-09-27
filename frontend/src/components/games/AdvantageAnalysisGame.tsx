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
import CardItem from '../game-cards/CardItem';
import { useGameState } from '@/stores/game-state-store';
import GameInfoBar from '../game-info/GameInfoBar';

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
    <div className="h-full flex flex-col">
      {/* 遊戲資訊欄 */}
      <GameInfoBar
        mode="技能評估"
        gameplay="優劣勢分析"
        canvas="雙區域畫布"
        deckName={mainDeck?.name || '職能盤點卡'}
        totalCards={mainDeck?.cards?.length || 0}
        availableCards={availableCards.length}
      />

      {/* 主要遊戲區域 */}
      <div className="flex-1 flex">
        {/* 左側卡片區 */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            職能盤點卡 ({availableCards.length})
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
          <TwoZoneCanvas
            cards={mainDeck?.cards || []}
            isRoomOwner={isRoomOwner}
            maxAdvantageCards={maxAdvantageCards}
            maxDisadvantageCards={maxDisadvantageCards}
            onMaxAdvantageCardsChange={setMaxAdvantageCards}
            onMaxDisadvantageCardsChange={setMaxDisadvantageCards}
            onCardMove={handleCardMove}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvantageAnalysisGame;
