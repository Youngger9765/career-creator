# 遊戲設計與架構文檔

## 📋 目錄

1. [遊戲架構總覽](#-遊戲架構總覽)
2. [實作現況](#-實作現況)
3. [配置策略](#-配置策略)
4. [特色功能](#-特色功能)
5. [未來規劃](#-未來規劃)

---

## 🎮 遊戲架構總覽

### 三大遊戲模式

```text
職涯牌卡諮詢系統
├── 職游旅人卡 (Career Cards)
│   ├── 六大性格分析
│   └── 職業收藏家
├── 職能盤點卡 (Skill Cards)
│   ├── 優劣勢分析
│   ├── 成長計畫
│   └── 職位拆解
└── 價值導航卡 (Value Cards)
    ├── 價值觀排序
    └── 生活改造王
```

### 技術架構

```text
GameModeIntegration (統一入口)
  ├── GameLayout (統一佈局)
  │   ├── GameInfoBar (遊戲資訊)
  │   ├── CardSidebar (側邊欄+牌卡)
  │   └── Canvas (遊戲畫布)
  └── 7個獨立遊戲組件
      ├── PersonalityAnalysisGame
      ├── CareerCollectorGame
      ├── AdvantageAnalysisGame
      ├── GrowthPlanningGame
      ├── PositionBreakdownGame
      ├── ValueRankingGame
      └── LifeTransformationGame
```

### 核心組件復用

| 組件 | 用途 | 復用率 |
|------|------|---------|
| GameLayout | 統一佈局框架 | 100% (7/7) |
| CardSidebar | 可收合側邊欄 | 100% (7/7) |
| DropZone | 拖放區域 | 85% (6/7) |
| CardItem | 卡片顯示 | 100% (7/7) |
| useGameState | 狀態管理 | 100% (7/7) |

---

## ✅ 實作現況

### 已完成功能（2025-09-28）

#### 🎯 核心功能

- ✅ **7個遊戲模式完整實現**
- ✅ **統一組件架構** - GameLayout統一佈局
- ✅ **狀態持久化** - localStorage + Zustand
- ✅ **拖放操作** - @dnd-kit完整整合
- ✅ **響應式設計** - 支援手機/平板/桌面

#### 🌟 特色功能

- ✅ **CardTokenWidget** - 籌碼分配工具（生活改造王專屬）
- ✅ **動態圓餅圖** - 即時視覺化資源分配
- ✅ **PDF上傳分析** - 職位拆解功能
- ✅ **可收合側邊欄** - 優化使用空間
- ✅ **深色模式支援** - 全局主題切換

### 進度統計

| 層面 | 完成度 | 說明 |
|------|--------|------|
| 遊戲功能 | 100% | 7種玩法全部實現 |
| 組件架構 | 95% | 高度模組化，無重複代碼 |
| 狀態管理 | 90% | localStorage完整，待後端同步 |
| UI/UX | 85% | 響應式完成，待優化細節 |
| 多人協作 | 0% | 尚未開始 |

---

## 🔧 配置策略

### 當前方案：Code-Based Configuration

```typescript
// 遊戲配置直接寫在代碼中
const gameConfigs = {
  personality_analysis: {
    canvas: 'three_columns',
    cards: ['career_cards_100'],
    rules: { maxPerColumn: 20 }
  },
  life_transformation: {
    canvas: 'token_allocation',
    cards: ['value_cards_36'],
    rules: { totalTokens: 100 }
  }
};
```

### 選擇理由

| 因素 | Code-Based | Database-Based | 決策 |
|------|------------|----------------|------|
| 開發速度 | ⚡快速 | 🐢較慢 | ✅ Code |
| 版本控制 | ✅ Git追蹤 | ❌ 需額外處理 | ✅ Code |
| 型別安全 | ✅ TypeScript | ❌ 運行時檢查 | ✅ Code |
| 靈活修改 | ❌ 需重新部署 | ✅ 即時生效 | - |
| A/B測試 | ❌ 困難 | ✅ 容易 | - |

### 未來演進路徑

```text
Phase 1 (當前): Pure Code-Based
Phase 2 (3個月): Hybrid (規則Code + 內容DB)
Phase 3 (6個月): Full Database-Based with Admin Panel
```

---

## 🌟 特色功能詳細

### 1. 生活改造王 - CardTokenWidget

**創新點**：將抽象的價值觀轉換為具體的資源分配

```typescript
interface TokenAllocation {
  area: string;      // 生活領域
  amount: number;    // 分配籌碼數
  percentage: number; // 百分比
}
```

**使用流程**：

1. 拖曳價值卡到畫布
2. 自動轉換為籌碼分配器
3. 滑桿調整籌碼分配
4. 圓餅圖即時更新

### 2. 職位拆解 - 雙區域佈局

**設計特色**：50/50分割畫面

- 左側：職能卡片分析區
- 右側：PDF職缺上傳區

### 3. 六大性格分析 - 三欄式分類

**互動設計**：

- 喜歡 / 中立 / 不喜歡 三欄
- 拖放即時分類
- 每欄最多20張限制

---

## 🚀 未來規劃

### Phase 1: 後端整合（1個月內）

```typescript
// 遊戲狀態API設計
POST /api/rooms/{roomId}/game-state
{
  gameType: "life_transformation",
  state: {
    cardPlacements: {...},
    metadata: {...}
  }
}
```

### Phase 2: 多人協作（2-3個月）

- [ ] WebSocket即時同步
- [ ] 操作衝突解決
- [ ] 協作游標顯示
- [ ] 操作歷史記錄

### Phase 3: 進階功能（3-6個月）

- [ ] 遊戲結果分析報表
- [ ] 自定義遊戲規則
- [ ] AI輔助建議
- [ ] 遊戲錄製與重播

### Phase 4: 商業化功能（6個月後）

- [ ] 付費牌組擴充
- [ ] 企業版定製
- [ ] 數據分析儀表板
- [ ] API開放平台

---

## 📊 技術債務與優化

### 待優化項目

| 優先級 | 項目 | 影響 | 預計工時 |
|--------|------|------|----------|
| 🔴 高 | 遊戲狀態後端同步 | 多人協作基礎 | 2週 |
| 🔴 高 | TypeScript類型完善 | 開發效率 | 1週 |
| 🟡 中 | 組件性能優化 | 用戶體驗 | 1週 |
| 🟡 中 | 單元測試覆蓋 | 代碼品質 | 2週 |
| 🟢 低 | 動畫效果增強 | 視覺體驗 | 1週 |

---

## 📚 相關文檔

- [系統架構](./ARCHITECTURE.md) - 整體技術架構
- [開發指南](./CLAUDE.md) - 編碼規範與約定
- [週報](./WEEKLY_REPORT_2025-09-27.md) - 最新進度報告

---

**最後更新：2025-09-29**
