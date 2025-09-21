/**
 * GameEngine - 遊戲引擎核心
 *
 * 管理遊戲狀態和規則驗證
 * 這是簡化版本，用於支援 TDD 測試
 */

import { GameState, GameAction, Zone } from './types';
import { RuleFactory } from './rules/rule-factory';

export class GameEngine {
  /**
   * 創建初始遊戲狀態
   */
  static createInitialState(ruleId: string): GameState {
    const rule = RuleFactory.getRule(ruleId);
    const zones = new Map<string, Zone>();

    // 根據規則創建區域
    if (rule) {
      rule.zones.forEach(zoneConfig => {
        zones.set(zoneConfig.id, {
          id: zoneConfig.id,
          name: zoneConfig.name,
          cards: [],
          max_cards: zoneConfig.max_cards,
          min_cards: zoneConfig.min_cards,
        });
      });
    }

    return {
      room_id: '',
      rule_id: ruleId,
      zones,
      version: 1,
      deck_remaining: 100,
      turn_count: 0,
      current_player: '',
    };
  }

  /**
   * 驗證動作是否有效
   */
  static validateAction(action: GameAction, state: GameState): boolean {
    // 基本驗證邏輯
    if (!action.player_id) {
      return false;
    }

    switch (action.type) {
      case 'PLACE':
        return this.validatePlaceAction(action, state);
      case 'REMOVE':
        return this.validateRemoveAction(action, state);
      case 'MOVE':
        return this.validateMoveAction(action, state);
      case 'FLIP':
        return true; // 翻牌總是有效
      case 'ARRANGE':
        return true; // 排列總是有效
      default:
        return false;
    }
  }

  /**
   * 驗證放置動作
   */
  private static validatePlaceAction(action: GameAction, state: GameState): boolean {
    if (!action.target_zone || !action.card_id) {
      return false;
    }

    const zone = state.zones.get(action.target_zone);
    if (!zone) {
      return false;
    }

    // 檢查區域上限
    if (zone.max_cards && zone.cards.length >= zone.max_cards) {
      return false;
    }

    // 檢查卡片是否已存在於其他區域
    for (const [zoneId, z] of state.zones) {
      if (z.cards.includes(action.card_id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 驗證移除動作
   */
  private static validateRemoveAction(action: GameAction, state: GameState): boolean {
    if (!action.source_zone || !action.card_id) {
      return false;
    }

    const zone = state.zones.get(action.source_zone);
    if (!zone) {
      return false;
    }

    return zone.cards.includes(action.card_id);
  }

  /**
   * 驗證移動動作
   */
  private static validateMoveAction(action: GameAction, state: GameState): boolean {
    if (!action.source_zone || !action.target_zone || !action.card_id) {
      return false;
    }

    const sourceZone = state.zones.get(action.source_zone);
    const targetZone = state.zones.get(action.target_zone);

    if (!sourceZone || !targetZone) {
      return false;
    }

    if (!sourceZone.cards.includes(action.card_id)) {
      return false;
    }

    if (targetZone.max_cards && targetZone.cards.length >= targetZone.max_cards) {
      return false;
    }

    return true;
  }

  /**
   * 執行遊戲動作
   */
  static executeAction(action: GameAction, state: GameState): GameState {
    if (!this.validateAction(action, state)) {
      throw new Error('Invalid action');
    }

    const newState = this.cloneState(state);

    switch (action.type) {
      case 'PLACE':
        if (action.target_zone && action.card_id) {
          const zone = newState.zones.get(action.target_zone);
          if (zone) {
            zone.cards.push(action.card_id);
          }
        }
        break;

      case 'REMOVE':
        if (action.source_zone && action.card_id) {
          const zone = newState.zones.get(action.source_zone);
          if (zone) {
            zone.cards = zone.cards.filter(id => id !== action.card_id);
          }
        }
        break;

      case 'MOVE':
        if (action.source_zone && action.target_zone && action.card_id) {
          const sourceZone = newState.zones.get(action.source_zone);
          const targetZone = newState.zones.get(action.target_zone);
          if (sourceZone && targetZone) {
            sourceZone.cards = sourceZone.cards.filter(id => id !== action.card_id);
            targetZone.cards.push(action.card_id);
          }
        }
        break;

      case 'FLIP':
      case 'ARRANGE':
        // These actions don't modify zone structure
        break;
    }

    newState.version++;
    newState.turn_count = (newState.turn_count || 0) + 1;

    return newState;
  }

  /**
   * 深度複製遊戲狀態
   */
  private static cloneState(state: GameState): GameState {
    const newZones = new Map<string, Zone>();

    state.zones.forEach((zone, id) => {
      newZones.set(id, {
        ...zone,
        cards: [...zone.cards],
      });
    });

    return {
      ...state,
      zones: newZones,
    };
  }
}
