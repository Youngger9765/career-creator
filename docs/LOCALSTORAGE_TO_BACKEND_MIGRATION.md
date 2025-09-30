# localStorage 到後端同步遷移策略

## 📊 現況分析

### ✅ 已有的優勢

1. **完整的狀態結構** - GameState 介面涵蓋7種遊戲
2. **版本控制準備** - 已有 version 和 lastModified
3. **同步狀態準備** - 已有 syncStatus 欄位
4. **持久化機制** - Zustand persist 已運作

### 🔍 現有狀態結構

```typescript
interface GameState {
  cardPlacements: {
    // 7種遊戲的不同結構已定義
  };
  metadata: {
    version: number;          // ✅ 已有版本控制
    lastModified: number;     // ✅ 已有時間戳
    lastModifiedBy?: string;  // ✅ 已預留用戶ID
    syncStatus?: 'local' | 'pending' | 'synced'; // ✅ 已預留同步狀態
  };
}
```

---

## 🚀 三階段遷移策略

### Phase 1: 添加同步層（不改現有邏輯）

**目標**: 在現有 localStorage 基礎上添加後端同步

```typescript
// 新增同步服務層
class GameStateSyncService {
  private roomId: string;
  private gameType: string;

  // 1. 從後端拉取狀態
  async pullFromServer(): Promise<GameState | null> {
    const response = await fetch(`/api/rooms/${this.roomId}/game-state/${this.gameType}`);
    return response.ok ? response.json() : null;
  }

  // 2. 推送到後端
  async pushToServer(state: GameState): Promise<boolean> {
    const url = `/api/rooms/${this.roomId}/game-state/${this.gameType}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(state)
    });
    return response.ok;
  }

  // 3. 智能合併狀態
  mergeStates(local: GameState, remote: GameState): GameState {
    // 時間戳較新的優先
    return local.metadata.lastModified > remote.metadata.lastModified
      ? local
      : remote;
  }
}
```

### Phase 2: 包裝現有 Store（無縫整合）

**策略**: 不修改 `useGameState`，只在底層添加同步

```typescript
// 擴展現有 store
export const useGameStateStore = create<GameStateStore>()(
  persist(
    (set, get) => ({
      // ... 現有邏輯保持不變

      setGameState: (roomId: string, gameType: string,
                     state: Partial<GameState>) => {
        // 1. 更新本地狀態（現有邏輯）
        const key = makeKey(roomId, gameType);
        set((store) => {
          // ... 現有更新邏輯

          // 2. 【新增】標記為待同步
          updatedState.metadata.syncStatus = 'pending';

          // 3. 【新增】觸發背景同步
          queueSync(roomId, gameType, updatedState);

          return { states: newStates };
        });
      },

      // 【新增】從後端載入狀態
      loadFromServer: async (roomId: string, gameType: string) => {
        const service = new GameStateSyncService(roomId, gameType);
        const serverState = await service.pullFromServer();

        if (serverState) {
          const localState = get().getGameState(roomId, gameType);
          const mergedState = service.mergeStates(localState, serverState);

          // 更新本地狀態
          set((store) => {
            const newStates = new Map(store.states);
            newStates.set(makeKey(roomId, gameType), {
              ...mergedState,
              metadata: { ...mergedState.metadata, syncStatus: 'synced' }
            });
            return { states: newStates };
          });
        }
      }
    }),
    // ... 現有 persist 配置
  )
);
```

### Phase 3: 輪詢同步機制

```typescript
// 背景同步服務
class BackgroundSyncService {
  private syncQueue = new Map<string, GameState>();
  private isPolling = false;

  // 加入同步隊列
  queueSync(roomId: string, gameType: string, state: GameState) {
    const key = `${roomId}:${gameType}`;
    this.syncQueue.set(key, state);

    // 防抖：500ms 內的多次變更只同步最後一次
    clearTimeout(this.debounceTimers.get(key));
    this.debounceTimers.set(key, setTimeout(() => {
      this.syncToServer(roomId, gameType, state);
    }, 500));
  }

  // 推送到伺服器
  async syncToServer(roomId: string, gameType: string, state: GameState) {
    try {
      const service = new GameStateSyncService(roomId, gameType);
      const success = await service.pushToServer(state);

      if (success) {
        // 更新 syncStatus 為 'synced'
        useGameStateStore.getState().setGameState(roomId, gameType, {
          metadata: { syncStatus: 'synced' }
        });
      }
    } catch (error) {
      console.error('同步失敗:', error);
      // 保持 'pending' 狀態，稍後重試
    }
  }

  // 開始輪詢其他用戶的變更
  startPolling(roomId: string, gameType: string) {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      await useGameStateStore.getState().loadFromServer(roomId, gameType);
    }, 3000); // 每3秒檢查一次
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.isPolling = false;
    }
  }
}
```

---

## 💻 實作細節

### 1. 後端 API 設計

```python
# 遊戲狀態 API
@router.post("/rooms/{room_id}/game-state/{game_type}")
async def save_game_state(
    room_id: str,
    game_type: str,
    state: dict,
    current_user: User = Depends(get_current_user)
):
    # 1. 驗證用戶權限
    # 2. 版本衝突檢查
    # 3. 保存到資料庫
    # 4. 返回最新狀態
    pass

@router.get("/rooms/{room_id}/game-state/{game_type}")
async def get_game_state(room_id: str, game_type: str):
    # 返回最新的遊戲狀態
    pass
```

### 2. 資料庫設計

```sql
CREATE TABLE game_states (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50) NOT NULL,
  state JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(room_id, game_type)
);

-- 索引
CREATE INDEX idx_game_states_room_type ON game_states(room_id, game_type);
CREATE INDEX idx_game_states_updated ON game_states(updated_at);
```

### 3. 前端整合使用

```typescript
// 在遊戲組件中使用（無需修改現有代碼）
const MyGameComponent = ({ roomId }: { roomId: string }) => {
  const { state, updateCards } = useGameState(roomId, 'life');

  // 【新增】開始同步
  useEffect(() => {
    const syncService = BackgroundSyncService.getInstance();
    syncService.startPolling(roomId, 'life');

    return () => syncService.stopPolling();
  }, [roomId]);

  // 現有邏輯完全不用改
  const handleCardDrop = (cardId: string, area: string) => {
    updateCards({
      lifeAreas: {
        ...state.cardPlacements.lifeAreas,
        [area]: {
          cards: [...(state.cardPlacements.lifeAreas?.[area]?.cards || []), cardId],
          tokens: state.cardPlacements.lifeAreas?.[area]?.tokens || 0
        }
      }
    });
    // 👆 這個調用會自動觸發同步！
  };

  return (
    <div>
      {/* 現有 UI 代碼完全不用改 */}
      {state.metadata.syncStatus === 'pending' && (
        <div className="sync-indicator">同步中...</div>
      )}
    </div>
  );
};
```

---

## 🎯 遷移優勢

### 1. 零破壞性 ✅

- 現有組件代碼**完全不用改**
- `useGameState` 介面保持一致
- localStorage 仍然正常運作

### 2. 漸進式部署 ✅

```typescript
// 可以按遊戲類型逐步啟用同步
const SYNC_ENABLED_GAMES = ['life', 'personality']; // 先測試這兩個

if (SYNC_ENABLED_GAMES.includes(gameType)) {
  // 啟用同步
} else {
  // 維持純 localStorage
}
```

### 3. 降級策略 ✅

```typescript
// 如果後端故障，自動降級到 localStorage
const handleSyncError = () => {
  console.warn('後端同步失敗，降級到本地模式');
  // 停止輪詢，保持本地功能
};
```

---

## ⏱️ 實作時程

### Day 1: 後端 API（1天）

- [ ] 設計資料庫表
- [ ] 實作 CRUD API
- [ ] 單元測試

### Day 2: 同步服務層（1天）

- [ ] GameStateSyncService
- [ ] BackgroundSyncService
- [ ] 整合測試

### Day 3: 前端整合（1天）

- [ ] 擴展 GameStateStore
- [ ] 添加同步邏輯
- [ ] UI 同步狀態指示器

### Day 4: 測試與優化（1天）

- [ ] 多人協作測試
- [ ] 衝突解決測試
- [ ] 性能優化

---

## 🛡️ 風險控制

### 1. 版本衝突處理

```typescript
// 簡單策略：時間戳較新的優先
// 未來可升級為 Operational Transform
const resolveConflict = (local: GameState,
                        remote: GameState) => {
  const timeDiff = Math.abs(local.metadata.lastModified -
                         remote.metadata.lastModified);
  if (timeDiff < 1000) {
    // 1秒內的變更，需要用戶確認
    return showConflictDialog(local, remote);
  }

  return local.metadata.lastModified > remote.metadata.lastModified ? local : remote;
};
```

### 2. 網路故障處理

```typescript
const syncWithRetry = async (state: GameState, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncToServer(state);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        // 最後一次失敗，保持 pending 狀態
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

### 3. 性能優化

```typescript
// 防抖動：避免頻繁同步
const debouncedSync = debounce(syncToServer, 500);

// 差異同步：只傳送變更的部分
const getDiff = (oldState: GameState, newState: GameState) => {
  // 實作狀態差異計算
};
```

---

## 🎬 結論

### 核心策略：「包裝而非重寫」

1. **保持現有邏輯** - 7個遊戲組件一行代碼都不用改
2. **添加同步層** - 在 Zustand store 層面添加後端同步
3. **漸進式啟用** - 可以按遊戲類型逐步測試

### 時間優勢

- **預估 4 天完成**（vs 重寫需要 2 週）
- **風險極低**（現有功能零影響）
- **可隨時回滾**（只需關閉同步功能）

### 用戶體驗

- **無感升級** - 用戶不會察覺任何變化
- **漸進增強** - 慢慢看到同步效果
- **穩定可靠** - localStorage 仍是第一道防線

**這個方案完美利用了現有架構的優勢，是最穩妥的遷移路徑！**
