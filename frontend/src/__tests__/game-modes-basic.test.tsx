/**
 * TDD測試：遊戲模式基礎測試
 * 目的：確保新架構不破壞現有功能
 */
import { GameEngine } from '@/game/engine';
import { RuleFactory } from '@/game/rules/rule-factory';
import { GameModeService } from '@/game-modes/services/mode.service';
import { LegacyGameAdapter } from '@/game-modes/adapters/legacy-adapter';

describe('GameMode Basic Integration - TDD Phase 1', () => {
  /**
   * 測試1：模式列表正確性
   * 驗證：系統應該提供三個遊戲模式
   */
  describe('Test 1: Mode List Correctness', () => {
    it('should return exactly three game modes', () => {
      const modes = GameModeService.getAllModes();

      expect(modes).toHaveLength(3);
      expect(modes[0].id).toBe('career_traveler');
      expect(modes[1].id).toBe('skill_inventory');
      expect(modes[2].id).toBe('value_navigation');
    });

    it('should have correct Chinese names for each mode', () => {
      const modes = GameModeService.getAllModes();

      expect(modes[0].name).toBe('職游旅人卡');
      expect(modes[1].name).toBe('職能盤點卡');
      expect(modes[2].name).toBe('價值導航卡');
    });

    it('should include gameplays for each mode', () => {
      const careerMode = GameModeService.getMode('career_traveler');

      expect(careerMode?.gameplays).toBeDefined();
      expect(careerMode?.gameplays).toHaveLength(2);
      expect(careerMode?.gameplays?.[0].id).toBe('personality_analysis');
      expect(careerMode?.gameplays?.[1].id).toBe('career_collector');
    });
  });

  /**
   * 測試2：新舊ID映射
   * 驗證：新的模式ID能正確映射到舊的規則ID
   */
  describe('Test 2: New-Old ID Mapping', () => {
    it('should map career_traveler to personality_assessment', () => {
      const legacyRuleId = GameModeService.getLegacyRuleId('career_traveler');
      expect(legacyRuleId).toBe('personality_assessment');
    });

    it('should map skill_inventory to skill_assessment', () => {
      const legacyRuleId = GameModeService.getLegacyRuleId('skill_inventory');
      expect(legacyRuleId).toBe('skill_assessment');
    });

    it('should map value_navigation to value_ranking', () => {
      const legacyRuleId = GameModeService.getLegacyRuleId('value_navigation');
      expect(legacyRuleId).toBe('value_ranking');
    });

    it('should return default fallback for unknown mode', () => {
      const legacyRuleId = GameModeService.getLegacyRuleId('unknown_mode');
      expect(legacyRuleId).toBe('skill_assessment'); // default fallback
    });

    it('should support gameplay to legacy rule mapping', () => {
      const legacyRuleId = GameModeService.getGameplayLegacyRule(
        'career_traveler',
        'personality_analysis'
      );
      expect(legacyRuleId).toBe('personality_assessment');
    });
  });

  /**
   * 測試3：現有功能不受影響
   * 驗證：舊的GameEngine和RuleFactory仍能正常運作
   */
  describe('Test 3: Existing Functionality Preserved', () => {
    it('should not break existing RuleFactory.getRule()', () => {
      // 測試舊的規則工廠仍能正常取得規則
      const skillRule = RuleFactory.getRule('skill_assessment');
      const valueRule = RuleFactory.getRule('value_ranking');
      const personalityRule = RuleFactory.getRule('personality_assessment');

      expect(skillRule).toBeDefined();
      expect(valueRule).toBeDefined();
      expect(personalityRule).toBeDefined();

      expect(skillRule.name).toBe('skill_assessment');
      expect(valueRule.name).toBe('value_ranking');
      expect(personalityRule.name).toBe('personality_assessment');
    });

    it('should allow GameEngine to work with legacy rule_id', () => {
      // 測試舊的遊戲引擎仍能使用規則ID
      const state = GameEngine.createInitialState('skill_assessment');

      expect(state).toBeDefined();
      expect(state.rule_id).toBe('skill_assessment');
      expect(state.zones).toBeDefined();
    });

    it('should validate actions using existing engine', () => {
      // 測試現有的動作驗證邏輯不受影響
      const state = GameEngine.createInitialState('skill_assessment');
      const action = {
        type: 'PLACE' as const,
        card_id: 'test_card',
        target_zone: 'advantage',
        player_id: 'test_player'
      };

      const isValid = GameEngine.validateAction(action, state);
      expect(typeof isValid).toBe('boolean');
    });
  });

  /**
   * 測試4：橋接層整合測試
   * 驗證：新的橋接層能正確連接新舊系統
   */
  describe('Test 4: Bridge Layer Integration', () => {
    it('should start game using new mode through adapter', () => {
      // 使用新的模式ID啟動遊戲
      const gameState = LegacyGameAdapter.startGameWithMode(
        'career_traveler',
        'personality_analysis'
      );

      expect(gameState).toBeDefined();
      expect(gameState.rule_id).toBe('personality_assessment');
    });

    it('should handle mode selection and convert to legacy flow', () => {
      // 測試完整的模式選擇流程
      const mode = GameModeService.getMode('skill_inventory');
      const gameplay = mode?.gameplays?.[0]; // 優劣勢分析

      const gameState = LegacyGameAdapter.startGameWithMode(
        mode!.id,
        gameplay!.id
      );

      expect(gameState.rule_id).toBe('skill_assessment');
      expect(gameState.zones.has('advantage')).toBe(true);
      expect(gameState.zones.has('disadvantage')).toBe(true);
    });

    it('should preserve all game configurations through adapter', () => {
      // 確保所有配置都能正確傳遞
      const configs = [
        { mode: 'career_traveler', legacy: 'personality_assessment' },
        { mode: 'skill_inventory', legacy: 'skill_assessment' },
        { mode: 'value_navigation', legacy: 'value_ranking' }
      ];

      configs.forEach(config => {
        const state = LegacyGameAdapter.startGameWithMode(config.mode, '');
        expect(state.rule_id).toBe(config.legacy);
      });
    });
  });
});

/**
 * 測試5：向後兼容性測試
 * 確保新系統可以無縫替換舊系統
 */
describe('Backward Compatibility Tests', () => {
  it('should support both old and new initialization methods', () => {
    // 舊方法
    const oldState = GameEngine.createInitialState('skill_assessment');

    // 新方法（通過橋接層）
    const newState = LegacyGameAdapter.startGameWithMode('skill_inventory', 'advantage_analysis');

    // 兩種方法應該產生相同的結果
    expect(oldState.rule_id).toBe(newState.rule_id);
    expect(oldState.zones.size).toBe(newState.zones.size);
  });

  it('should maintain zone configurations', () => {
    const state = LegacyGameAdapter.startGameWithMode('value_navigation', 'value_ranking');

    // 檢查九宮格配置
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(state.zones.has(`grid-${row}-${col}`)).toBe(true);
      }
    }
  });
});

/**
 * 關於刪除舊系統的策略說明：
 *
 * 問：橋接過去之後，舊的就可以刪除嗎？
 *
 * 答：不要立即刪除！建議採用以下策略：
 *
 * Phase 1 (Week 1-2): 並行運行
 * - 新舊系統並存
 * - 使用 Feature Flag 控制
 * - 收集數據，確保新系統穩定
 *
 * Phase 2 (Week 3-4): 逐步遷移
 * - 10% → 50% → 100% 用戶
 * - 監控錯誤率和性能
 * - 保留舊系統作為 fallback
 *
 * Phase 3 (Month 2): 標記為過時
 * - 添加 @deprecated 註解
 * - 停止新功能開發
 * - 但保持可用狀態
 *
 * Phase 4 (Month 3): 安全移除
 * - 確認所有用戶都在新系統
 * - 無錯誤報告
 * - 移除舊代碼
 *
 * 關鍵指標：
 * - 錯誤率 < 0.1%
 * - 性能不下降
 * - 用戶無感知
 */
