/**
 * GrowthPlanningGame - 成長計畫玩法
 *
 * 結合職能卡(mindset)和行動卡(action)制定成長計畫
 * 包含兩個區域：職能卡區、行動卡區
 *
 * Sync Architecture:
 * - Uses SINGLE channel via useUnifiedCardSync
 * - Settings (planText) synced via cardSync.saveGameState({ settings: { planText } })
 * - Follows LifeTransformationGame pattern
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GrowthPlanCanvas from '../game-canvases/GrowthPlanCanvas';
import GameLayout from '../common/GameLayout';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { CardGameState } from '@/hooks/use-card-sync';
import { debounce } from '@/lib/throttle-debounce';
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
  const [fullDeck, setFullDeck] = useState<any>(null);
  const [planText, setPlanText] = useState<string>('');

  // Ref to track planText for onStateReceived callback (avoid stale closure)
  const planTextRef = useRef(planText);
  useEffect(() => {
    planTextRef.current = planText;
  }, [planText]);

  // 使用統一的卡片同步 Hook - 處理牌卡 + 設定同步（SINGLE channel）
  const { state, draggedByOthers, handleCardMove, cardSync, updateCards, persistence } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.GROWTH_PLANNING,
    storeKey: GAMEPLAY_IDS.GROWTH_PLANNING,
    isRoomOwner,
    zones: ['skills', 'actions'], // 定義這個遊戲的區域
    onStateReceived: (receivedState: any) => {
      console.log('[GrowthPlanning] 接收到遊戲狀態:', receivedState);

      // 處理文字輸入 - 存在 settings 中
      if (receivedState.settings?.planText !== undefined) {
        console.log('[GrowthPlanning] 更新文字:', receivedState.settings.planText);
        setPlanText(receivedState.settings.planText);
      }
    },
  });

  // 載入已儲存的狀態 - 優先從 Zustand (DB) 載入，fallback 到 localStorage
  useEffect(() => {
    // 1. 先檢查 Zustand state (來自 DB persistence)
    if (state.cardPlacements.planText) {
      console.log('[GrowthPlanning] 從 DB 載入文字:', state.cardPlacements.planText);
      setPlanText(state.cardPlacements.planText);
      return;
    }

    // 2. Fallback: 從 localStorage 載入 (舊資料相容)
    if (cardSync.isConnected) {
      const savedState = cardSync.loadGameState();
      console.log('[GrowthPlanning] 載入遊戲狀態:', savedState);

      if (savedState?.settings?.planText !== undefined) {
        console.log('[GrowthPlanning] 從 localStorage 載入文字:', savedState.settings.planText);
        setPlanText(savedState.settings.planText);
        // 同步到 Zustand store 以便未來存到 DB
        updateCards({ planText: savedState.settings.planText });
        persistence.markDirty();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardSync.isConnected, state.cardPlacements.planText]); // 加入 planText 依賴

  // 載入牌組 - 從同一個 deck 中分離 action 和 mindset 卡
  useEffect(() => {
    const getDecks = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck('skill_cards_52');
      setFullDeck(deck);
    };
    getDecks();
  }, []);

  // 從 fullDeck 中分離出 mindset 卡和 action 卡
  const mindsetCards = useMemo(
    () => fullDeck?.cards?.filter((card: any) => card.category === 'mindset') || [],
    [fullDeck]
  );
  const actionCards = useMemo(
    () => fullDeck?.cards?.filter((card: any) => card.category === 'action') || [],
    [fullDeck]
  );

  // 處理卡片使用 - 從卡片ID推斷類型
  const handleCardUse = (cardId: string) => {
    // 從 mindset 卡組中查找
    const isMindsetCard = mindsetCards.some((card: any) => card.id === cardId);
    const zone = isMindsetCard ? 'skills' : 'actions';
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
  const skillCardsInUse = useMemo(
    () => state.cardPlacements.skillsCards || [],
    [state.cardPlacements.skillsCards]
  );
  const actionCardsInUse = useMemo(
    () => state.cardPlacements.actionsCards || [],
    [state.cardPlacements.actionsCards]
  );
  const usedCardIds = useMemo(
    () => new Set([...skillCardsInUse, ...actionCardsInUse]),
    [skillCardsInUse, actionCardsInUse]
  );

  // 合併所有卡片供查找使用
  const allCards = useMemo(
    () => fullDeck?.cards || [],
    [fullDeck?.cards]
  );

  // Keep cardSync in ref to avoid recreating debounced function
  const cardSyncRef = useRef(cardSync);
  useEffect(() => {
    cardSyncRef.current = cardSync;
  }, [cardSync]);

  // Debounced save function for remote sync (500ms delay)
  // This reduces broadcast frequency while maintaining smooth local typing
  const debouncedSaveGameState = useMemo(
    () =>
      debounce((gameState: CardGameState) => {
        if (cardSyncRef.current.isConnected) {
          cardSyncRef.current.saveGameState(gameState);
        }
      }, 500),
    [] // Empty deps - use ref to access latest cardSync
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveGameState.cancel();
    };
  }, [debouncedSaveGameState]);

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

    return `【職能卡: ${skillName} | 行動卡: ${actionName}】\n----------\n`;
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
        const oldPrefixMatch = text.match(/^【職能卡:.*?】\n----------\n/);
        let userContent = text;
        if (oldPrefixMatch) {
          userContent = text.substring(oldPrefixMatch[0].length);
        }
        // 加上新的前綴
        text = prefix + userContent;
      }

      setPlanText(text); // 立即更新本地狀態（打字流暢）

      // 更新 Zustand store（for DB persistence）
      updateCards({ planText: text });

      // 標記需要存到 DB（30 秒後批次存檔）
      persistence.markDirty();

      // Debounced 同步到遠端（500ms 延遲，減少廣播訊息）
      // Build card state from current placements
      const cards: Record<string, { zone: string }> = {};
      ['skills', 'actions'].forEach((zone) => {
        const key = `${zone}Cards`;
        const cardIds = state.cardPlacements[key] || [];
        cardIds.forEach((id: string) => {
          cards[id] = { zone };
        });
      });

      const gameState: CardGameState = {
        cards,
        settings: {
          planText: text, // 文字存在 settings 中
        },
        lastUpdated: Date.now(),
        gameType: GAMEPLAY_IDS.GROWTH_PLANNING, // Use same channel as card sync
      };

      // 使用 debounced 版本 - 只有停止打字 500ms 後才會廣播
      debouncedSaveGameState(gameState);
    },
    [isRoomOwner, getCardPrefix, debouncedSaveGameState, state.cardPlacements, updateCards, persistence]
  );

  // Keep refs for functions to avoid useEffect dependency issues
  const getCardPrefixRef = useRef(getCardPrefix);
  const handlePlanTextChangeRef = useRef(handlePlanTextChange);
  useEffect(() => {
    getCardPrefixRef.current = getCardPrefix;
    handlePlanTextChangeRef.current = handlePlanTextChange;
  }, [getCardPrefix, handlePlanTextChange]);

  // 當卡片改變時，自動更新前綴
  // Only trigger when cards actually change, not when functions/planText change
  useEffect(() => {
    if (!isRoomOwner) return;

    const prefix = getCardPrefixRef.current();
    if (!prefix) return;

    const currentPlanText = planTextRef.current;

    // 如果已有內容，更新前綴
    if (currentPlanText) {
      const oldPrefixMatch = currentPlanText.match(/^【職能卡:.*?】\n----------\n/);
      let userContent = currentPlanText;
      if (oldPrefixMatch) {
        userContent = currentPlanText.substring(oldPrefixMatch[0].length);
      }
      const newText = prefix + userContent;
      if (newText !== currentPlanText) {
        handlePlanTextChangeRef.current(newText);
      }
    } else if (skillCardsInUse.length > 0 || actionCardsInUse.length > 0) {
      // 如果沒有內容但有卡片，初始化前綴
      handlePlanTextChangeRef.current(prefix);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillCardsInUse, actionCardsInUse, isRoomOwner]); // Only depend on actual data changes

  // 過濾出未使用的卡片
  const availableMindsetCards = mindsetCards.filter((card: any) => !usedCardIds.has(card.id));
  const availableActionCards = actionCards.filter((card: any) => !usedCardIds.has(card.id));

  return (
    <GameLayout
      infoBar={{
        mode: '職能盤點',
        gameplay: '成長計畫',
        canvas: 'AB 畫布',
        deckName: fullDeck?.name || '職能卡、行動卡',
        totalCards: fullDeck?.cards?.length || 0,
        availableCards: availableMindsetCards.length + availableActionCards.length,
      }}
      sidebar={{
        type: 'tabbed',
        decks: [
          {
            id: 'mindset',
            label: '職能卡',
            cards: availableMindsetCards,
            color: 'blue',
            type: 'mindset',
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
      enableViewModeToggle={true}
      canvas={(viewMode, onViewModeChange) => (
        <GrowthPlanCanvas
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
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
      )}
    />
  );
};

export default GrowthPlanningGame;
