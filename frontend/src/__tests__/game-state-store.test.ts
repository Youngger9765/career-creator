/**
 * GameStateStore 測試
 *
 * TDD 原則：先寫測試，確認失敗，再實作功能
 * 測試目標：確保各遊戲狀態完全隔離且可持久化
 */

import { renderHook, act } from '@testing-library/react';
import { useGameStateStore } from '../stores/game-state-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GameStateStore', () => {
  beforeEach(() => {
    // 每個測試前清空 localStorage
    localStorageMock.clear();
  });

  describe('基本功能', () => {
    it('應該能為新遊戲返回預設狀態', () => {
      const { result } = renderHook(() => useGameStateStore());

      const state = result.current.getGameState('room1', 'personality');

      expect(state).toBeDefined();
      expect(state.cardPlacements).toBeDefined();
      expect(state.metadata).toBeDefined();
      expect(state.metadata.version).toBe(1);
    });

    it('應該能儲存遊戲狀態', () => {
      const { result } = renderHook(() => useGameStateStore());

      const testState = {
        cardPlacements: {
          likeCards: ['card1', 'card2'],
          neutralCards: ['card3'],
          dislikeCards: ['card4'],
        },
        metadata: {
          version: 1,
          lastModified: Date.now(),
        },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', testState);
      });

      const savedState = result.current.getGameState('room1', 'personality');
      expect(savedState.cardPlacements.likeCards).toEqual(['card1', 'card2']);
    });
  });

  describe('狀態隔離', () => {
    it('不同遊戲的狀態應該完全獨立', () => {
      const { result } = renderHook(() => useGameStateStore());

      const personalityState = {
        cardPlacements: {
          likeCards: ['A', 'B'],
          neutralCards: [],
          dislikeCards: [],
        },
        metadata: { version: 1, lastModified: Date.now() },
      };

      const advantageState = {
        cardPlacements: {
          advantageCards: ['C', 'D'],
          disadvantageCards: ['E'],
        },
        metadata: { version: 1, lastModified: Date.now() },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', personalityState);
        result.current.setGameState('room1', 'advantage', advantageState);
      });

      const state1 = result.current.getGameState('room1', 'personality');
      const state2 = result.current.getGameState('room1', 'advantage');

      // 狀態應該不同
      expect(state1).not.toBe(state2);
      expect(state1.cardPlacements).not.toEqual(state2.cardPlacements);

      // 各自保持正確狀態
      expect(state1.cardPlacements.likeCards).toEqual(['A', 'B']);
      expect(state2.cardPlacements.advantageCards).toEqual(['C', 'D']);
    });

    it('不同房間的相同遊戲應該獨立', () => {
      const { result } = renderHook(() => useGameStateStore());

      const room1State = {
        cardPlacements: { likeCards: ['A'] },
        metadata: { version: 1, lastModified: Date.now() },
      };

      const room2State = {
        cardPlacements: { likeCards: ['B'] },
        metadata: { version: 1, lastModified: Date.now() },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', room1State);
        result.current.setGameState('room2', 'personality', room2State);
      });

      const state1 = result.current.getGameState('room1', 'personality');
      const state2 = result.current.getGameState('room2', 'personality');

      expect(state1.cardPlacements.likeCards).toEqual(['A']);
      expect(state2.cardPlacements.likeCards).toEqual(['B']);
    });
  });

  describe('狀態持久化', () => {
    it('切換遊戲後應該保留之前的狀態', () => {
      const { result } = renderHook(() => useGameStateStore());

      const initialState = {
        cardPlacements: {
          likeCards: ['card1', 'card2', 'card3'],
        },
        metadata: { version: 1, lastModified: Date.now() },
      };

      act(() => {
        // 設定初始狀態
        result.current.setGameState('room1', 'personality', initialState);

        // 切換到另一個遊戲
        result.current.setGameState('room1', 'advantage', {
          cardPlacements: { advantageCards: ['other'] },
          metadata: { version: 1, lastModified: Date.now() },
        });
      });

      // 切回原遊戲
      const restoredState = result.current.getGameState('room1', 'personality');
      expect(restoredState.cardPlacements.likeCards).toEqual(['card1', 'card2', 'card3']);
    });

    it('應該將狀態持久化到 localStorage', () => {
      const { result } = renderHook(() => useGameStateStore());

      const testState = {
        cardPlacements: { likeCards: ['persistent'] },
        metadata: { version: 1, lastModified: Date.now() },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', testState);
      });

      // 檢查 localStorage
      const key = 'game-state-store';
      const stored = localStorage.getItem(key);
      expect(stored).toBeDefined();

      // 模擬頁面重新載入
      const { result: newResult } = renderHook(() => useGameStateStore());
      const restoredState = newResult.current.getGameState('room1', 'personality');

      expect(restoredState.cardPlacements.likeCards).toEqual(['persistent']);
    });
  });

  describe('版本控制', () => {
    it('每次更新應該增加版本號', () => {
      const { result } = renderHook(() => useGameStateStore());

      const state1 = {
        cardPlacements: { likeCards: ['v1'] },
        metadata: { version: 1, lastModified: Date.now() },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', state1);
      });

      const saved1 = result.current.getGameState('room1', 'personality');
      expect(saved1.metadata.version).toBe(1);

      // 更新狀態
      const state2 = {
        ...saved1,
        cardPlacements: { likeCards: ['v2'] },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', state2);
      });

      const saved2 = result.current.getGameState('room1', 'personality');
      expect(saved2.metadata.version).toBe(2);
    });

    it('應該更新 lastModified 時間戳', () => {
      const { result } = renderHook(() => useGameStateStore());

      const oldTime = Date.now() - 10000; // 10秒前
      const state = {
        cardPlacements: { likeCards: [] },
        metadata: { version: 1, lastModified: oldTime },
      };

      act(() => {
        result.current.setGameState('room1', 'personality', state);
      });

      const saved = result.current.getGameState('room1', 'personality');
      expect(saved.metadata.lastModified).toBeGreaterThan(oldTime);
    });
  });

  describe('清除功能', () => {
    it('應該能清除特定遊戲狀態', () => {
      const { result } = renderHook(() => useGameStateStore());

      act(() => {
        result.current.setGameState('room1', 'personality', {
          cardPlacements: { likeCards: ['test'] },
          metadata: { version: 1, lastModified: Date.now() },
        });

        result.current.clearGameState('room1', 'personality');
      });

      const cleared = result.current.getGameState('room1', 'personality');
      expect(cleared.cardPlacements).toEqual({});
      expect(cleared.metadata.version).toBe(1);
    });

    it('清除一個遊戲不應影響其他遊戲', () => {
      const { result } = renderHook(() => useGameStateStore());

      act(() => {
        result.current.setGameState('room1', 'personality', {
          cardPlacements: { likeCards: ['keep'] },
          metadata: { version: 1, lastModified: Date.now() },
        });

        result.current.setGameState('room1', 'advantage', {
          cardPlacements: { advantageCards: ['clear'] },
          metadata: { version: 1, lastModified: Date.now() },
        });

        result.current.clearGameState('room1', 'advantage');
      });

      const kept = result.current.getGameState('room1', 'personality');
      const cleared = result.current.getGameState('room1', 'advantage');

      expect(kept.cardPlacements.likeCards).toEqual(['keep']);
      expect(cleared.cardPlacements).toEqual({});
    });
  });
});
