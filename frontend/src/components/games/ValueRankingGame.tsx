/**
 * ValueRankingGame - 價值觀排序玩法
 *
 * 使用價值導航卡進行價值觀排序
 * 包含3x3網格佈局
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GridCanvas from '../game-canvases/GridCanvas';
import GameLayout from '../common/GameLayout';
import { useGameCardSync } from '@/hooks/use-game-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

interface ValueRankingGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const ValueRankingGame: React.FC<ValueRankingGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'value',
  deckType = 'value_cards_36',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);

  // 使用通用的遊戲牌卡同步 Hook（但不使用通用的 handleCardMove）
  const gameSync = useGameCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.VALUE_RANKING,
    storeKey: 'value',
    isRoomOwner,
  });

  const { state, draggedByOthers, setCustomMoveHandler, updateCards, cardSync } = gameSync;

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 設置自定義的卡片移動處理器來處理遠端同步
  useEffect(() => {
    setCustomMoveHandler(() => (cardId: string, zone: string | null, broadcast: boolean) => {
      const position = zone === 'deck' || zone === null ? null : {
        row: Math.floor(parseInt(zone) / 3),
        col: parseInt(zone) % 3
      };
      handleCardMove(cardId, position, broadcast);
    });
  }, []);

  // 處理卡片移動
  const handleCardMove = (cardId: string, position: { row: number; col: number } | null, broadcast = true) => {
    const currentGrid = state.cardPlacements.gridCards || Array(9).fill(null);
    let newGrid = [...currentGrid];

    // 找出卡片原本在哪個位置
    let fromZone: string;
    const originalIndex = newGrid.indexOf(cardId);
    if (originalIndex !== -1) {
      fromZone = originalIndex.toString();
      // 清除原位置
      newGrid[originalIndex] = null;
    } else {
      fromZone = 'deck';
    }

    if (position === null) {
      // 卡片被移除，已經在上面清除了
    } else {
      // 卡片被放置到網格中
      const gridIndex = position.row * 3 + position.col;
      if (gridIndex >= 0 && gridIndex < 9) {
        // 如果目標位置已有卡片，將其移回牌組
        if (newGrid[gridIndex] !== null && newGrid[gridIndex] !== cardId) {
          const displacedCard = newGrid[gridIndex];
          // 廣播被替換的卡片移回牌組
          if (broadcast && cardSync.isConnected && displacedCard) {
            cardSync.moveCard(displacedCard, null, gridIndex.toString());
          }
        }
        newGrid[gridIndex] = cardId;
      }
    }

    updateCards({ gridCards: newGrid });

    // 廣播移動事件（如果是本地操作）
    if (broadcast && cardSync.isConnected) {
      const toZone = position === null ? 'deck' : (position.row * 3 + position.col).toString();
      cardSync.moveCard(cardId, toZone, fromZone);
    }

    // Owner 儲存狀態
    if (isRoomOwner) {
      const gameState = {
        cards: newGrid.reduce((acc, cardId, index) => {
          if (cardId) {
            acc[cardId] = { zone: index.toString() };
          }
          return acc;
        }, {} as any),
        lastUpdated: Date.now(),
        gameType: GAMEPLAY_IDS.VALUE_RANKING,
      };
      cardSync.saveGameState(gameState);
    }
  };

  // 計算已使用的卡片
  const gridCards = state.cardPlacements.gridCards || Array(9).fill(null);
  const usedCardIds = new Set(gridCards.filter((id) => id !== null));

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '價值導航',
        gameplay: '價值觀排序',
        canvas: '3x3網格畫布',
        deckName: mainDeck?.name || '價值導航卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'value',
            label: '價值導航卡',
            cards: availableCards,
            color: 'green',
            type: 'value',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={
        <GridCanvas
          cards={mainDeck?.cards || []}
          onCardMove={handleCardMove}
          gridState={gridCards}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
        />
      }
    />
  );
};

export default ValueRankingGame;
