/**
 * 遊戲同步相關的型別定義
 */

import { GAMEPLAY_IDS } from '@/constants/game-modes';

/**
 * 卡片位置資訊
 */
export interface CardPosition {
  zone: string;
  index?: number;
  position?: { x: number; y: number };
  timestamp?: number;
}

/**
 * 卡片放置狀態
 */
export interface CardPlacement {
  [cardId: string]: CardPosition;
}

/**
 * 基礎遊戲狀態
 */
export interface GameStateBase {
  cards: CardPlacement;
  lastUpdated: number;
  gameType: string;
  version: number;
}

/**
 * 性格分析遊戲狀態
 */
export interface PersonalityGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.PERSONALITY_ASSESSMENT;
  zones: {
    like: string[];
    neutral: string[];
    dislike: string[];
  };
}

/**
 * 優劣勢分析遊戲狀態
 */
export interface AdvantageGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.ADVANTAGE_ANALYSIS;
  zones: {
    advantage: string[];
    disadvantage: string[];
  };
}

/**
 * 價值排序遊戲狀態
 */
export interface ValueRankingGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.VALUE_RANKING;
  grid: (string | null)[];
}

/**
 * 職涯收藏家遊戲狀態
 */
export interface CareerCollectorGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.CAREER_COLLECTOR;
  collected: string[];
  maxCards: number;
}

/**
 * 成長計畫遊戲狀態
 */
export interface GrowthPlanningGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.GROWTH_PLANNING;
  zones: {
    skills: string[];
    actions: string[];
  };
  planText?: string;
}

/**
 * 職位拆解遊戲狀態
 */
export interface PositionBreakdownGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.POSITION_BREAKDOWN;
  position: string[];
  uploadedFile?: {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    uploadedAt: number;
  };
}

/**
 * 生活改造王遊戲狀態
 */
export interface LifeTransformationGameState extends GameStateBase {
  gameType: typeof GAMEPLAY_IDS.LIFE_TRANSFORMATION;
  lifeAreas: {
    [areaKey: string]: {
      cards: string[];
      tokens: number;
    };
  };
  totalTokens: number;
}

/**
 * 所有遊戲狀態的聯合型別
 */
export type GameState =
  | PersonalityGameState
  | AdvantageGameState
  | ValueRankingGameState
  | CareerCollectorGameState
  | GrowthPlanningGameState
  | PositionBreakdownGameState
  | LifeTransformationGameState;

/**
 * 卡片移動事件
 */
export interface CardMoveEvent {
  cardId: string;
  fromZone: string | null;
  toZone: string | null;
  performerId: string;
  performerName: string;
  timestamp: number;
  gameType: string;
}

/**
 * 拖曳事件
 */
export interface DragEvent {
  cardId: string;
  isDragging: boolean;
  performerId: string;
  performerName: string;
  timestamp: number;
}

/**
 * 同步狀態
 */
export interface SyncStatus {
  isConnected: boolean;
  isRoomOwner: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  error: Error | null;
}

/**
 * 遊戲卡片同步選項
 */
export interface UseGameCardSyncOptions<T extends GameState = GameState> {
  roomId: string;
  gameType: T['gameType'];
  storeKey: string;
  isRoomOwner: boolean;
  onError?: (error: Error) => void;
}

/**
 * 遊戲卡片同步返回值
 */
export interface UseGameCardSyncReturn<T extends GameState = GameState> {
  state: {
    cardPlacements: Record<string, any>; // TODO: 根據遊戲類型細化
  };
  draggedByOthers: Map<string, string>;
  updateCards: (placements: Partial<T>) => void;
  cardSync: {
    isConnected: boolean;
    moveCard: (cardId: string, toZone: string | null, fromZone?: string, broadcast?: boolean) => void;
    startDrag: (cardId: string) => void;
    endDrag: (cardId: string) => void;
    saveGameState: (state: Partial<T>) => void;
  };
  syncStatus: SyncStatus;
}

/**
 * 卡片移動處理器
 */
export type CardMoveHandler = (
  cardId: string,
  zone: string | null,
  broadcast?: boolean
) => void;

/**
 * 區域配置
 */
export interface ZoneConfig {
  id: string;
  name: string;
  maxCards?: number;
  allowReorder?: boolean;
}

/**
 * 遊戲配置
 */
export interface GameConfig<T extends GameState = GameState> {
  gameType: T['gameType'];
  zones: ZoneConfig[];
  stateNormalizer: (state: any) => T;
  stateDeserializer: (gameState: T) => any;
}
