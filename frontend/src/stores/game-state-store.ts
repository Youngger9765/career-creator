/**
 * GameStateStore - 遊戲狀態管理
 *
 * 使用 Zustand 管理各遊戲獨立狀態
 * 支援 localStorage 持久化
 * 確保不同遊戲之間狀態完全隔離
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 遊戲狀態介面
export interface GameState {
  cardPlacements: {
    // PersonalityAnalysis
    likeCards?: string[];
    neutralCards?: string[];
    dislikeCards?: string[];

    // AdvantageAnalysis
    advantageCards?: string[];
    disadvantageCards?: string[];

    // ValueRanking
    gridCards?: Array<string | null>;

    // CareerCollector
    collectedCards?: string[];

    // GrowthPlanning
    skillCards?: string[];
    actionCards?: string[];
    planText?: string;

    // PositionBreakdown
    positionCards?: string[];
    uploadedFile?: {
      name: string;
      type: string;
      size: number;
      dataUrl: string; // Base64 data URL for persistence
      uploadedAt: number;
    };

    // LifeTransformation
    lifeAreas?: Record<
      string,
      {
        cards: string[];
        tokens: number;
      }
    >;
  };
  metadata: {
    version: number;
    lastModified: number;
    lastModifiedBy?: string;
    syncStatus?: 'local' | 'pending' | 'synced';
  };
}

// Store 介面
interface GameStateStore {
  // 狀態儲存 Map
  states: Map<string, GameState>;

  // 核心方法
  getGameState: (roomId: string, gameType: string) => GameState;
  setGameState: (roomId: string, gameType: string, state: Partial<GameState>) => void;
  clearGameState: (roomId: string, gameType: string) => void;

  // 輔助方法
  updateCardPlacement: (
    roomId: string,
    gameType: string,
    placement: Partial<GameState['cardPlacements']>
  ) => void;
}

// 預設狀態生成
const getDefaultState = (gameType: string): GameState => {
  const baseState: GameState = {
    cardPlacements: {},
    metadata: {
      version: 1,
      lastModified: Date.now(),
      syncStatus: 'local',
    },
  };

  // 根據遊戲類型初始化特定欄位
  switch (gameType) {
    case 'personality':
      baseState.cardPlacements = {
        likeCards: [],
        neutralCards: [],
        dislikeCards: [],
      };
      break;

    case 'advantage':
      baseState.cardPlacements = {
        advantageCards: [],
        disadvantageCards: [],
      };
      break;

    case 'value':
      baseState.cardPlacements = {
        gridCards: Array(9).fill(null),
      };
      break;

    case 'career':
      baseState.cardPlacements = {
        collectedCards: [],
      };
      break;

    case 'growth':
      baseState.cardPlacements = {
        skillCards: [],
        actionCards: [],
        planText: '',
      };
      break;

    case 'position':
      baseState.cardPlacements = {
        positionCards: [],
      };
      break;

    case 'life':
      baseState.cardPlacements = {
        lifeAreas: {
          health: { cards: [], tokens: 0 },
          career: { cards: [], tokens: 0 },
          family: { cards: [], tokens: 0 },
          finance: { cards: [], tokens: 0 },
          social: { cards: [], tokens: 0 },
          personal: { cards: [], tokens: 0 },
        },
      };
      break;
  }

  return baseState;
};

// 建立 Store Key
const makeKey = (roomId: string, gameType: string) => `${roomId}:${gameType}`;

// Zustand Store
export const useGameStateStore = create<GameStateStore>()(
  persist(
    (set, get) => ({
      states: new Map(),

      getGameState: (roomId: string, gameType: string) => {
        const key = makeKey(roomId, gameType);
        const states = get().states;

        // 如果有現有狀態，返回
        if (states.has(key)) {
          return states.get(key)!;
        }

        // 否則返回預設狀態
        return getDefaultState(gameType);
      },

      setGameState: (roomId: string, gameType: string, state: Partial<GameState>) => {
        const key = makeKey(roomId, gameType);

        set((store) => {
          const newStates = new Map(store.states);
          const currentState = newStates.get(key) || getDefaultState(gameType);

          // 合併狀態並更新元資料
          const updatedState: GameState = {
            ...currentState,
            ...state,
            cardPlacements: {
              ...currentState.cardPlacements,
              ...(state.cardPlacements || {}),
            },
            metadata: {
              ...currentState.metadata,
              ...(state.metadata || {}),
              version: currentState.metadata.version + 1,
              lastModified: Date.now(),
            },
          };

          newStates.set(key, updatedState);
          return { states: newStates };
        });
      },

      clearGameState: (roomId: string, gameType: string) => {
        const key = makeKey(roomId, gameType);

        set((store) => {
          const newStates = new Map(store.states);
          const defaultState = getDefaultState(gameType);

          newStates.set(key, defaultState);
          return { states: newStates };
        });
      },

      updateCardPlacement: (
        roomId: string,
        gameType: string,
        placement: Partial<GameState['cardPlacements']>
      ) => {
        const current = get().getGameState(roomId, gameType);

        get().setGameState(roomId, gameType, {
          cardPlacements: {
            ...current.cardPlacements,
            ...placement,
          },
        });
      },
    }),
    {
      name: 'game-state-store',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          // 處理 Map 的反序列化
          if (key === 'states' && value && typeof value === 'object') {
            return new Map(Object.entries(value));
          }
          return value;
        },
        replacer: (key, value) => {
          // 處理 Map 的序列化
          if (key === 'states' && value instanceof Map) {
            return Object.fromEntries(value);
          }
          return value;
        },
      }),
    }
  )
);

// Hook: 取得特定遊戲狀態
export const useGameState = (roomId: string, gameType: string) => {
  const { getGameState, setGameState, updateCardPlacement } = useGameStateStore();

  const state = getGameState(roomId, gameType);

  const updateState = (updates: Partial<GameState>) => {
    setGameState(roomId, gameType, updates);
  };

  const updateCards = (placement: Partial<GameState['cardPlacements']>) => {
    updateCardPlacement(roomId, gameType, placement);
  };

  return {
    state,
    updateState,
    updateCards,
  };
};
