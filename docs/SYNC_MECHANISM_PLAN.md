# 同步機制實作計畫

## 🎯 目標：一週內實現多人即時協作

**交付日期**: 2025-10-06
**開始日期**: 2025-09-29

---

## 📊 現況分析

### ✅ 已有資源（超出預期！）

1. **後端 API 已完成**
   - `/api/rooms/{id}/events` - 事件記錄端點
   - PostgreSQL card_events 表已建立
   - Event sourcing 架構已就緒

2. **前端架構已完成且設計優秀**
   - 7種遊戲模式 100% 實現
   - **完整的狀態管理架構** - `game-state-store.ts`
   - **同步準備完善** - 已有 `syncStatus`、`version`、`lastModified`
   - **統一狀態格式** - 所有遊戲都有標準化結構
   - Zustand 統一狀態管理

3. **基礎設施已完成**
   - JWT 認證機制
   - 房間管理 CRUD
   - 訪客系統 API 端點

### 🎯 三大核心功能需求

1. **Header 顯示在線用戶** - 🟢 簡單（0.5天）
2. **卡片移動同步** - 🟡 中等（2天）
3. **遊戲模式變更權限與同步** - 🔴 複雜（1.5天）

### 💡 關鍵發現：架構已為同步做好準備

**原以為需要重構，實際只需要「包裝現有API」**：

- 現有 `useGameState` 介面完美，無需修改
- 7個遊戲組件一行代碼都不用改
- 只在 store 層面添加後端同步邏輯

---

## 🏗️ 實作策略：漸進式增強

### 核心策略：包裝現有架構 (Wrapper Pattern)

**新策略原則**：

1. **零破壞性** - 7個遊戲組件一行代碼都不改
2. **包裝而非重寫** - 在 store 層添加同步邏輯
3. **漸進式啟用** - 可按遊戲類型逐步測試

**技術方案**：

```typescript
// 現有代碼完全不動
const { state, updateCards } = useGameState(roomId, 'life');

const handleCardDrop = (cardId, area) => {
  updateCards({ /* 現有邏輯 */ });
  // 👆 這個調用會自動觸發後端同步！
};
```

---

## 📅 四天衝刺計畫（修正版）

### Day 1: 在線狀態 + 後端API（1天）

**目標**: 快速見效 + 建立基礎

#### Morning (3hrs): Header 在線狀態

```typescript
// 簡單心跳機制
POST /api/rooms/{id}/heartbeat
GET  /api/rooms/{id}/visitors   // 現有API

// Header 組件
<OnlineIndicator users={onlineUsers} />
```

#### Afternoon (5hrs): 後端遊戲狀態API

```python
# 利用現有狀態格式，完美匹配！
POST /api/rooms/{id}/game-state/{game_type}
GET  /api/rooms/{id}/game-state/{game_type}

# 資料庫設計
CREATE TABLE game_states (
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50),
  state JSONB,  -- 直接存 GameState 格式
  version INTEGER,
  updated_at TIMESTAMP,
  UNIQUE(room_id, game_type)
);
```

---

### Day 2: 同步服務層（1天）

**目標**: 包裝現有 store，添加同步能力

```typescript
// 擴展現有 useGameStateStore
export const useGameStateStore = create<GameStateStore>()(
  persist(
    (set, get) => ({
      // 保持現有邏輯完全不變...

      setGameState: (roomId, gameType, state) => {
        // 1. 現有本地更新邏輯
        // 2. 【新增】標記為 pending
        // 3. 【新增】觸發背景同步
        queueBackgroundSync(roomId, gameType, updatedState);
      },

      // 【新增】從後端同步
      syncFromServer: async (roomId, gameType) => {
        const serverState = await fetchGameState(roomId, gameType);
        // 智能合併本地與遠端狀態
      }
    })
  )
);

// 重點：現有7個遊戲組件完全不用改！
```

---

### Day 3: 權限控制（1天）

**目標**: 權限控制與遊戲模式同步

```typescript
// 權限檢查
interface RoomPermissions {
  canChangeGameMode: boolean; // 只有 owner
  canMoveCards: boolean;      // 所有人
  canViewGame: boolean;       // 所有人
}

// 遊戲模式變更事件
const handleGameModeChange = (newGameType) => {
  if (!permissions.canChangeGameMode) return;

  // 1. 確認對話框
  // 2. 廣播通知其他用戶
  // 3. 同步切換所有人的畫面
};
```

---

### Day 4: 測試與優化（1天）

**重點項目**：

1. **效能優化**
   - 防抖動（debounce）狀態推送
   - 只傳送差異資料
   - 批次處理更新

2. **錯誤處理**
   - 網路斷線重連
   - 狀態衝突提示
   - 自動重試機制

3. **使用體驗**
   - 顯示其他用戶游標
   - 操作者標識
   - 同步狀態指示器

---

### Day 7: 測試與部署（1天）

**測試場景**：

1. 單人操作 → 資料持久化
2. 雙人協作 → 即時同步
3. 斷線重連 → 狀態恢復
4. 衝突處理 → 自動合併

**部署檢查**：

- [ ] 後端 API 部署到 staging
- [ ] 前端同步服務啟用
- [ ] 監控告警設置
- [ ] 使用文檔更新

---

## 🚀 快速交付策略

### 1. 智能輪詢 vs WebSocket

**選擇輪詢的理由**：

- 實作簡單，2天完成
- 現有架構支援
- 2-4秒延遲可接受
- 省去 WebSocket 基礎建設

**未來升級路徑**：

```text
Phase 1: HTTP 輪詢（本週）
Phase 2: Server-Sent Events（下個月）
Phase 3: WebSocket（按需求）
```

### 2. 樂觀更新策略

**使用者體驗優先**：

1. 本地操作立即生效
2. 背景同步到伺服器
3. 衝突時才提示用戶

### 3. 增量開發

**風險控制**：

- 每個功能獨立分支
- 每天合併到 staging
- 隨時可降級到 localStorage

---

## 📊 成功標準

### 必須達成（P0）

- [ ] 遊戲狀態可持久化到後端
- [ ] 2個用戶可看到彼此操作（4秒內）
- [ ] 訪客可免登入參與

### 應該達成（P1）

- [ ] 斷線重連自動恢復
- [ ] 基本衝突處理
- [ ] 同步狀態提示

### 可以達成（P2）

- [ ] 顯示其他用戶游標
- [ ] 操作歷史回放
- [ ] 效能監控面板

---

## 🔧 技術決策

### 狀態同步方案

```typescript
// 方案：Last Write Wins + 版本控制
{
  version: 1,
  timestamp: "2025-09-29T10:00:00Z",
  state: { /* 遊戲狀態 */ },
  lastModifiedBy: "user-id"
}
```

### 衝突解決策略

1. **自動合併**：不同區域的操作
2. **最後寫入優先**：相同卡片的移動
3. **用戶選擇**：複雜衝突情況

### API 設計原則

1. **冪等性**：重複請求結果一致
2. **原子性**：操作要麼全成功要麼全失敗
3. **版本化**：支援向後相容

---

## 💡 風險與對策

| 風險 | 可能性 | 影響 | 對策 |
|-----|--------|------|------|
| 狀態同步延遲過高 | 中 | 高 | 優先優化熱點路徑 |
| 資料衝突頻繁 | 低 | 中 | 實作智能合併策略 |
| 後端效能瓶頸 | 低 | 高 | 準備降級方案 |
| 瀏覽器相容性 | 低 | 低 | 只支援現代瀏覽器 |

---

## 📝 實作順序建議

### 最佳路徑（推薦）

```text
Day 1-2: 後端 API（可並行開發）
  ├── game_states 表設計
  ├── CRUD API 實作
  └── 單元測試

Day 3-4: 前端同步
  ├── GameSyncService
  ├── 整合到一個遊戲
  └── 驗證可行性

Day 5: 訪客系統
  ├── 訪客識別
  └── 權限控制

Day 6-7: 優化與測試
  ├── 效能調優
  ├── 整合測試
  └── 部署上線
```

### 備選方案

如果時間不足，可以：

1. **只做持久化**（3天）- 先解決資料遺失問題
2. **只做單向同步**（5天）- 諮詢師操作，訪客觀看
3. **只做核心遊戲**（5天）- 先實作最常用的2-3個遊戲

---

## ✅ 每日檢查點

### Day 1 結束

- [ ] 後端 API 設計完成
- [ ] 資料庫 migration 完成

### Day 2 結束

- [ ] 後端 API 可運作
- [ ] Postman 測試通過

### Day 3 結束

- [ ] 前端同步服務框架完成
- [ ] 可推送狀態到後端

### Day 4 結束

- [ ] 可拉取遠端狀態
- [ ] 一個遊戲完整串通

### Day 5 結束

- [ ] 訪客可進入房間
- [ ] 雙向同步運作

### Day 6 結束

- [ ] 效能優化完成
- [ ] 錯誤處理完善

### Day 7 結束

- [ ] 測試場景全通過
- [ ] 部署到 staging

---

## 🎯 結論

**核心理念**：
> 不追求完美，追求可用。先讓它動起來，再讓它動得更好。

**成功關鍵**：

1. 利用現有架構，不重新發明輪子
2. 漸進式改進，每天可交付
3. 優先用戶體驗，技術債務後償

**預期成果**：

- 一週內實現基本多人協作
- 保持現有功能不受影響
- 為未來升級預留空間

---

## 🎯 更新後的成功標準

### 核心必達成果（P0）

- [ ] Header 顯示在線用戶（30秒心跳）
- [ ] 卡片移動可同步（3秒內）
- [ ] 遊戲模式切換權限控制

### 重要增強功能（P1）

- [ ] 網路斷線自動降級到 localStorage
- [ ] 同步狀態視覺指示器
- [ ] 版本衝突智能合併

### 額外優化項目（P2）

- [ ] 操作歷史記錄
- [ ] 用戶在線狀態指示
- [ ] 同步性能監控

---

## 💡 最終結論

### 核心策略成功：「包裝而非重寫」

**時間節省**：從8天縮短到4天 ⚡
**風險降低**：從高風險到低風險 🛡️
**功能不減**：三大核心功能完整實現 ✅

### 技術優勢

1. **零破壞性** - 現有功能完全不受影響
2. **漸進式** - 可按遊戲類型逐步啟用
3. **可降級** - 後端故障時自動回到 localStorage

### 預期成果

- **Day 1 結束**: 可看到其他用戶在線
- **Day 2 結束**: 卡片操作可以同步
- **Day 3 結束**: 權限控制完整運作
- **Day 4 結束**: 完整多人協作體驗

**這個方案完美利用了現有架構的優勢，是最穩妥且快速的實現路徑！**

---
*計畫制定日期：2025-09-29*
*計畫更新日期: 2025-09-29*
*預計完成日期：2025-10-02（提前4天！）*
