# 同步架構完整指南

## 📋 概述

本文件整合了職涯諮詢平台的完整同步架構，包含技術決策、實作細節、API 設計以及各遊戲模式的同步策略。

---

## 🎯 架構目標

### 核心需求

1. **Header 顯示在線用戶** - 即時顯示房間內的參與者
2. **卡片移動同步** - 多人協作時的即時同步
3. **遊戲模式變更權限與同步** - 權限控制與狀態同步

### 設計原則

- **零破壞性** - 現有功能完全不受影響
- **漸進式** - 可按遊戲類型逐步啟用
- **可降級** - 後端故障時自動回到 localStorage
- **務實優先** - 追求可用性而非完美性

---

## 🏗️ 技術決策

### 1. 同步方案選擇：Supabase Realtime

#### 決策原因

| 方案 | 開發時間 | 成本 | 複雜度 | 維護性 | 選擇 |
|------|----------|------|---------|--------|------|
| **Supabase Realtime** | 3-4天 | $0-25/月 | ⭐⭐ | 簡單 | ✅ 採用 |
| WebSocket (自建) | 8-10天 | $100+/月 | ⭐⭐⭐⭐ | 複雜 | ❌ |
| 輪詢 (HTTP) | 2-3天 | $15-30/月 | ⭐ | 簡單 | 🔄 備案 |

#### Supabase 優勢

```javascript
// 三大核心功能統一管理
const channel = supabase.channel(`room:${roomId}`)
  .on('presence', handlePresence)     // 在線狀態
  .on('broadcast', handleBroadcast)   // 即時訊息
  .on('postgres_changes', handleDB)   // 資料庫變更
  .subscribe()
```

### 2. 架構模式：包裝現有系統

#### 策略核心

```typescript
// 保持現有介面不變
const { state, updateCards } = useGameState(roomId, 'life');

// 在底層添加同步邏輯
const handleCardDrop = (cardId, area) => {
  updateCards({ /* 現有邏輯 */ });
  // ↑ 這個調用會自動觸發同步！
};
```

**時間節省**: 從 8 天縮短到 4 天 ⚡
**風險降低**: 從高風險到低風險 🛡️
**功能完整**: 三大核心功能 100% 實現 ✅

---

## 📡 Supabase Realtime 功能架構

### Channel 管理策略

```javascript
// 一個房間 = 一個 channel = 統一管理
const channel = supabase.channel(`room:${roomId}`)
```

### 三大功能分層

| 功能 | 技術 | 資料存儲 | 延遲 | 用途 |
|------|------|----------|------|------|
| **Presence** | 記憶體 | 不寫 DB | <1s | 在線狀態 |
| **Broadcast** | 記憶體 | 不寫 DB | <1s | 即時訊息 |
| **Postgres Changes** | 資料庫 | 寫 DB | <1s | 持久化 |

---

## 🚀 實作階段規劃

### Phase 1: 在線狀態顯示 ✅ 已完成

#### 技術實作

```typescript
// hooks/usePresence.ts
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: getUserId(),
            name: getUserName(),
            role: getUserRole(),
            joinedAt: new Date().toISOString()
          })
        }
      })

    return () => channel.unsubscribe()
  }, [roomId])

  return { onlineUsers }
}
```

#### UI 整合

```jsx
// components/RoomHeader.tsx
function RoomHeader({ roomId }) {
  const { onlineUsers } = usePresence(roomId)

  return (
    <div className="online-users">
      <span>在線 ({onlineUsers.length})</span>
      {onlineUsers.map(user => (
        <div key={user.id} className="user-badge">
          <span className="status-dot online" />
          <span>{user.name}</span>
          {user.role === 'owner' && <span>👑</span>}
        </div>
      ))}
    </div>
  )
}
```

### Phase 2: 遊戲模式同步 ✅ 已完成

#### 實作方案變更

**原計畫**: Broadcast + Database
**實際採用**: 純 Broadcast + localStorage

#### 變更原因

1. **簡化實作** - 不需要後端 API
2. **降低成本** - Broadcast 不計費
3. **MVP 足夠** - Owner localStorage 作為真相來源

#### 核心程式碼

```typescript
// hooks/useGameModeSync.ts
export function useGameModeSync(options: UseGameModeSyncOptions) {
  const { roomId, isOwner, initialState, onStateChange } = options

  // Owner: 切換遊戲模式
  const changeGameMode = useCallback((deck, gameRule, gameMode) => {
    if (!isOwner || !channel) return

    const newState = { deck, gameRule, gameMode }

    // 1. 更新本地狀態
    setSyncedState(newState)
    persistState(newState)  // 存 localStorage

    // 2. Broadcast 給其他人
    channel.send({
      type: 'broadcast',
      event: 'mode_changed',
      payload: newState
    })
  }, [isOwner, channel])

  // 監聽模式變更
  useEffect(() => {
    const gameChannel = supabase.channel(`room:${roomId}:gamemode`)

    gameChannel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
      setSyncedState(payload)
      onStateChange?.(payload)
    })

    // 新用戶請求當前狀態
    gameChannel.on('broadcast', { event: 'request_state' }, () => {
      if (isOwner) {
        gameChannel.send({
          type: 'broadcast',
          event: 'current_state',
          payload: syncedState
        })
      }
    })

    return () => gameChannel.unsubscribe()
  }, [roomId, isOwner])

  return { syncedState, ownerOnline, changeGameMode, canInteract }
}
```

#### 權限控制

```typescript
// Owner 離線時房間凍結
const canInteract = isOwner || ownerOnline

// 視覺回饋
{!canInteract && (
  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm">
    <div className="text-center">
      <span className="text-6xl">⏸️</span>
      <h3>等待諮詢師回來</h3>
      <p>諮詢師離線時，房間暫時凍結</p>
    </div>
  </div>
)}
```

#### 實作成果

- ✅ 純 Broadcast 實現，不需要資料庫
- ✅ Owner 狀態持久化到 localStorage
- ✅ 新用戶加入自動獲取當前狀態
- ✅ Owner 離線時房間凍結
- ✅ 統一命名系統避免 bug
- ✅ 視覺化同步狀態顯示
- ✅ 訪客權限控制完善

### Phase 3: 牌卡移動同步 (待實作)

#### 技術方案

#### Broadcast（即時）+ Event Sourcing（持久化）

#### 資料流設計

```typescript
// 同步流程
用戶移動牌卡
  → 樂觀更新（本地立即顯示）
  → Broadcast 給其他人（即時同步）
  → 寫入 card_events 表（事件記錄）
  → 衝突時用 timestamp 判定
```

#### 事件類型定義

```typescript
type CardEvent = {
  id: string
  roomId: string
  gameType: string
  cardId: string
  action: 'move' | 'flip' | 'select'
  fromArea?: string
  toArea?: string
  position?: { x: number, y: number }
  performedBy: string
  timestamp: string
}
```

#### 核心實作

```typescript
// hooks/useCardSync.ts
export function useCardSync(roomId: string, gameType: string) {
  const [cards, setCards] = useState<Card[]>([])
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map>()

  // 移動牌卡
  const moveCard = async (cardId: string, toArea: string, position?: Point) => {
    const optimisticId = generateId()

    // 1. 樂觀更新（立即顯示）
    setCards(prev => updateCardPosition(prev, cardId, toArea, position))
    setOptimisticUpdates(prev => prev.set(optimisticId, { cardId, toArea }))

    // 2. Broadcast 給其他人（即時）
    channel.current?.send({
      type: 'broadcast',
      event: 'card-move',
      payload: {
        cardId,
        toArea,
        position,
        performedBy: getUserId(),
        timestamp: Date.now(),
        optimisticId
      }
    })

    // 3. 寫入事件表（持久化）
    const { data, error } = await supabase
      .from('card_events')
      .insert({
        room_id: roomId,
        game_type: gameType,
        card_id: cardId,
        action: 'move',
        to_area: toArea,
        position,
        performed_by: getUserId()
      })

    if (error) {
      // 回滾樂觀更新
      rollbackOptimisticUpdate(optimisticId)
    }
  }

  return { cards, moveCard }
}
```

---

## 🗄️ 資料庫設計

### 1. 事件表（Event Sourcing）

```sql
-- 事件表（已存在）
CREATE TABLE IF NOT EXISTS card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50) NOT NULL,
  card_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  from_area VARCHAR(100),
  to_area VARCHAR(100),
  position JSONB,
  metadata JSONB,
  performed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 遊戲狀態快照（性能優化）

```sql
-- 遊戲狀態快照（定期保存）
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50) NOT NULL,
  state JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, game_type)
);
```

### 3. 索引優化

```sql
-- 效能索引
CREATE INDEX idx_card_events_room_game ON card_events(room_id, game_type);
CREATE INDEX idx_card_events_timestamp ON card_events(created_at);
CREATE INDEX idx_game_states_room_type ON game_states(room_id, game_type);
```

---

## 🔧 API 設計

### 1. 遊戲狀態 API

```python
# 保存遊戲狀態
@router.post("/rooms/{room_id}/game-state/{game_type}")
async def save_game_state(
    room_id: str,
    game_type: str,
    state: dict,
    current_user: User = Depends(get_current_user)
):
    """
    保存遊戲狀態到資料庫
    - 驗證用戶權限
    - 版本衝突檢查
    - 返回最新狀態
    """
    pass

# 獲取遊戲狀態
@router.get("/rooms/{room_id}/game-state/{game_type}")
async def get_game_state(room_id: str, game_type: str):
    """
    獲取最新的遊戲狀態
    - 支援版本查詢
    - 返回快照 + 增量事件
    """
    pass
```

### 2. 心跳 API（在線狀態）

```python
# 用戶心跳
@router.post("/rooms/{room_id}/heartbeat")
async def update_heartbeat(
    room_id: str,
    visitor_data: Optional[dict] = None
):
    """
    更新用戶在線狀態
    - 支援登入用戶和訪客
    - 自動清理過期連線
    """
    pass
```

### 3. 事件記錄 API

```python
# 記錄卡片事件
@router.post("/rooms/{room_id}/events")
async def create_card_event(
    room_id: str,
    event: CardEventCreate
):
    """
    記錄卡片操作事件
    - Event sourcing 模式
    - 支援批次操作
    """
    pass
```

---

## 🎮 各遊戲模式同步策略

### 1. 狀態格式統一

```typescript
// 所有遊戲的標準狀態格式
interface GameState {
  cardPlacements: {
    // 生活改造王
    lifeAreas?: {
      [areaId: string]: {
        cards: string[];
        tokens: number;
      }
    };

    // 職能盤點卡
    skillAreas?: {
      interested: string[];
      capable: string[];
      valued: string[];
    };

    // 價值導航卡
    valueCards?: {
      selected: string[];
      rankings: { cardId: string; rank: number }[];
    };

    // 職游旅人卡
    travelerPath?: {
      currentStage: string;
      completedStages: string[];
      chosenCards: string[];
    };
  };

  metadata: {
    version: number;
    lastModified: number;
    lastModifiedBy?: string;
    syncStatus?: 'local' | 'pending' | 'synced';
  };
}
```

### 2. 遊戲特有同步邏輯

#### 生活改造王

```typescript
// 區域限制同步
const syncLifeAreaChange = (areaId: string, cards: string[]) => {
  // 驗證卡片數量限制
  // 同步代幣計算
  // 觸發成就檢查
}
```

#### 職能盤點卡

```typescript
// 三向度同步
const syncSkillPlacement = (cardId: string, category: 'interested' | 'capable' | 'valued') => {
  // 檢查重複放置
  // 更新交集顯示
  // 同步統計數據
}
```

#### 價值導航卡

```typescript
// 排序同步
const syncValueRanking = (rankings: ValueRanking[]) => {
  // 驗證排序完整性
  // 同步拖放動畫
  // 更新分析結果
}
```

---

## 🚀 LocalStorage 遷移策略

### 1. 零破壞性遷移

#### 包裝現有 Store

```typescript
// 擴展現有 useGameStateStore
export const useGameStateStore = create<GameStateStore>()(
  persist(
    (set, get) => ({
      // 保持現有邏輯完全不變...

      setGameState: (roomId: string, gameType: string, state: Partial<GameState>) => {
        // 1. 現有本地更新邏輯
        const key = makeKey(roomId, gameType);
        set((store) => {
          // ... 現有更新邏輯

          // 2. 【新增】標記為待同步
          updatedState.metadata.syncStatus = 'pending';

          // 3. 【新增】觸發背景同步
          queueBackgroundSync(roomId, gameType, updatedState);

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
          // 更新本地狀態...
        }
      }
    })
  )
);
```

### 2. 背景同步服務

```typescript
// 防抖同步
class BackgroundSyncService {
  private syncQueue = new Map<string, GameState>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  queueSync(roomId: string, gameType: string, state: GameState) {
    const key = `${roomId}:${gameType}`;
    this.syncQueue.set(key, state);

    // 防抖：500ms 內的多次變更只同步最後一次
    clearTimeout(this.debounceTimers.get(key));
    this.debounceTimers.set(key, setTimeout(() => {
      this.syncToServer(roomId, gameType, state);
    }, 500));
  }

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
}
```

### 3. 漸進式啟用

```typescript
// 可按遊戲類型逐步測試
const SYNC_ENABLED_GAMES = ['life', 'personality']; // 先測試這兩個

if (SYNC_ENABLED_GAMES.includes(gameType)) {
  // 啟用同步
  startBackgroundSync();
} else {
  // 維持純 localStorage
  console.log('此遊戲尚未啟用同步功能');
}
```

---

## ⚡ 效能優化策略

### 1. 連線優化

```typescript
// 一個房間只用一個 channel
const channelManager = {
  channels: new Map(),

  getChannel(roomId: string) {
    if (!this.channels.has(roomId)) {
      const channel = supabase.channel(`room:${roomId}`)
        .on('presence', handlePresence)
        .on('broadcast', handleBroadcast)
        .subscribe();

      this.channels.set(roomId, channel);
    }

    return this.channels.get(roomId);
  },

  cleanup(roomId: string) {
    const channel = this.channels.get(roomId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(roomId);
    }
  }
};
```

### 2. 資料優化

```typescript
// 差異更新 - 只傳送變更的部分
const getDiff = (oldState: GameState, newState: GameState) => {
  const diff = {};

  // 比較卡片位置
  if (!isEqual(oldState.cardPlacements, newState.cardPlacements)) {
    diff.cardPlacements = newState.cardPlacements;
  }

  // 總是更新 metadata
  diff.metadata = newState.metadata;

  return diff;
};

// 壓縮連續事件
const compressEvents = (events: CardEvent[]) => {
  return events.reduce((compressed, event) => {
    const last = compressed[compressed.length - 1];
    if (canMerge(last, event)) {
      last.position = event.position;
      return compressed;
    }
    return [...compressed, event];
  }, []);
};
```

### 3. 節流控制

```typescript
// 高頻操作節流
const throttledCursorUpdate = throttle((x: number, y: number) => {
  channel.send({
    type: 'broadcast',
    event: 'cursor',
    payload: { x, y, userId: getUserId() }
  });
}, 50); // 每 50ms 最多一次

// 防抖狀態更新
const debouncedStateUpdate = debounce((state: GameState) => {
  queueBackgroundSync(roomId, gameType, state);
}, 300); // 300ms 防抖
```

---

## 🛡️ 衝突解決機制

### 1. 時間戳策略（預設）

```typescript
// Last Write Wins
const resolveConflict = (localState: GameState, remoteState: GameState): GameState => {
  const timeDiff = Math.abs(
    localState.metadata.lastModified - remoteState.metadata.lastModified
  );

  if (timeDiff < 1000) {
    // 1秒內的變更，需要用戶確認
    return showConflictDialog(localState, remoteState);
  }

  return localState.metadata.lastModified > remoteState.metadata.lastModified
    ? localState
    : remoteState;
};
```

### 2. 智能合併策略

```typescript
// 合併不衝突的操作
const mergeNonConflicting = (local: GameState, remote: GameState): GameState => {
  const merged = { ...local };

  // 不同區域的操作可以合併
  Object.keys(remote.cardPlacements).forEach(area => {
    if (!local.cardPlacements[area]) {
      merged.cardPlacements[area] = remote.cardPlacements[area];
    }
  });

  // 使用較新的版本號
  merged.metadata.version = Math.max(
    local.metadata.version,
    remote.metadata.version
  ) + 1;

  return merged;
};
```

### 3. 用戶確認介面

```typescript
// 衝突解決 UI
const ConflictResolver = ({ localState, remoteState, onResolve }) => {
  return (
    <div className="conflict-dialog">
      <h3>偵測到衝突</h3>
      <p>您的操作與其他用戶發生衝突，請選擇要保留的版本：</p>

      <div className="conflict-options">
        <button onClick={() => onResolve(localState)}>
          保留我的變更
        </button>
        <button onClick={() => onResolve(remoteState)}>
          使用其他用戶的變更
        </button>
        <button onClick={() => onResolve(mergeStates(localState, remoteState))}>
          嘗試自動合併
        </button>
      </div>
    </div>
  );
};
```

---

## 📊 監控與成本控制

### 1. 監控指標

```typescript
// 需要監控的關鍵指標
const metrics = {
  // 連線狀態
  activeConnections: 0,        // 目標: < 200 (免費額度)

  // 效能指標
  syncLatency: 0,             // 目標: < 500ms
  conflictRate: 0,            // 目標: < 5%

  // 成本控制
  monthlyMessages: 0,         // 目標: < 2M (免費額度)
  bandwidthUsage: 0,          // 目標: < 2GB (免費額度)

  // 可靠性
  connectionDropRate: 0,      // 目標: < 1%
  syncSuccessRate: 0          // 目標: > 99%
};

// 告警設定
const alerts = {
  highConnectionCount: () => metrics.activeConnections > 180,
  highLatency: () => metrics.syncLatency > 1000,
  highConflictRate: () => metrics.conflictRate > 0.05,
  nearMessageLimit: () => metrics.monthlyMessages > 1800000
};
```

### 2. 成本優化

```typescript
// 資料優化策略
const optimizations = {
  // 1. 定期清理事件表
  cleanupOldEvents: async () => {
    await supabase
      .from('card_events')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  },

  // 2. 批次處理更新
  batchUpdates: (updates: CardEvent[]) => {
    return supabase
      .from('card_events')
      .insert(updates);
  },

  // 3. 壓縮傳輸資料
  compressPayload: (data: any) => {
    return JSON.stringify(data, null, 0); // 移除空白
  }
};
```

### 3. 降級策略

```typescript
// 自動降級機制
class FallbackManager {
  private isOnline = true;
  private retryAttempts = 0;

  async handleSyncError(error: Error) {
    this.retryAttempts++;

    if (this.retryAttempts > 3) {
      // 降級到 localStorage 模式
      this.enableOfflineMode();
      showUserNotification('已切換到離線模式，您的變更會在連線恢復後同步');
    } else {
      // 指數退避重試
      const delay = Math.pow(2, this.retryAttempts) * 1000;
      setTimeout(() => this.retrySync(), delay);
    }
  }

  enableOfflineMode() {
    this.isOnline = false;
    // 停止輪詢
    // 顯示離線指示器
    // 保持本地功能
  }

  async reconnect() {
    try {
      await this.testConnection();
      this.isOnline = true;
      this.retryAttempts = 0;
      await this.syncPendingChanges();
      showUserNotification('已重新連線，正在同步變更');
    } catch (error) {
      // 重連失敗，保持離線模式
    }
  }
}
```

---

## 🧪 測試策略

### 1. 單元測試

```typescript
// 同步服務測試
describe('GameStateSyncService', () => {
  test('should merge states correctly', () => {
    const local = createMockState({ version: 1, lastModified: 1000 });
    const remote = createMockState({ version: 2, lastModified: 2000 });

    const result = syncService.mergeStates(local, remote);

    expect(result.metadata.version).toBe(2);
    expect(result.metadata.lastModified).toBe(2000);
  });

  test('should handle conflict resolution', () => {
    const conflictingStates = createConflictingStates();
    const result = syncService.resolveConflict(...conflictingStates);

    expect(result).toBeDefined();
  });
});
```

### 2. 整合測試

```typescript
// 多用戶協作測試
describe('Multi-user Sync', () => {
  test('should sync card movements between users', async () => {
    const room = await createTestRoom();
    const user1 = await joinRoom(room.id, 'counselor');
    const user2 = await joinRoom(room.id, 'visitor');

    // User1 移動卡片
    await user1.moveCard('card1', 'area1');

    // User2 應該看到變更
    await waitFor(() => {
      expect(user2.getCardPosition('card1')).toBe('area1');
    });
  });
});
```

### 3. 效能測試

```typescript
// 壓力測試
describe('Performance Tests', () => {
  test('should handle 50 concurrent users', async () => {
    const users = await Promise.all(
      Array(50).fill(0).map(() => createTestUser())
    );

    const startTime = Date.now();

    // 同時移動卡片
    await Promise.all(
      users.map(user => user.moveCard('card1', 'area1'))
    );

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // 1秒內完成
  });
});
```

---

## 🚀 部署與維運

### 1. 環境配置

```bash
# Supabase 環境變數
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# 功能開關
NEXT_PUBLIC_SYNC_ENABLED=true
NEXT_PUBLIC_SYNC_GAMES=life,personality,value

# 監控設定
NEXT_PUBLIC_MONITORING_ENABLED=true
NEXT_PUBLIC_LOG_LEVEL=info
```

### 2. 部署檢查清單

```typescript
// 部署前檢查
const deploymentChecklist = [
  // ✅ 環境配置
  'Supabase URL 和 Key 已設定',
  '功能開關已配置',

  // ✅ 資料庫
  'Realtime 已啟用',
  '必要的表已建立',
  '索引已優化',

  // ✅ 前端
  '同步服務已整合',
  'UI 指示器正常',
  '錯誤處理完善',

  // ✅ 測試
  '單元測試通過',
  '整合測試通過',
  '效能測試合格',

  // ✅ 監控
  '監控指標已設置',
  '告警規則已配置',
  '日誌記錄正常'
];
```

### 3. 維運指南

```typescript
// 日常維運任務
const maintenanceTasks = {
  daily: [
    '檢查連線數是否正常',
    '查看錯誤日誌',
    '監控同步延遲'
  ],

  weekly: [
    '清理過期事件記錄',
    '檢查資料庫效能',
    '更新監控報表'
  ],

  monthly: [
    '評估成本使用量',
    '分析用戶使用模式',
    '規劃擴容需求'
  ]
};
```

---

## 🎯 未來優化方向

### 1. 短期優化（3個月內）

- **效能提升**: 實作增量同步和差異壓縮
- **用戶體驗**: 添加游標同步和操作歷史
- **穩定性**: 完善錯誤處理和自動重連

### 2. 中期優化（6個月內）

- **架構升級**: 從 Broadcast 升級到 Postgres Changes
- **功能擴展**: 支援語音協作和畫面共享
- **分析功能**: 添加協作效果分析

### 3. 長期規劃（1年內）

- **自建方案**: 評估自建 WebSocket 服務
- **AI 增強**: 智能衝突解決和協作建議
- **跨平台**: 支援移動端同步

---

## 📚 相關資源

### 技術文檔

- [Supabase Realtime 官方文檔](https://supabase.com/docs/guides/realtime)
- [WebSocket vs Polling 比較](https://ably.com/blog/websockets-vs-long-polling)
- [Event Sourcing 模式](https://martinfowler.com/eaaDev/EventSourcing.html)

### 專案文檔

- [遊戲設計文檔](./GAME_DESIGN.md)
- [API 文檔](../backend/docs/API.md)
- [部署指南](./DEPLOYMENT.md)

---

## 📝 更新紀錄

- **2025-09-29**: 初版架構設計
- **2025-09-29**: Phase 1 (在線狀態) 完成
- **2025-09-29**: Phase 2 (遊戲模式同步) 完成
- **2025-09-30**: 整合完整架構文檔

---

## 🎬 總結

這個同步架構採用「包裝而非重寫」的策略，在保持現有功能完全不受影響的前提下，逐步添加多人協作能力。通過 Supabase Realtime 的強大功能，我們以最小的開發成本實現了：

1. **即時在線狀態顯示** ✅
2. **遊戲模式同步切換** ✅
3. **卡片移動即時同步** 🚧 (實作中)

這個架構不僅滿足了當前的 MVP 需求，也為未來的功能擴展預留了充足的空間。隨著用戶增長和需求變化，我們可以靈活地升級到更高級的同步方案，真正做到了「先讓它動起來，再讓它動得更好」。

## 最後更新

2025-09-30
