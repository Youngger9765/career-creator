# 遊戲配置儲存策略分析

Game Configuration Storage Strategy Analysis

## 🎯 核心問題：玩法配置應該用 Code 控制還是 DB？

## 📊 現況分析

目前我們有：

- 3個遊戲模式 (Mode)
- 7種玩法 (Gameplay)
- 7種畫布配置 (Canvas)
- 194張牌卡資料 (Cards)
- 籌碼系統配置 (Token)

## 🔄 兩種方案比較

### 方案A：Code-Based (程式碼控制)

```typescript
// 配置存在 JSON/TypeScript 檔案中
const gameplayConfigs = {
  personality_analysis: {
    canvas: 'three_columns',
    cards: ['career_cards_100', 'riasec_cards'],
    rules: { maxPerColumn: 20 }
  }
};
```

**優點：**

- ✅ 版本控制簡單（Git追蹤）
- ✅ 型別安全（TypeScript）
- ✅ 部署簡單（跟程式碼一起）
- ✅ 效能好（編譯時優化）
- ✅ 開發快速（立即看到變化）

**缺點：**

- ❌ 修改需要重新部署
- ❌ 非技術人員無法修改
- ❌ 無法做A/B測試
- ❌ 難以個人化配置

### 方案B：Database-Based (資料庫控制)

```sql
-- 配置存在資料庫表格中
CREATE TABLE gameplay_configs (
  id VARCHAR PRIMARY KEY,
  canvas_type VARCHAR,
  card_decks JSONB,
  rules JSONB
);
```

**優點：**

- ✅ 即時修改（不需部署）
- ✅ 可做A/B測試
- ✅ 支援個人化配置
- ✅ 非技術人員可透過後台修改

**缺點：**

- ❌ 需要額外的管理介面
- ❌ 版本控制困難
- ❌ 可能有效能開銷
- ❌ 型別安全較弱

## 🎨 混合方案（推薦）

### 分層儲存策略

```yaml
第1層 - 核心規則引擎 (Code)
  - 不常變動
  - 需要型別安全
  - 例：動作驗證邏輯、約束規則

第2層 - 玩法配置 (Code + Feature Flags)
  - 中等變動頻率
  - 需要版本控制
  - 例：畫布類型、牌組配對

第3層 - 內容資料 (Database)
  - 經常變動
  - 需要個人化
  - 例：牌卡內容、用戶自定義規則
```

### 實作範例

```typescript
// 1. 核心規則 (Code)
class GameEngine {
  validateAction(action: Action): boolean {
    // 固定的驗證邏輯
  }
}

// 2. 玩法配置 (Code + JSON)
// gameplay-configs.json
{
  "personality_analysis": {
    "canvas": "three_columns",
    "cardDecks": ["career_100", "riasec_6"],
    "featureFlags": {
      "enableTimer": false,
      "maxCards": 20
    }
  }
}

// 3. 內容資料 (Database)
// 牌卡內容、用戶設定等存在DB
SELECT * FROM card_contents WHERE deck_id = 'career_100';
SELECT * FROM user_gameplay_settings WHERE user_id = ?;
```

## 🚀 建議實施策略

### Phase 1: MVP (現在)

**全部用 Code**

- 快速開發和驗證
- 所有配置在 JSON 檔案
- 專注於功能完整性

```typescript
// 現在的做法是正確的
import gameplayConfigs from './data/gameplay-configs.json';
import cardData from './data/cards/*.json';
```

### Phase 2: 擴展期 (3-6個月後)

**混合模式**

- 核心規則保留在 Code
- 開始將牌卡內容移到 DB
- 建立簡單的內容管理介面

```typescript
// 混合載入
const gameplay = await loadGameplayConfig('personality_analysis'); // Code
const cards = await CardService.loadFromDB('career_100'); // DB
```

### Phase 3: 成熟期 (6個月後)

**智能配置**

- 保留核心在 Code
- 玩法配置支援覆寫
- 完整的 CMS 系統

```typescript
// 智能載入with fallback
const config = await ConfigService.load('personality_analysis', {
  source: 'db',
  fallback: 'code',
  userId: currentUser.id // 支援個人化
});
```

## 📝 決策矩陣

| 配置類型 | 建議儲存位置 | 原因 |
|---------|------------|------|
| 遊戲規則邏輯 | Code | 需要型別安全、單元測試 |
| 畫布布局 | Code/JSON | 中等變動、需要版本控制 |
| 玩法參數 | Code → DB | 開始用Code，後期移到DB |
| 牌卡內容 | JSON → DB | 內容多、需要搜尋 |
| 用戶設定 | DB | 個人化、需要持久化 |
| 籌碼配置 | Code | 核心機制、不常變動 |
| Feature Flags | DB/Service | A/B測試、即時開關 |

## 🎯 具體建議

### 現階段（MVP）維持 Code-Based

```typescript
// 繼續使用現有架構
frontend/src/game-modes/
├── data/
│   ├── cards/*.json        // 牌卡資料
│   ├── canvas/*.json       // 畫布配置
│   └── gameplays.json      // 玩法配置
└── services/
    └── card-loader.service.ts  // 載入服務
```

### 未來準備

1. **設計通用介面**：讓載入邏輯可以切換來源
2. **準備資料庫 Schema**：但先不實作
3. **保持配置結構一致**：方便未來遷移

```typescript
// 預留介面設計
interface ConfigLoader {
  load(id: string): Promise<GameplayConfig>;
}

class JSONConfigLoader implements ConfigLoader { }
class DBConfigLoader implements ConfigLoader { }
class HybridConfigLoader implements ConfigLoader { }
```

## ✅ 結論

**現在用 Code (JSON) 是正確的選擇**，因為：

1. 🚀 **開發速度快** - 不需要建立管理介面
2. 🔒 **型別安全** - TypeScript 編譯時檢查
3. 📦 **部署簡單** - 跟程式碼一起發布
4. 🔄 **版本控制** - Git 追蹤所有變更

**未來可以漸進式遷移到 DB**，當：

- 需要非技術人員修改配置
- 需要 A/B 測試不同玩法
- 用戶想要自定義規則
- 內容量大到影響程式碼庫

## 🔧 Action Items

### 立即執行

- [x] 保持現有 JSON 配置方式
- [x] 確保配置結構標準化
- [ ] 文件化配置格式

### 未來準備

- [ ] 設計資料庫 Schema（但不實作）
- [ ] 抽象化配置載入介面
- [ ] 評估 Feature Flag 服務（如 LaunchDarkly）

---
*決策日期：2025-09-21*
*建議：維持 Code-Based，為未來 DB 遷移預留彈性*
