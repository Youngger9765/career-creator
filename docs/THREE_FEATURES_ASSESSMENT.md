# 三大同步功能評估

## 📋 功能清單

1. **Header 顯示在線用戶**
2. **卡片移動同步**
3. **遊戲模式變更權限與同步**

---

## 🔍 複雜度分析

### 1. Header 顯示在線用戶 🟢 簡單

**實作工作量**: 0.5天

**前端需求**:

```typescript
// 在線用戶組件
interface OnlineUser {
  id: string;
  name: string;
  role: 'counselor' | 'visitor';
  isActive: boolean;
  lastSeen: Date;
}

// Header 組件
<OnlineIndicator users={onlineUsers} />
```

**後端需求**:

```python
# 現有 visitors API 已支援
GET /api/rooms/{id}/visitors
# 只需新增心跳機制
POST /api/rooms/{id}/heartbeat
```

**技術要點**:

- 利用現有 visitor 系統
- 每30秒發送心跳
- 超過60秒標記為離線
- UI 顯示頭像/名稱

**風險**: 🟢 低 - 純顯示功能，不影響核心邏輯

---

### 2. 卡片移動同步 🟡 中等

**實作工作量**: 2天

**技術挑戰**:

```typescript
// 需要標準化所有遊戲的狀態格式
interface GameState {
  gameType: string;
  version: number;
  cardPlacements: {
    [cardId: string]: {
      zone: string;
      position: { x: number; y: number };
      timestamp: number;
    }
  };
  zoneStates: {
    [zoneId: string]: {
      cards: string[];
      metadata?: any;
    }
  };
}
```

**實作策略**:

1. **統一狀態格式** - 7個遊戲都要改
2. **增量同步** - 只傳變化的卡片
3. **衝突解決** - 時間戳優先
4. **樂觀更新** - 本地立即顯示

**需要修改的組件**:

- 所有7個遊戲組件
- `useGameState` hook
- 拖放事件處理
- localStorage 同步邏輯

**風險**: 🟡 中 - 涉及核心邏輯，需仔細測試

---

### 3. 遊戲模式變更權限與同步 🔴 複雜

**實作工作量**: 1.5天

**權限控制**:

```typescript
// 權限檢查
interface RoomPermissions {
  canChangeGameMode: boolean; // 只有 owner
  canMoveCards: boolean;      // 所有人
  canViewGame: boolean;       // 所有人
}

// 遊戲模式變更事件
interface GameModeChangeEvent {
  type: 'GAME_MODE_CHANGE';
  newGameType: string;
  oldGameType: string;
  timestamp: number;
  userId: string;
  clearState: boolean; // 是否清空現有狀態
}
```

**技術挑戰**:

1. **權限驗證** - 前後端雙重檢查
2. **狀態清理** - 切換遊戲時的資料處理
3. **UI 同步** - 其他用戶的畫面切換
4. **訊息提示** - "遊戲模式已變更"

**複雜情況**:

- 用戶A在操作卡片，用戶B突然切換遊戲
- 需要確認對話框："確定要清空現有進度？"
- 需要廣播通知："房主已切換至職能盤點卡模式"

**風險**: 🔴 高 - 狀態管理複雜，用戶體驗要求高

---

## 🎯 建議實作順序

### Phase 1: 在線狀態 (0.5天) 🟢

**為什麼先做**:

- 簡單快速
- 立即可見效果
- 不影響現有功能
- 為後續功能建立基礎

```typescript
// 實作要點
1. 心跳 API (5分鐘)
2. 在線用戶列表 (30分鐘)
3. Header UI 組件 (1小時)
4. 整合測試 (30分鐘)
```

### Phase 2: 卡片同步 (2天) 🟡

**為什麼第二做**:

- 核心價值功能
- 技術基礎為其他功能鋪路
- 可以漸進式推出（先做1個遊戲）

```typescript
// 實作策略
Day 1: 統一狀態格式 + 後端API
Day 2: 前端同步邏輯 + 測試
```

### Phase 3: 權限控制 (1.5天) 🔴

**為什麼最後做**:

- 依賴前兩個功能
- 用戶體驗要求最高
- 可以先用簡單版本（手動重整）

---

## 📊 工作量與風險評估

| 功能 | 工作量 | 技術風險 | 用戶價值 | 實作順序 |
|------|--------|----------|----------|----------|
| 在線狀態 | 0.5天 | 🟢 低 | 🟡 中 | 1 |
| 卡片同步 | 2天 | 🟡 中 | 🟢 高 | 2 |
| 模式權限 | 1.5天 | 🔴 高 | 🟡 中 | 3 |

**總計**: 4天（符合一週計畫）

---

## 🚀 快速實作建議

### 1. 在線狀態 - MVP 版本

```typescript
// 最簡實作
const OnlineUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // 每30秒拉取一次在線用戶
    const interval = setInterval(() => {
      fetch(`/api/rooms/${roomId}/visitors`)
        .then(res => res.json())
        .then(setUsers);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {users.map(user => (
        <div key={user.id} className="flex items-center">
          <div className="w-8 h-8 bg-green-500 rounded-full" />
          <span className="text-sm">{user.name}</span>
        </div>
      ))}
    </div>
  );
};
```

### 2. 卡片同步 - 漸進策略

```typescript
// 先實作一個遊戲（生活改造王）
// 驗證可行後再擴展到其他6個

// 統一的同步接口
interface SyncableGame {
  getState(): GameState;
  setState(state: GameState): void;
  onStateChange(callback: (state: GameState) => void): void;
}
```

### 3. 權限控制 - 分階段實作

```typescript
// Phase 3a: 基本權限 (1天)
if (userRole !== 'owner') {
  // 隱藏遊戲切換按鈕
  return null;
}

// Phase 3b: 同步通知 (0.5天)
// 廣播: "房主已切換遊戲模式"
```

---

## 💡 技術架構建議

### 統一事件系統

```typescript
// 所有同步事件的標準格式
interface SyncEvent {
  type: 'USER_JOIN' | 'USER_LEAVE' | 'CARD_MOVE' | 'GAME_CHANGE';
  roomId: string;
  userId: string;
  timestamp: number;
  data: any;
}

// 事件處理器
class SyncEventHandler {
  handle(event: SyncEvent) {
    switch(event.type) {
      case 'USER_JOIN': this.handleUserJoin(event); break;
      case 'CARD_MOVE': this.handleCardMove(event); break;
      case 'GAME_CHANGE': this.handleGameChange(event); break;
    }
  }
}
```

### 狀態管理統一

```typescript
// 擴展現有的 useGameState
const useGameState = (roomId: string) => {
  const [state, setState] = useState();
  const [onlineUsers, setOnlineUsers] = useState();
  const [permissions, setPermissions] = useState();

  // 統一的同步邏輯
  const syncToServer = useCallback((newState) => {
    // 推送到後端
  }, []);

  const syncFromServer = useCallback(() => {
    // 從後端拉取
  }, []);

  return { state, onlineUsers, permissions, syncToServer };
};
```

---

## ⚠️ 注意事項

### 1. 狀態一致性

```typescript
// 所有遊戲的狀態格式要統一
// 否則同步會很混亂
const standardizeGameState = (gameType: string, rawState: any) => {
  // 轉換為標準格式
};
```

### 2. 權限邊界清楚

```typescript
// 明確定義誰可以做什麼
const PERMISSIONS = {
  OWNER: ['CHANGE_GAME', 'MOVE_CARDS', 'MANAGE_USERS'],
  VISITOR: ['MOVE_CARDS', 'VIEW_GAME']
};
```

### 3. 錯誤處理

```typescript
// 同步失敗時的降級方案
const handleSyncError = (error) => {
  // 顯示離線模式
  // 保持本地狀態
  // 定期重試
};
```

---

## 🎬 總結建議

### 最佳策略

1. **先做在線狀態** - 快速見效，建立信心
2. **重點做卡片同步** - 核心價值，仔細實作
3. **簡化權限控制** - 先能用，後完善

### 時間分配

```text
Day 1: 在線狀態 (0.5) + 卡片同步架構 (0.5)
Day 2: 卡片同步實作 (1)
Day 3: 卡片同步測試 (0.5) + 權限控制 (0.5)
Day 4: 權限控制完成 (1)
```

### 成功標準

- [ ] 可以看到其他用戶在線
- [ ] 卡片移動可以同步
- [ ] 只有房主可以切換遊戲
- [ ] 同步延遲 < 5秒
- [ ] 不影響現有功能

**這三個功能都是必要的，建議按順序實作，4天可以完成！**
