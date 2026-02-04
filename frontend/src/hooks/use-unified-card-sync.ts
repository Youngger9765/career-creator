/**
 * 統一的卡片同步 Hook
 *
 * 將本地操作和遠端同步邏輯完全整合
 * 解決同步不一致的問題
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCardSync, type CardGameState } from './use-card-sync';
import { useAuthStore } from '@/stores/auth-store';
import { useGameState, type GameState } from '@/stores/game-state-store';
import { useGameplayStatePersistence } from './use-gameplay-state-persistence';
import type { CardZoneInfo, UploadedFile } from '@/types/game';

// ============================================================================
// Constants
// ============================================================================

// Note: Auto-save delay is configured in useGameplayStatePersistence hook
// This file delegates persistence timing to that hook via markDirty()

interface UseUnifiedCardSyncOptions {
  roomId: string;
  gameType: string;
  storeKey: string;
  isRoomOwner: boolean;
  zones: string[]; // 例如 ['like', 'neutral', 'dislike']
  onStateReceived?: (gameState: CardGameState) => void; // Optional callback for handling settings
}

export function useUnifiedCardSync(options: UseUnifiedCardSyncOptions) {
  const { roomId, gameType, storeKey, isRoomOwner, zones, onStateReceived } = options;

  // Auth
  const { user } = useAuthStore();
  // 使用 useMemo 確保 userId 穩定，避免每次 render 產生新的 ID（會造成 broadcast 迴聲）
  const userId = useMemo(() => {
    if (user?.id) return user.id;
    // 嘗試從 localStorage 取得訪客 session
    if (typeof window !== 'undefined') {
      const visitorSession = localStorage.getItem('visitor_session');
      if (visitorSession) {
        try {
          const parsed = JSON.parse(visitorSession);
          return `visitor_${parsed.session_id || parsed.visitor_id}`;
        } catch (e) {
          // ignore
        }
      }
    }
    return `visitor-${Date.now()}`;
  }, [user?.id]);
  const userName = user?.name || '訪客';

  // State
  const { state, updateCards } = useGameState(roomId, storeKey);
  const [draggedByOthers, setDraggedByOthers] = useState<Map<string, string>>(new Map());

  // Persistence: backend for room owner, localStorage for visitor
  const persistence = useGameplayStatePersistence({
    roomId,
    gameplayId: gameType,
    enabled: isRoomOwner, // true=backend, false=localStorage
  });

  /**
   * 核心：統一的卡片移動邏輯
   * 不管是本地還是遠端，都用這個函數處理
   * 返回 { fromZone, newPlacements } 以避免 stale closure 問題
   */
  const moveCardInternal = useCallback(
    (cardId: string, toZone: string | null, skipBroadcast = false) => {
      const currentPlacements: GameState['cardPlacements'] = { ...state.cardPlacements };

      // 0. 先找出 fromZone（在移除前）
      let fromZone = 'deck';
      for (const zone of zones) {
        const key = `${zone}Cards`;
        const zoneCards = currentPlacements[key];
        if (Array.isArray(zoneCards) && zoneCards.includes(cardId)) {
          fromZone = zone;
          break;
        }
      }

      // 1. 從所有區域移除該卡片
      zones.forEach((zone) => {
        const key = `${zone}Cards`;
        const zoneCards = currentPlacements[key];
        if (Array.isArray(zoneCards)) {
          currentPlacements[key] = zoneCards.filter((id: string) => id !== cardId);
        }
      });

      // 2. 如果有目標區域，加入該卡片
      if (toZone && toZone !== 'deck') {
        const key = `${toZone}Cards`;
        if (!Array.isArray(currentPlacements[key])) {
          currentPlacements[key] = [];
        }
        (currentPlacements[key] as string[]).push(cardId);
      }

      // 3. 更新狀態
      updateCards(currentPlacements);

      // 4. Mark as dirty for persistence (skip if from remote)
      if (!skipBroadcast) {
        persistence.markDirty();
      }

      // 5. 返回 fromZone 和更新後的 placements（避免 stale closure）
      return { fromZone, newPlacements: currentPlacements };
    },
    [state.cardPlacements, zones, updateCards, persistence]
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

      // 1. 將收到的卡牌位置轉換為 cardPlacements 格式並套用
      if (gameState.cards) {
        const newPlacements: Record<string, string[]> = {};

        // 初始化所有區域為空陣列
        zones.forEach((zone) => {
          newPlacements[`${zone}Cards`] = [];
        });

        // 根據收到的狀態填入卡牌
        Object.entries(gameState.cards).forEach(([cardId, cardInfo]) => {
          const zone = (cardInfo as { zone: string }).zone;
          const key = `${zone}Cards`;
          if (newPlacements[key]) {
            (newPlacements[key] as string[]).push(cardId);
          }
        });

        // 保留上傳的文件（如果有）- uploadedFile 不在 CardGameState 類型中，但實際會傳遞
        const receivedUploadedFile = (gameState as any).uploadedFile;
        if (receivedUploadedFile || state.cardPlacements.uploadedFile) {
          newPlacements.uploadedFile = receivedUploadedFile || state.cardPlacements.uploadedFile;
        }

        console.log(`[${gameType}] Applying received card placements:`, newPlacements);
        updateCards(newPlacements);
      }

      // 2. Call the optional callback to handle settings (e.g., planText)
      if (onStateReceived) {
        onStateReceived(gameState);
      }
    },
    onFileUpload: (fileData) => {
      console.log(`[${gameType}] Received remote file upload:`, fileData.name);
      // 更新本地狀態（不廣播，因為這是遠端事件）
      const uploadedFile: UploadedFile = {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        url: fileData.url, // GCS public URL (was dataUrl)
        uploadedAt: fileData.uploadedAt,
      };
      updateCards({ uploadedFile });

      // Owner needs to save state when receiving visitor's upload
      if (isRoomOwner) {
        const cards: Record<string, CardZoneInfo> = {};
        zones.forEach((z) => {
          const key = `${z}Cards`;
          const zoneCards = state.cardPlacements[key];
          if (Array.isArray(zoneCards)) {
            zoneCards.forEach((id: string) => {
              cards[id] = { zone: z };
            });
          }
        });

        const gameState = {
          cards,
          uploadedFile,
          lastUpdated: Date.now(),
          gameType,
        };
        cardSync.saveGameState(gameState);
      }
    },
  });

  /**
   * 公開的卡片移動函數（給組件使用）
   */
  const handleCardMove = useCallback(
    (cardId: string, zone: string | null, broadcast = true) => {
      console.log(`[${gameType}] Local move:`, { cardId, zone, broadcast });

      // 執行移動（返回更新後的 placements 避免 stale closure）
      const { fromZone, newPlacements } = moveCardInternal(cardId, zone, false);

      // 廣播事件（如果需要）
      if (broadcast && cardSync.isConnected) {
        const toZone = zone || 'deck';
        cardSync.moveCard(cardId, toZone, fromZone);
      }

      // Owner 儲存狀態（使用 newPlacements 而非 state.cardPlacements）
      if (isRoomOwner) {
        const cards: Record<string, CardZoneInfo> = {};
        zones.forEach((z) => {
          const key = `${z}Cards`;
          const zoneCards = newPlacements[key];
          if (Array.isArray(zoneCards)) {
            zoneCards.forEach((id: string) => {
              cards[id] = { zone: z };
            });
          }
        });

        const gameState = {
          cards,
          uploadedFile: newPlacements.uploadedFile,
          lastUpdated: Date.now(),
          gameType,
        };
        cardSync.saveGameState(gameState);
      }
    },
    [moveCardInternal, cardSync, isRoomOwner, zones, gameType]
  );

  /**
   * 卡片排序函數
   */
  const handleCardReorder = useCallback(
    (zone: string, newCardIds: string[]) => {
      console.log(`[${gameType}] Reorder in zone ${zone}:`, newCardIds);

      // 更新該區域的卡片順序
      const currentPlacements: GameState['cardPlacements'] = { ...state.cardPlacements };
      const key = `${zone}Cards`;
      currentPlacements[key] = newCardIds;

      // 更新狀態
      updateCards(currentPlacements);

      // Mark as dirty for persistence
      persistence.markDirty();

      // Owner 儲存狀態（排序也需要同步）
      if (isRoomOwner) {
        const cards: Record<string, CardZoneInfo> = {};
        zones.forEach((z) => {
          const zoneKey = `${z}Cards`;
          const zoneCards = currentPlacements[zoneKey];
          if (Array.isArray(zoneCards)) {
            zoneCards.forEach((id: string) => {
              cards[id] = { zone: z };
            });
          }
        });

        const gameState = {
          cards,
          uploadedFile: currentPlacements.uploadedFile,
          lastUpdated: Date.now(),
          gameType,
        };
        cardSync.saveGameState(gameState);
      }
    },
    [state.cardPlacements, zones, updateCards, isRoomOwner, cardSync, gameType, persistence]
  );

  /**
   * 文件上傳函數
   */
  const handleFileUpload = useCallback(
    (fileData: UploadedFile) => {
      console.log(`[${gameType}] Local file upload:`, fileData.name);

      // 1. 更新本地狀態
      updateCards({
        uploadedFile: fileData,
      });

      // 2. 廣播到其他用戶
      if (cardSync.isConnected) {
        cardSync.uploadFile(fileData);
      }

      // 3. Mark as dirty for persistence
      persistence.markDirty();
    },
    [updateCards, cardSync, gameType, persistence]
  );

  return {
    state,
    draggedByOthers,
    handleCardMove,
    handleCardReorder, // Export reorder function
    handleFileUpload, // Export file upload function
    updateCards, // Export for components that need it (e.g., backward compatibility)
    cardSync,
    userId,
    userName,
    persistence, // Export persistence info
  };
}
