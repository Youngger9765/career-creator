/**
 * 統一導出所有玩法元件
 */

export { default as PersonalityAnalysisGame } from './PersonalityAnalysisGame';
export { default as AdvantageAnalysisGame } from './AdvantageAnalysisGame';
export { default as ValueRankingGame } from './ValueRankingGame';
export { default as CareerCollectorGame } from './CareerCollectorGame';
export { default as GrowthPlanningGame } from './GrowthPlanningGame';
export { default as PositionBreakdownGame } from './PositionBreakdownGame';
export { default as LifeTransformationGame } from './LifeTransformationGame';

// 玩法類型映射
export const GAME_COMPONENTS = {
  // 六大性格分析
  personality_analysis: 'PersonalityAnalysisGame',
  three_columns: 'PersonalityAnalysisGame',

  // 優劣勢分析
  advantage_analysis: 'AdvantageAnalysisGame',
  two_zones: 'AdvantageAnalysisGame',

  // 價值觀排序
  value_ranking: 'ValueRankingGame',
  grid: 'ValueRankingGame',

  // 職涯收藏家
  career_collector: 'CareerCollectorGame',
  collection_zone: 'CareerCollectorGame',

  // 成長計畫
  growth_planning: 'GrowthPlanningGame',
  three_zones: 'GrowthPlanningGame',

  // 職位拆解
  position_breakdown: 'PositionBreakdownGame',
  job_decomposition: 'PositionBreakdownGame',

  // 生活改造王
  life_transformation: 'LifeTransformationGame',
  life_balance: 'LifeTransformationGame',
} as const;

export type GameType = keyof typeof GAME_COMPONENTS;
