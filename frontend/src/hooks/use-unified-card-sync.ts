/**
 * 統一的卡片同步 Hook
 *
 * 將本地操作和遠端同步邏輯完全整合
 * 解決同步不一致的問題
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCardSync } from './use-card-sync';
import { useAuthStore } from '@/stores/auth-store';
import { useGameState } from '@/stores/game-state-store';

interface UseUnifiedCardSyncOptions {
  roomId: string;
  gameType: string;
  storeKey: string;
  isRoomOwner: boolean;
  zones: string[]; // 例如 ['like', 'neutral', 'dislike']
}

export function useUnifiedCardSync(options: UseUnifiedCardSyncOptions) {
  const { roomId, gameType, storeKey, isRoomOwner, zones } = options;

  // Auth
  const { user } = useAuthStore();
  const userId = user?.id || `visitor-${Date.now()}`;
  const userName = user?.name || '訪客';

  // State
  const { state, updateCards } = useGameState(roomId, storeKey);
  const [draggedByOthers, setDraggedByOthers] = useState<Map<string, string>>(new Map());

  /**
   * 核心：統一的卡片移動邏輯
   * 不管是本地還是遠端，都用這個函數處理
   */
  const moveCardInternal = useCallback(
    (cardId: string, toZone: string | null, skipBroadcast = false) => {
      const currentPlacements = { ...state.cardPlacements };

      // 1. 從所有區域移除該卡片
      zones.forEach((zone) => {
        const key = `${zone}Cards`;
        if (currentPlacements[key]) {
          currentPlacements[key] = currentPlacements[key].filter((id: string) => id !== cardId);
        }
      });

      // 2. 如果有目標區域，加入該卡片
      if (toZone && toZone !== 'deck') {
        const key = `${toZone}Cards`;
        if (!currentPlacements[key]) {
          currentPlacements[key] = [];
        }
        currentPlacements[key].push(cardId);
      }

      // 3. 更新狀態
      updateCards(currentPlacements);

      // 4. 返回實際的 fromZone（用於廣播）
      let fromZone = 'deck';
      for (const zone of zones) {
        const key = `${zone}Cards`;
        if (state.cardPlacements[key]?.includes(cardId)) {
          fromZone = zone;
          break;
        }
      }

      return fromZone;
    },
    [state.cardPlacements, zones, updateCards]
  );

  // 同步服務
  const cardSync = useCardSync({
    roomId,
    gameType,
    isOwner: isRoomOwner,
    userName,
    userId,
    onCardMove: (event) => {
      console.log(`[${gameType}] Received remote move:`, event);
      // 遠端事件：直接調用內部移動函數，不廣播
      const zone = event.toZone === 'deck' ? null : event.toZone;
      moveCardInternal(event.cardId, zone, true);
    },
    onDragStart: (info) => {
      setDraggedByOthers((prev) => {
        const next = new Map(prev);
        next.set(info.cardId, info.performerName);
        return next;
      });
    },
    onDragEnd: (cardId) => {
      setDraggedByOthers((prev) => {
        const next = new Map(prev);
        next.delete(cardId);
        return next;
      });
    },
    onStateReceived: (gameState) => {
      console.log(`[${gameType}] Received game state:`, gameState);
      // TODO: 處理完整狀態同步
    },
  });

  /**
   * 公開的卡片移動函數（給組件使用）
   */
  const handleCardMove = useCallback(
    (cardId: string, zone: string | null, broadcast = true) => {
      console.log(`[${gameType}] Local move:`, { cardId, zone, broadcast });

      // 執行移動
      const fromZone = moveCardInternal(cardId, zone, false);

      // 廣播事件（如果需要）
      if (broadcast && cardSync.isConnected) {
        const toZone = zone || 'deck';
        cardSync.moveCard(cardId, toZone, fromZone);
      }

      // Owner 儲存狀態
      if (isRoomOwner) {
        const gameState = {
          cards: zones.reduce((acc, z) => {
            const key = `${z}Cards`;
            const cards = state.cardPlacements[key] || [];
            cards.forEach((id: string) => {
              acc[id] = { zone: z };
            });
            return acc;
          }, {} as any),
          lastUpdated: Date.now(),
          gameType,
        };
        cardSync.saveGameState(gameState);
      }
    },
    [moveCardInternal, cardSync, isRoomOwner, zones, state.cardPlacements, gameType]
  );

  /**
   * 卡片排序函數
   */
  const handleCardReorder = useCallback(
    (zone: string, newCardIds: string[]) => {
      console.log(`[${gameType}] Reorder in zone ${zone}:`, newCardIds);

      // 更新該區域的卡片順序
      const currentPlacements = { ...state.cardPlacements };
      const key = `${zone}Cards`;
      currentPlacements[key] = newCardIds;

      // 更新狀態
      updateCards(currentPlacements);

      // Owner 儲存狀態（排序也需要同步）
      if (isRoomOwner) {
        const gameState = {
          cards: zones.reduce((acc, z) => {
            const zoneKey = `${z}Cards`;
            const cards = currentPlacements[zoneKey] || [];
            cards.forEach((id: string) => {
              acc[id] = { zone: z };
            });
            return acc;
          }, {} as any),
          lastUpdated: Date.now(),
          gameType,
        };
        cardSync.saveGameState(gameState);
      }
    },
    [state.cardPlacements, zones, updateCards, isRoomOwner, cardSync, gameType]
  );

  return {
    state,
    draggedByOthers,
    handleCardMove,
    handleCardReorder, // Export reorder function
    updateCards, // Export for components that need it (e.g., file upload)
    cardSync,
    userId,
    userName,
  };
}
