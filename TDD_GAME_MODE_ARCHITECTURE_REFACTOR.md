# 遊戲狀態管理重構計畫

## 🎯 現況與問題

### 已完成項目 ✅

- 3個遊戲模式、7個遊戲玩法組件
- 194張牌卡資料（RIASEC、職業、技能、價值）
- DropZone 組件（減少 63% 重複代碼）
- 獨立遊戲組件於 `components/games/`

### 核心問題 ⚠️

1. **狀態汙染**：不同遊戲共用 `usedCards`，導致牌卡互相影響
2. **狀態遺失**：切換遊戲後無法恢復先前狀態
3. **無持久化**：重新載入頁面狀態消失

## 🏗️ 系統架構

### 現有架構（問題）

```text
GameModeIntegration
  ├── usedCards (共用 ❌)
  └── 7個遊戲組件 → 全部讀取同一個 usedCards
```

### 目標架構（解決）

```text
GameStateStore (Zustand)
  ├── Key: "roomId:personality" → GameState
  ├── Key: "roomId:advantage" → GameState
  └── Key: "roomId:career" → GameState

每個遊戲獨立讀寫自己的狀態
```

## 📋 實作計畫

### Phase 1: 純前端方案（立即）

#### 1. GameStateStore 結構

```typescript
interface GameState {
  cardPlacements: {
    // PersonalityAnalysis
    likeCards?: string[];
    neutralCards?: string[];
    dislikeCards?: string[];

    // AdvantageAnalysis
    advantageCards?: string[];
    disadvantageCards?: string[];

    // 其他遊戲...
  };
  metadata: {
    version: number;
    lastModified: number;
  };
}

interface GameStateStore {
  states: Map<string, GameState>;
  getGameState: (roomId: string, gameType: string) => GameState;
  setGameState: (roomId: string, gameType: string, state: GameState) => void;
  clearGameState: (roomId: string, gameType: string) => void;
}
```

#### 2. 實作重點

- Zustand + localStorage 持久化
- 自動版本控制
- 跨分頁同步（storage events）

#### 3. 遊戲組件更新

每個遊戲從共用 `usedCards` 改為獨立狀態：

```typescript
// Before
const [usedCards, setUsedCards] = useState(parentUsedCards);

// After
const gameState = useGameStateStore(roomId, 'personality');
const { likeCards, neutralCards, dislikeCards } = gameState.cardPlacements;
```

### Phase 2: 後端整合（未來）

#### API 同步（1-2週後）

```typescript
// 背景同步，不阻塞 UI
async syncWithBackend(roomId: string) {
  const local = getLocalState(roomId);
  const remote = await api.getState(roomId);

  if (remote.version > local.version) {
    setLocalState(roomId, remote);
  }
}
```

#### WebSocket 即時同步（3-4週後）

```typescript
ws.on('state-update', (data) => {
  if (data.version > localVersion) {
    updateLocalState(data);
  }
});
```

## ✅ 測試計畫

### TDD 測試案例

```typescript
describe('GameStateStore', () => {
  it('各遊戲狀態應該獨立', () => {
    store.setGameState('room1', 'personality', { cards: ['A'] });
    store.setGameState('room1', 'advantage', { cards: ['B'] });

    expect(store.getGameState('room1', 'personality')).not.toBe(
      store.getGameState('room1', 'advantage')
    );
  });

  it('切換遊戲應保留狀態', () => {
    store.setGameState('room1', 'personality', state1);
    // 切換到其他遊戲
    store.setGameState('room1', 'advantage', state2);
    // 切回來
    const restored = store.getGameState('room1', 'personality');
    expect(restored).toEqual(state1);
  });

  it('重新載入應恢復狀態', () => {
    store.setGameState('room1', 'personality', state);
    // 模擬重新載入
    const newStore = createStore();
    expect(newStore.getGameState('room1', 'personality')).toEqual(state);
  });
});
```

## 📊 成功指標

- ✅ 遊戲狀態完全隔離
- ✅ 切換遊戲狀態保留
- ✅ 頁面重載狀態恢復
- ✅ 未來可無縫升級後端同步

---

*Version: 3.0 (精簡版)*
*Date: 2025-09-27*
*Focus: 解決牌卡狀態隔離問題*
