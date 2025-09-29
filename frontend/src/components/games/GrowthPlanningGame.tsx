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
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

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

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove, cardSync, updateCards } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.GROWTH_PLANNING,
    storeKey: 'growth',
    isRoomOwner,
    zones: ['skills', 'actions'], // 定義這個遊戲的區域
  });

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


  // 處理卡片使用 - 從卡片ID推斷類型
  const handleCardUse = (cardId: string) => {
    // 從技能卡組中查找
    const isSkillCard = skillDeck?.cards?.some((card: any) => card.id === cardId);
    const zone = isSkillCard ? 'skills' : 'actions';
    handleCardMove(cardId, zone);
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    handleCardMove(cardId, null); // null 表示移回牌組
  };

  // 處理計畫建立
  const handlePlanCreate = (cardAId: string, cardBId: string, planText: string) => {
    console.log('計畫建立:', { cardAId, cardBId, planText });
  };

  // 處理計畫文字變更
  const handlePlanTextChange = (text: string) => {
    console.log('計畫文字變更:', text);
  };

  // 計算已使用的卡片 (注意：zone name + Cards)
  const skillCards = state.cardPlacements.skillsCards || [];
  const actionCards = state.cardPlacements.actionsCards || [];
  const usedCardIds = new Set([...skillCards, ...actionCards]);

  // 過濾出未使用的卡片
  const availableSkillCards =
    skillDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];
  const availableActionCards =
    actionDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

  // 合併所有卡片供畫布使用
  const allCards = [...(skillDeck?.cards || []), ...(actionDeck?.cards || [])];

  return (
    <GameLayout
      infoBar={{
        mode: '職能盤點',
        gameplay: '成長計畫',
        canvas: 'AB 畫布',
        deckName: skillDeck?.name || '職能卡、行動卡',
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
          onPlanTextChange={handlePlanTextChange}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
          skillCards={skillCards}
          actionCards={actionCards}
        />
      }
    />
  );
};

export default GrowthPlanningGame;
