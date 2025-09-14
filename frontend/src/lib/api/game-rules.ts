/**
 * Game Rules API Client
 * 遊戲規則 API 客戶端
 */

import { apiClient } from './client';

export interface DropZone {
  id: string;
  name: string;
  position: { x: number; y: number };
  max_cards?: number;
  min_cards?: number;
  show_counter?: boolean;
  bg_color?: string;
}

export interface GameRule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  layout_config: {
    deck_area: any;
    drop_zones: DropZone[];
  };
  constraint_config: {
    max_per_zone: Record<string, number>;
    min_per_zone: Record<string, number>;
    total_limit?: number;
    unique_positions?: boolean;
  };
  is_active: boolean;
}

export const gameRulesAPI = {
  // List all active game rules
  list: async () => {
    const response = await apiClient.get<GameRule[]>('/api/game-rules/');
    return response.data;
  },

  // Get game rule by ID
  get: async (ruleId: string) => {
    const response = await apiClient.get<GameRule>(`/api/game-rules/${ruleId}`);
    return response.data;
  },

  // Get game rule by slug
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<GameRule>(`/api/game-rules/by-slug/${slug}`);
    return response.data;
  },
};

// Predefined game rules for quick access
export const GAME_RULES = {
  SKILL_ASSESSMENT: 'skill_assessment',
  VALUE_NAVIGATION: 'value_navigation',
  CAREER_PERSONALITY: 'career_personality',
} as const;

export type GameRuleSlug = typeof GAME_RULES[keyof typeof GAME_RULES];