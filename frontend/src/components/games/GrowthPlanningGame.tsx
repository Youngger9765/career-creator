/**
 * GrowthPlanningGame - 成長計畫玩法
 *
 * 結合技能卡和行動卡制定成長計畫
 * 包含三個區域：已有技能、欲發展技能、行動計畫
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GrowthPlanCanvas from '../game-canvases/GrowthPlanCanvas';
import GameLayout from '../common/GameLayout';

interface GrowthPlanningGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const GrowthPlanningGame: React.FC<GrowthPlanningGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'skill',
  deckType = 'skill_cards_52',
}) => {
  const [skillDeck, setSkillDeck] = useState<any>(null);
  const [actionDeck, setActionDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());

  // 載入牌組
  useEffect(() => {
    const getDecks = async () => {
      const cardLoader = CardLoaderService;
      const skills = await cardLoader.getDeck('skill_cards_52');
      const actions = await cardLoader.getDeck('action_cards_24');
      setSkillDeck(skills);
      setActionDeck(actions);
    };
    getDecks();
  }, []);

  // 處理卡片使用
  const handleCardUse = (cardId: string) => {
    setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    setUsedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  };

  // 處理計畫建立
  const handlePlanCreate = (cardAId: string, cardBId: string, planText: string) => {
    console.log('計畫建立:', { cardAId, cardBId, planText });
  };

  // 過濾出未使用的卡片
  const availableSkillCards =
    skillDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];
  const availableActionCards =
    actionDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  // 合併所有卡片供畫布使用
  const allCards = [...(skillDeck?.cards || []), ...(actionDeck?.cards || [])];

  return (
    <GameLayout
      infoBar={{
        mode: '職能盤點',
        gameplay: '成長計畫',
        canvas: 'AB 畫布',
        deckName: skillDeck?.name || '職能盤點卡',
        totalCards: (skillDeck?.cards?.length || 0) + (actionDeck?.cards?.length || 0),
        availableCards: availableSkillCards.length + availableActionCards.length,
      }}
      sidebar={{
        type: 'tabbed',
        decks: [
          {
            id: 'skill',
            label: '技能卡',
            cards: availableSkillCards,
            color: 'blue',
            type: 'skill',
          },
          {
            id: 'action',
            label: '行動卡',
            cards: availableActionCards,
            color: 'orange',
            type: 'action',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={
        <GrowthPlanCanvas
          cards={allCards}
          onCardUse={handleCardUse}
          onCardRemove={handleCardRemove}
          onPlanCreate={handlePlanCreate}
        />
      }
    />
  );
};

export default GrowthPlanningGame;
