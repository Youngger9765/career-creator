/**
 * LegacyGameAdapter - 新舊系統橋接層
 *
 * 使用 Adapter Pattern 將新的模式系統橋接到現有的 GameEngine
 * 確保向後兼容，實現無縫遷移
 */

import { GameEngine } from '@/game/engine';
import { GameState } from '@/game/types';
import { GameModeService } from '../services/mode.service';

export class LegacyGameAdapter {
  /**
   * 使用新的模式ID啟動遊戲
   * 內部轉換為舊系統的規則ID
   *
   * @param modeId - 新系統的模式ID (如: 'career_traveler')
   * @param gameplayId - 玩法ID (如: 'personality_analysis')
   * @returns 遊戲狀態
   */
  static startGameWithMode(modeId: string, gameplayId?: string): GameState {
    // 取得對應的舊規則ID
    const legacyRuleId = gameplayId
      ? GameModeService.getGameplayLegacyRule(modeId, gameplayId)
      : GameModeService.getLegacyRuleId(modeId);

    // 使用現有的 GameEngine 創建初始狀態
    return GameEngine.createInitialState(legacyRuleId);
  }

  /**
   * 使用新模式系統創建遊戲會話
   * 提供更豐富的配置選項
   */
  static createSession(
    modeId: string,
    gameplayId: string,
    options?: {
      roomId?: string;
      playerId?: string;
    }
  ): GameState {
    const state = this.startGameWithMode(modeId, gameplayId);

    // 可以在這裡添加額外的配置
    if (options?.roomId) {
      state.room_id = options.roomId;
    }

    return state;
  }

  /**
   * 驗證模式和玩法是否有效
   */
  static validateModeAndGameplay(modeId: string, gameplayId: string): boolean {
    return GameModeService.hasMode(modeId) && GameModeService.hasGameplay(modeId, gameplayId);
  }

  /**
   * 從舊規則ID遷移到新模式系統
   * 用於資料遷移和向後兼容
   */
  static migrateFromLegacyRule(legacyRuleId: string): {
    modeId: string | undefined;
    gameplayId: string | undefined;
  } {
    const modeId = GameModeService.getModeIdByLegacyRule(legacyRuleId);

    // 根據舊規則ID推斷玩法ID
    let gameplayId: string | undefined;

    switch (legacyRuleId) {
      case 'personality_assessment':
        gameplayId = 'personality_analysis';
        break;
      case 'skill_assessment':
        gameplayId = 'advantage_analysis';
        break;
      case 'value_ranking':
        gameplayId = 'value_ranking';
        break;
    }

    return { modeId, gameplayId };
  }

  /**
   * 取得遊戲配置資訊
   * 結合新模式系統和舊規則系統的資訊
   */
  static getGameConfiguration(
    modeId: string,
    gameplayId: string
  ): {
    mode: ReturnType<typeof GameModeService.getMode>;
    gameplay: ReturnType<typeof GameModeService.getGameplay>;
    legacyRuleId: string;
    canvasType: string;
  } {
    const mode = GameModeService.getMode(modeId);
    const gameplay = GameModeService.getGameplay(modeId, gameplayId);
    const legacyRuleId = GameModeService.getGameplayLegacyRule(modeId, gameplayId);

    // 根據規則ID推斷畫布類型（暫時硬編碼，後續從配置載入）
    let canvasType = 'default';
    switch (legacyRuleId) {
      case 'personality_assessment':
        canvasType = 'three_columns';
        break;
      case 'skill_assessment':
        canvasType = 'two_zones';
        break;
      case 'value_ranking':
        canvasType = 'grid_3x3';
        break;
    }

    return {
      mode,
      gameplay,
      legacyRuleId,
      canvasType,
    };
  }

  /**
   * 檢查是否應該使用新系統
   * 可以透過 Feature Flag 或其他條件控制
   */
  static shouldUseNewSystem(): boolean {
    // 第一階段：預設使用舊系統
    // 可以透過環境變數或 localStorage 控制
    const featureFlag =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('USE_NEW_GAME_MODE_SYSTEM')
        : null;

    return featureFlag === 'true';
  }

  /**
   * 智能選擇使用新系統或舊系統
   * 提供平滑的遷移路徑
   */
  static createGameState(modeOrRuleId: string, gameplayId?: string): GameState {
    if (this.shouldUseNewSystem() && GameModeService.hasMode(modeOrRuleId)) {
      // 使用新系統
      return this.startGameWithMode(modeOrRuleId, gameplayId);
    } else {
      // 使用舊系統（假設傳入的是舊的 rule_id）
      return GameEngine.createInitialState(modeOrRuleId);
    }
  }
}
