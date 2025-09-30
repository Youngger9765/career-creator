/**
 * 遊戲狀態標準化工具
 * 負責統一不同遊戲的狀態格式
 */

import {
  GameState,
  GameStateBase,
  CardPlacement,
  PersonalityGameState,
  AdvantageGameState,
  ValueRankingGameState,
  CareerCollectorGameState,
  GrowthPlanningGameState,
  PositionBreakdownGameState,
  LifeTransformationGameState,
} from '@/types/game-sync.types';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

export class GameStateNormalizer {
  /**
   * 將本地狀態轉換為統一的儲存格式
   */
  static toStorageFormat<T extends GameState>(
    gameType: T['gameType'],
    localState: any,
    version: number = 0
  ): T {
    const baseState: GameStateBase = {
      cards: this.extractCardPlacements(gameType, localState),
      lastUpdated: Date.now(),
      gameType,
      version: version + 1,
    };

    switch (gameType) {
      case GAMEPLAY_IDS.PERSONALITY_ASSESSMENT:
        return this.toPersonalityFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.ADVANTAGE_ANALYSIS:
        return this.toAdvantageFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.VALUE_RANKING:
        return this.toValueRankingFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.CAREER_COLLECTOR:
        return this.toCareerCollectorFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.GROWTH_PLANNING:
        return this.toGrowthPlanningFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.POSITION_BREAKDOWN:
        return this.toPositionBreakdownFormat(baseState, localState) as T;

      case GAMEPLAY_IDS.LIFE_TRANSFORMATION:
        return this.toLifeTransformationFormat(baseState, localState) as T;

      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  }

  /**
   * 從統一格式恢復為本地狀態
   */
  static fromStorageFormat<T extends GameState>(gameState: T): any {
    switch (gameState.gameType) {
      case GAMEPLAY_IDS.PERSONALITY_ASSESSMENT:
        return this.fromPersonalityFormat(gameState as PersonalityGameState);

      case GAMEPLAY_IDS.ADVANTAGE_ANALYSIS:
        return this.fromAdvantageFormat(gameState as AdvantageGameState);

      case GAMEPLAY_IDS.VALUE_RANKING:
        return this.fromValueRankingFormat(gameState as ValueRankingGameState);

      case GAMEPLAY_IDS.CAREER_COLLECTOR:
        return this.fromCareerCollectorFormat(gameState as CareerCollectorGameState);

      case GAMEPLAY_IDS.GROWTH_PLANNING:
        return this.fromGrowthPlanningFormat(gameState as GrowthPlanningGameState);

      case GAMEPLAY_IDS.POSITION_BREAKDOWN:
        return this.fromPositionBreakdownFormat(gameState as PositionBreakdownGameState);

      case GAMEPLAY_IDS.LIFE_TRANSFORMATION:
        return this.fromLifeTransformationFormat(gameState as LifeTransformationGameState);

      default:
        throw new Error(`Unsupported game type: ${(gameState as any).gameType}`);
    }
  }

  /**
   * 提取卡片位置資訊
   */
  private static extractCardPlacements(gameType: string, localState: any): CardPlacement {
    const placements: CardPlacement = {};
    const cardData = localState.cardPlacements || {};

    // 處理不同遊戲的卡片位置格式
    Object.entries(cardData).forEach(([key, value]) => {
      if (key.endsWith('Cards') && Array.isArray(value)) {
        // 處理陣列格式（如 likeCards, neutralCards）
        const zone = key.replace('Cards', '');
        (value as string[]).forEach((cardId, index) => {
          if (cardId) {
            placements[cardId] = {
              zone,
              index,
              timestamp: Date.now(),
            };
          }
        });
      } else if (key === 'gridCards' && Array.isArray(value)) {
        // 處理網格格式
        (value as (string | null)[]).forEach((cardId, index) => {
          if (cardId) {
            placements[cardId] = {
              zone: 'grid',
              index,
              position: {
                x: index % 3,
                y: Math.floor(index / 3),
              },
              timestamp: Date.now(),
            };
          }
        });
      }
    });

    return placements;
  }

  // === 轉換為儲存格式的方法 ===

  private static toPersonalityFormat(base: GameStateBase, localState: any): PersonalityGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.PERSONALITY_ASSESSMENT,
      zones: {
        like: localState.cardPlacements?.likeCards || [],
        neutral: localState.cardPlacements?.neutralCards || [],
        dislike: localState.cardPlacements?.dislikeCards || [],
      },
    };
  }

  private static toAdvantageFormat(base: GameStateBase, localState: any): AdvantageGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.ADVANTAGE_ANALYSIS,
      zones: {
        advantage: localState.cardPlacements?.advantageCards || [],
        disadvantage: localState.cardPlacements?.disadvantageCards || [],
      },
    };
  }

  private static toValueRankingFormat(base: GameStateBase, localState: any): ValueRankingGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.VALUE_RANKING,
      grid: localState.cardPlacements?.gridCards || [],
    };
  }

  private static toCareerCollectorFormat(
    base: GameStateBase,
    localState: any
  ): CareerCollectorGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.CAREER_COLLECTOR,
      collected: localState.cardPlacements?.collectedCards || [],
      maxCards: localState.maxCards || 15,
    };
  }

  private static toGrowthPlanningFormat(
    base: GameStateBase,
    localState: any
  ): GrowthPlanningGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.GROWTH_PLANNING,
      zones: {
        skills: localState.cardPlacements?.skillCards || [],
        actions: localState.cardPlacements?.actionCards || [],
      },
      planText: localState.cardPlacements?.planText,
    };
  }

  private static toPositionBreakdownFormat(
    base: GameStateBase,
    localState: any
  ): PositionBreakdownGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.POSITION_BREAKDOWN,
      position: localState.cardPlacements?.positionCards || [],
      uploadedFile: localState.cardPlacements?.uploadedFile,
    };
  }

  private static toLifeTransformationFormat(
    base: GameStateBase,
    localState: any
  ): LifeTransformationGameState {
    return {
      ...base,
      gameType: GAMEPLAY_IDS.LIFE_TRANSFORMATION,
      lifeAreas: localState.cardPlacements?.lifeAreas || {},
      totalTokens: localState.totalTokens || 100,
    };
  }

  // === 從儲存格式恢復的方法 ===

  private static fromPersonalityFormat(gameState: PersonalityGameState): any {
    return {
      cardPlacements: {
        likeCards: gameState.zones.like,
        neutralCards: gameState.zones.neutral,
        dislikeCards: gameState.zones.dislike,
      },
    };
  }

  private static fromAdvantageFormat(gameState: AdvantageGameState): any {
    return {
      cardPlacements: {
        advantageCards: gameState.zones.advantage,
        disadvantageCards: gameState.zones.disadvantage,
      },
    };
  }

  private static fromValueRankingFormat(gameState: ValueRankingGameState): any {
    return {
      cardPlacements: {
        gridCards: gameState.grid,
      },
    };
  }

  private static fromCareerCollectorFormat(gameState: CareerCollectorGameState): any {
    return {
      cardPlacements: {
        collectedCards: gameState.collected,
      },
      maxCards: gameState.maxCards,
    };
  }

  private static fromGrowthPlanningFormat(gameState: GrowthPlanningGameState): any {
    return {
      cardPlacements: {
        skillCards: gameState.zones.skills,
        actionCards: gameState.zones.actions,
        planText: gameState.planText,
      },
    };
  }

  private static fromPositionBreakdownFormat(gameState: PositionBreakdownGameState): any {
    return {
      cardPlacements: {
        positionCards: gameState.position,
        uploadedFile: gameState.uploadedFile,
      },
    };
  }

  private static fromLifeTransformationFormat(gameState: LifeTransformationGameState): any {
    return {
      cardPlacements: {
        lifeAreas: gameState.lifeAreas,
      },
      totalTokens: gameState.totalTokens,
    };
  }
}
