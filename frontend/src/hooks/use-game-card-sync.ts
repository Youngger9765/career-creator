/**
 * useGameCardSync - 通用遊戲牌卡同步 Hook
 *
 * 封裝所有遊戲共用的同步邏輯
 * 避免在每個遊戲組件中重複程式碼
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCardSync } from './use-card-sync';
import { useAuthStore } from '@/stores/auth-store';
import { useGameState } from '@/stores/game-state-store';

interface UseGameCardSyncOptions {
  roomId: string;
  gameType: string; // GAMEPLAY_IDS constant
  storeKey: string; // game-state-store key
  isRoomOwner: boolean;
}

interface UseGameCardSyncReturn {
  // 狀態
  state: any;
  draggedByOthers: Map<string, string>;

  // 方法
  handleCardMove: (cardId: string, zone: string | null, broadcast?: boolean) => void;
  updateCards: (placements: any) => void;

  // 同步相關
  cardSync: ReturnType<typeof useCardSync>;
  userId: string;
  userName: string;
}

export function useGameCardSync(options: UseGameCardSyncOptions): UseGameCardSyncReturn {
  const { roomId, gameType, storeKey, isRoomOwner } = options;

  // 取得用戶資訊
  const { user } = useAuthStore();
  const userId = user?.id || `visitor-${Date.now()}`;
  const userName = user?.name || '訪客';

  // 使用 GameStateStore 管理狀態
  const { state, updateCards } = useGameState(roomId, storeKey);

  // 拖曳狀態
  const [draggedByOthers, setDraggedByOthers] = useState<Map<string, string>>(new Map());

  // 內部的卡片移動處理（可被覆寫）
  const customMoveHandlerRef = useRef<
    ((cardId: string, zone: string | null, broadcast?: boolean) => void) | null
  >(null);

  const setCustomMoveHandler = useCallback((
    handler: ((cardId: string, zone: string | null, broadcast?: boolean) => void) | null
  ) => {
    customMoveHandlerRef.current = handler;
    return handler;
  }, []);

  // 使用牌卡同步 Hook
  const cardSync = useCardSync({
    roomId,
    gameType,
    isOwner: isRoomOwner,
    userName,
    userId,
    onCardMove: (event) => {
      console.log(`[${gameType}] Received card move:`, event);

      // 將 toZone 轉換為正確的格式
      // 如果是 'deck' 表示移除，轉為 null
      const zone = event.toZone === 'deck' ? null : event.toZone;

      // 根據遊戲類型更新狀態
      const currentPlacements = { ...state.cardPlacements };

      // 從所有區域移除該卡片
      Object.keys(currentPlacements).forEach(key => {
        if (Array.isArray(currentPlacements[key])) {
          currentPlacements[key] = currentPlacements[key].filter((id: string) => id !== event.cardId);
        }
      });

      // 如果有新區域，加入該卡片
      if (zone) {
        const key = `${zone}Cards`;
        if (!currentPlacements[key]) {
          currentPlacements[key] = [];
        }
        currentPlacements[key].push(event.cardId);
      }

      // 更新狀態
      updateCards(currentPlacements);
    },
    onDragStart: (info) => {
      // 顯示誰在拖曳
      setDraggedByOthers(prev => {
        const next = new Map(prev);
        next.set(info.cardId, info.performerName);
        return next;
      });
    },
    onDragEnd: (cardId) => {
      // 移除拖曳標記
      setDraggedByOthers(prev => {
        const next = new Map(prev);
        next.delete(cardId);
        return next;
      });
    },
    onStateReceived: (gameState) => {
      // 新用戶收到完整狀態
      console.log(`[${gameType}] Received game state:`, gameState);
      // TODO: 更新本地狀態
    },
  });

  // 建立預設的 handleCardMove
  const handleCardMove = useCallback((cardId: string, zone: string | null, broadcast = true) => {
    // 如果有自定義處理器，使用它
    if (customMoveHandlerRef.current) {
      customMoveHandlerRef.current(cardId, zone, broadcast);
      return;
    }

    // 否則只廣播事件
    if (broadcast && cardSync.isConnected) {
      cardSync.moveCard(cardId, zone, 'unknown');
    }
  }, [cardSync]);

  return {
    state,
    draggedByOthers,
    handleCardMove,
    setCustomMoveHandler,
    updateCards,
    cardSync,
    userId,
    userName,
  };
}

/**
 * createCardMoveHandler - 建立通用的卡片移動處理器
 *
 * @param zones 區域名稱陣列，例如 ['like', 'neutral', 'dislike']
 * @param updateCards Store 更新函數
 * @param cardSync 同步服務
 * @param isRoomOwner 是否為房主
 * @param gameType 遊戲類型
 */
export function createCardMoveHandler(
  zones: string[],
  state: any,
  updateCards: (placements: any) => void,
  cardSync: ReturnType<typeof useCardSync>,
  isRoomOwner: boolean,
  gameType: string
) {
  return (cardId: string, zone: string | null, broadcast = true) => {
    const currentPlacements = { ...state.cardPlacements };

    // 找出卡片原本在哪個區域
    let fromZone: string | undefined = 'deck';
    for (const z of zones) {
      const key = `${z}Cards`;
      if (currentPlacements[key]?.includes(cardId)) {
        fromZone = z;
        break;
      }
    }

    // 從所有區域移除該卡片
    for (const z of zones) {
      const key = `${z}Cards`;
      if (currentPlacements[key]) {
        currentPlacements[key] = currentPlacements[key].filter((id: string) => id !== cardId);
      }
    }

    // 如果有新區域，加入該卡片
    if (zone !== null) {
      const key = `${zone}Cards`;
      if (!currentPlacements[key]) {
        currentPlacements[key] = [];
      }
      currentPlacements[key].push(cardId);
    }

    // 更新 Store
    updateCards(currentPlacements);

    // 廣播移動事件（如果是本地操作）
    if (broadcast && cardSync.isConnected) {
      const toZone = zone || 'deck'; // 如果 zone 是 null，表示移回牌組
      cardSync.moveCard(cardId, toZone, fromZone);
    }

    // Owner 儲存狀態
    if (isRoomOwner) {
      const gameState = {
        cards: Object.entries(currentPlacements).reduce((acc, [zoneKey, cards]) => {
          if (Array.isArray(cards)) {
            cards.forEach((id: string) => {
              acc[id] = { zone: zoneKey.replace('Cards', '') };
            });
          }
          return acc;
        }, {} as any),
        lastUpdated: Date.now(),
        gameType,
      };
      cardSync.saveGameState(gameState);
    }
  };
}
