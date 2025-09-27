/**
 * RuleFactory - 遊戲規則工廠
 *
 * 管理和提供不同的遊戲規則配置
 * 這是現有系統，新系統將透過 Adapter 橋接到這裡
 */

import { GameRule } from '../types';

export class RuleFactory {
  private static rules = new Map<string, GameRule>([
    // 技能評估規則（優劣勢分析）
    [
      'skill_assessment',
      {
        name: 'skill_assessment',
        zones: [
          {
            id: 'advantage',
            name: '優勢',
            max_cards: 5,
            position: { x: 100, y: 100 },
          },
          {
            id: 'disadvantage',
            name: '劣勢',
            max_cards: 5,
            position: { x: 300, y: 100 },
          },
        ],
        constraints: {
          max_per_zone: {
            advantage: 5,
            disadvantage: 5,
          } as Record<string, number>,
          total_limit: 10,
        },
      },
    ],

    // 價值排序規則（3x3九宮格）
    [
      'value_ranking',
      {
        name: 'value_ranking',
        zones: (() => {
          const zones = [];
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              zones.push({
                id: `grid-${row}-${col}`,
                name: `位置 ${row * 3 + col + 1}`,
                max_cards: 1,
                position: { x: col * 150, y: row * 150 },
              });
            }
          }
          return zones;
        })(),
        constraints: {
          unique_positions: true,
          total_limit: 9,
        },
      },
    ],

    // 性格評估規則（六大性格分析）
    [
      'personality_assessment',
      {
        name: 'personality_assessment',
        zones: [
          {
            id: 'like',
            name: '喜歡',
            max_cards: 20,
            position: { x: 50, y: 100 },
          },
          {
            id: 'neutral',
            name: '中立',
            max_cards: undefined, // 無限制
            position: { x: 250, y: 100 },
          },
          {
            id: 'dislike',
            name: '討厭',
            max_cards: 20,
            position: { x: 450, y: 100 },
          },
        ],
        constraints: {
          max_per_zone: {
            like: 20,
            dislike: 20,
            neutral: 999, // Large number for effectively unlimited
          } as Record<string, number>,
        },
      },
    ],
  ]);

  /**
   * 取得規則
   */
  static getRule(ruleId: string): GameRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * 取得所有規則
   */
  static getAllRules(): GameRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 檢查規則是否存在
   */
  static hasRule(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  /**
   * 註冊新規則
   */
  static registerRule(ruleId: string, rule: GameRule): void {
    this.rules.set(ruleId, rule);
  }

  /**
   * 取得規則ID列表
   */
  static getRuleIds(): string[] {
    return Array.from(this.rules.keys());
  }
}
