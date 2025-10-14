/**
 * GrowthPlanningGame - 成長計畫玩法
 *
 * 結合技能卡和行動卡制定成長計畫
 * 包含三個區域：已有技能、欲發展技能、行動計畫
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GrowthPlanCanvas from '../game-canvases/GrowthPlanCanvas';
import GameLayout from '../common/GameLayout';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { useCardSync } from '@/hooks/use-card-sync';
import { useAuthStore } from '@/stores/auth-store';
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
  const [planText, setPlanText] = useState<string>('');

  // Auth 資訊
  const { user } = useAuthStore();
  const userId = user?.id || `visitor-${Date.now()}`;
  const userName = user?.name || '訪客';

  // 使用統一的卡片同步 Hook - 處理牌卡同步
  const { state, draggedByOthers, handleCardMove, cardSync, updateCards } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.GROWTH_PLANNING,
    storeKey: GAMEPLAY_IDS.GROWTH_PLANNING,
    isRoomOwner,
    zones: ['skills', 'actions'], // 定義這個遊戲的區域
  });

  // 使用 useCardSync 處理文字同步 - 使用不同的 channel 避免衝突
  const gameSync = useCardSync({
    roomId,
    gameType: `${GAMEPLAY_IDS.GROWTH_PLANNING}_settings`, // 使用不同的 channel 名稱
    isOwner: isRoomOwner,
    userName,
    userId,
    onCardMove: () => {}, // 忽略卡片移動（由 useUnifiedCardSync 處理）
    onStateReceived: (receivedState) => {
      console.log('[GrowthPlanning] 接收到遊戲狀態:', receivedState);

      // 處理文字輸入 - 像 LifeTransformationGame 一樣存在 settings 中
      if (receivedState.settings?.planText !== undefined) {
        console.log('[GrowthPlanning] 更新文字:', receivedState.settings.planText);
        setPlanText(receivedState.settings.planText);
      }
    },
  });

  // 載入已儲存的狀態
  useEffect(() => {
    if (gameSync.isConnected) {
      const savedState = gameSync.loadGameState();
      console.log('[GrowthPlanning] 載入遊戲狀態:', savedState);

      if (savedState?.settings?.planText !== undefined) {
        console.log('[GrowthPlanning] 載入已儲存文字:', savedState.settings.planText);
        setPlanText(savedState.settings.planText);
      }
    }
  }, [gameSync.isConnected]);

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

  // 計算已使用的卡片 (注意：zone name + Cards)
  const skillCardsInUse = state.cardPlacements.skillsCards || [];
  const actionCardsInUse = state.cardPlacements.actionsCards || [];
  const usedCardIds = new Set([...skillCardsInUse, ...actionCardsInUse]);

  // 合併所有卡片供查找使用
  const allCards = [...(skillDeck?.cards || []), ...(actionDeck?.cards || [])];

  // 建立卡片前綴文字
  const getCardPrefix = useCallback(() => {
    // 如果都沒有選擇卡片，不顯示前綴
    if (!skillCardsInUse[0] && !actionCardsInUse[0]) return '';

    // 從所有卡片中找出選中的卡片
    const skillCard = skillCardsInUse[0]
      ? allCards.find((card: any) => card.id === skillCardsInUse[0])
      : null;
    const actionCard = actionCardsInUse[0]
      ? allCards.find((card: any) => card.id === actionCardsInUse[0])
      : null;

    // 取得卡片名稱 (使用 title 屬性，不是 name!)
    const skillName = skillCard?.title || '未選擇';
    const actionName = actionCard?.title || '未選擇';

    console.log('[GrowthPlanning] Card prefix debug:', {
      skillCardId: skillCardsInUse[0],
      actionCardId: actionCardsInUse[0],
      skillCard,
      actionCard,
      skillName,
      actionName,
      totalCards: allCards.length,
    });

    return `【技能卡: ${skillName} | 行動卡: ${actionName}】\n----------\n`;
  }, [skillCardsInUse, actionCardsInUse, allCards]);

  // 處理計畫文字變更（只有房主可以編輯）
  const handlePlanTextChange = useCallback(
    (text: string) => {
      if (!isRoomOwner) return; // 訪客不能編輯

      // 取得當前的前綴
      const prefix = getCardPrefix();

      // 如果文字開頭不是前綴，或者前綴已更改，則更新
      if (prefix && !text.startsWith(prefix)) {
        // 移除舊的前綴（如果有的話）
        const oldPrefixMatch = text.match(/^【技能卡:.*?】\n----------\n/);
        let userContent = text;
        if (oldPrefixMatch) {
          userContent = text.substring(oldPrefixMatch[0].length);
        }
        // 加上新的前綴
        text = prefix + userContent;
      }

      setPlanText(text); // 立即更新本地狀態

      // 立即同步到遠端
      if (gameSync.isConnected) {
        const gameState = {
          cards: {}, // 空的卡片資料
          settings: {
            planText: text, // 文字存在 settings 中
          },
          lastUpdated: Date.now(),
          gameType: `${GAMEPLAY_IDS.GROWTH_PLANNING}_settings`,
        };

        // 儲存狀態 - saveGameState 會自動廣播給所有人
        gameSync.saveGameState(gameState);
      }
    },
    [gameSync, isRoomOwner, getCardPrefix]
  );

  // 當卡片改變時，自動更新前綴
  useEffect(() => {
    if (!isRoomOwner) return;

    const prefix = getCardPrefix();
    if (!prefix) return;

    // 如果已有內容，更新前綴
    if (planText) {
      const oldPrefixMatch = planText.match(/^【技能卡:.*?】\n----------\n/);
      let userContent = planText;
      if (oldPrefixMatch) {
        userContent = planText.substring(oldPrefixMatch[0].length);
      }
      const newText = prefix + userContent;
      if (newText !== planText) {
        handlePlanTextChange(newText);
      }
    } else if (skillCardsInUse.length > 0 || actionCardsInUse.length > 0) {
      // 如果沒有內容但有卡片，初始化前綴
      handlePlanTextChange(prefix);
    }
  }, [
    skillCardsInUse,
    actionCardsInUse,
    skillDeck,
    actionDeck,
    isRoomOwner,
    getCardPrefix,
    handlePlanTextChange,
    planText,
  ]);

  // 過濾出未使用的卡片
  const availableSkillCards =
    skillDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];
  const availableActionCards =
    actionDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

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
          skillCards={skillCardsInUse}
          actionCards={actionCardsInUse}
          planText={planText} // 傳遞同步的文字狀態
          isReadOnly={!isRoomOwner} // 訪客只能讀
        />
      }
    />
  );
};

export default GrowthPlanningGame;
