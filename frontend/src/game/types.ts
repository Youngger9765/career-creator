/**
 * Game Types - 遊戲核心類型定義
 */

export interface GameState {
  room_id: string;
  rule_id: string;
  zones: Map<string, Zone>;
  version: number;
  deck_remaining?: number;
  turn_count?: number;
  current_player?: string;
}

export interface Zone {
  id: string;
  name: string;
  cards: string[];
  max_cards?: number;
  min_cards?: number;
}

export interface GameAction {
  type: 'PLACE' | 'REMOVE' | 'MOVE' | 'FLIP' | 'ARRANGE';
  card_id?: string;
  target_zone?: string;
  source_zone?: string;
  player_id: string;
  position?: { x: number; y: number };
}

export interface GameRule {
  name: string;
  zones: ZoneConfig[];
  constraints?: GameConstraints;
}

export interface ZoneConfig {
  id: string;
  name: string;
  max_cards?: number;
  min_cards?: number;
  position?: { x: number; y: number };
}

export interface GameConstraints {
  max_per_zone?: Record<string, number>;
  min_per_zone?: Record<string, number>;
  total_limit?: number;
  unique_positions?: boolean;
}
