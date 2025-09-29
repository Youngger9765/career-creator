/**
 * 統一的遊戲模式命名常數
 * 解決命名不一致問題的單一真相來源
 */

// 牌組類型
export const DECK_TYPES = {
  TRAVELER: '職游旅人卡',
  SKILLS: '職能盤點卡',
  VALUES: '價值導航卡',
} as const;

// 遊戲玩法 ID（統一命名）
export const GAMEPLAY_IDS = {
  // 職游旅人卡玩法
  PERSONALITY_ASSESSMENT: 'personality_assessment',
  ADVANTAGE_ANALYSIS: 'advantage_analysis',

  // 職能盤點卡玩法
  CAREER_COLLECTOR: 'career_collector',
  GROWTH_PLANNING: 'growth_planning',
  POSITION_BREAKDOWN: 'position_breakdown',

  // 價值導航卡玩法
  VALUE_RANKING: 'value_ranking',
  LIFE_REDESIGN: 'life_redesign',
} as const;

// 遊戲玩法名稱（用於顯示）
export const GAMEPLAY_NAMES: Record<string, string> = {
  [GAMEPLAY_IDS.PERSONALITY_ASSESSMENT]: '六大性格分析',
  [GAMEPLAY_IDS.ADVANTAGE_ANALYSIS]: '優劣勢分析',
  [GAMEPLAY_IDS.CAREER_COLLECTOR]: '職能收集家',
  [GAMEPLAY_IDS.GROWTH_PLANNING]: '成長規劃',
  [GAMEPLAY_IDS.POSITION_BREAKDOWN]: '職位拆解',
  [GAMEPLAY_IDS.VALUE_RANKING]: '價值觀排序',
  [GAMEPLAY_IDS.LIFE_REDESIGN]: '生活重新設計',
};

// 牌組與玩法的對應關係
export const DECK_GAMEPLAY_MAPPING = {
  [DECK_TYPES.TRAVELER]: [GAMEPLAY_IDS.PERSONALITY_ASSESSMENT, GAMEPLAY_IDS.ADVANTAGE_ANALYSIS],
  [DECK_TYPES.SKILLS]: [
    GAMEPLAY_IDS.CAREER_COLLECTOR,
    GAMEPLAY_IDS.GROWTH_PLANNING,
    GAMEPLAY_IDS.POSITION_BREAKDOWN,
    GAMEPLAY_IDS.ADVANTAGE_ANALYSIS,
  ],
  [DECK_TYPES.VALUES]: [
    GAMEPLAY_IDS.VALUE_RANKING,
    GAMEPLAY_IDS.LIFE_REDESIGN,
    GAMEPLAY_IDS.ADVANTAGE_ANALYSIS,
  ],
} as const;

// 輔助函數：取得預設玩法
export function getDefaultGameplay(deck: string): string {
  const gameplays = DECK_GAMEPLAY_MAPPING[deck as keyof typeof DECK_GAMEPLAY_MAPPING];
  return gameplays ? gameplays[0] : GAMEPLAY_IDS.PERSONALITY_ASSESSMENT;
}

// 輔助函數：檢查玩法是否可用於指定牌組
export function isGameplayAvailable(deck: string, gameplay: string): boolean {
  const gameplays = DECK_GAMEPLAY_MAPPING[deck as keyof typeof DECK_GAMEPLAY_MAPPING];
  return gameplays ? gameplays.includes(gameplay as any) : false;
}

// Type exports
export type DeckType = (typeof DECK_TYPES)[keyof typeof DECK_TYPES];
export type GameplayId = (typeof GAMEPLAY_IDS)[keyof typeof GAMEPLAY_IDS];
