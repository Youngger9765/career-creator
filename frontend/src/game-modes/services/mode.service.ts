/**
 * GameModeService - 遊戲模式服務層
 *
 * 負責管理三大遊戲模式及其玩法配置
 * 提供新舊系統ID映射功能
 */

export interface Gameplay {
  id: string;
  name: string;
  description?: string;
}

export interface GameMode {
  id: string;
  name: string;
  description?: string;
  legacyRuleId: string;
  gameplays: Gameplay[];
}

export class GameModeService {
  /**
   * 三大遊戲模式配置
   * 硬編碼在第一階段，後續可改為從配置檔或資料庫載入
   */
  private static modes: GameMode[] = [
    {
      id: 'career_traveler',
      name: '職游旅人卡',
      description: '探索職業性格與職涯方向',
      legacyRuleId: 'personality_assessment',
      gameplays: [
        {
          id: 'personality_analysis',
          name: '六大性格分析',
          description: '透過RIASEC模型分析職業性格偏好'
        },
        {
          id: 'career_collector',
          name: '職業收藏家',
          description: '從100張職業卡中精選最感興趣的15張'
        }
      ]
    },
    {
      id: 'skill_inventory',
      name: '職能盤點卡',
      description: '分析個人優勢與成長領域',
      legacyRuleId: 'skill_assessment',
      gameplays: [
        {
          id: 'advantage_analysis',
          name: '優劣勢分析',
          description: '識別個人的優勢與待改進領域'
        },
        {
          id: 'growth_planning',
          name: '成長計畫',
          description: '制定職涯發展路徑和技能提升計畫'
        },
        {
          id: 'position_breakdown',
          name: '職位拆解',
          description: '深度分析特定職位所需的各項能力'
        }
      ]
    },
    {
      id: 'value_navigation',
      name: '價值導航卡',
      description: '釐清人生價值觀與優先順序',
      legacyRuleId: 'value_ranking',
      gameplays: [
        {
          id: 'value_ranking',
          name: '價值觀排序',
          description: '從36張價值卡中排出優先順序'
        },
        {
          id: 'life_redesign',
          name: '生活改造王',
          description: '使用100點生活能量重新分配人生重點'
        }
      ]
    }
  ];

  /**
   * 取得所有遊戲模式
   */
  static getAllModes(): GameMode[] {
    return this.modes;
  }

  /**
   * 根據ID取得特定模式
   */
  static getMode(modeId: string): GameMode | undefined {
    return this.modes.find(m => m.id === modeId);
  }

  /**
   * 取得模式下的所有玩法
   */
  static getGameplays(modeId: string): Gameplay[] {
    const mode = this.getMode(modeId);
    return mode?.gameplays || [];
  }

  /**
   * 取得特定玩法
   */
  static getGameplay(modeId: string, gameplayId: string): Gameplay | undefined {
    const mode = this.getMode(modeId);
    return mode?.gameplays.find(g => g.id === gameplayId);
  }

  /**
   * 新模式ID映射到舊規則ID
   * 這是橋接層的核心功能，確保向後兼容
   */
  static getLegacyRuleId(modeId: string): string {
    const mode = this.getMode(modeId);
    return mode?.legacyRuleId || 'skill_assessment'; // 預設返回技能評估
  }

  /**
   * 根據玩法取得對應的舊規則ID
   * 某些玩法可能需要特殊映射
   */
  static getGameplayLegacyRule(modeId: string, gameplayId: string): string {
    // 目前簡單返回模式的legacyRuleId
    // 未來可以根據不同玩法返回不同規則
    return this.getLegacyRuleId(modeId);
  }

  /**
   * 檢查模式是否存在
   */
  static hasMode(modeId: string): boolean {
    return this.modes.some(m => m.id === modeId);
  }

  /**
   * 檢查玩法是否存在
   */
  static hasGameplay(modeId: string, gameplayId: string): boolean {
    const mode = this.getMode(modeId);
    return mode?.gameplays.some(g => g.id === gameplayId) || false;
  }

  /**
   * 取得模式總數
   */
  static getModeCount(): number {
    return this.modes.length;
  }

  /**
   * 根據舊規則ID反查新模式ID
   * 用於從舊系統遷移到新系統
   */
  static getModeIdByLegacyRule(legacyRuleId: string): string | undefined {
    const mode = this.modes.find(m => m.legacyRuleId === legacyRuleId);
    return mode?.id;
  }
}
