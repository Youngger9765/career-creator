# 深度架構分析：通用規則引擎設計

## 核心決策：為什麼選擇通用框架？

### 業務現實

1. **職涯諮詢工具會持續演進** - 市場會出現新的測評工具和方法
2. **競爭優勢需要快速迭代** - 新規則上線不能花費數週開發
3. **用戶需求多樣化** - 不同諮詢師可能偏好不同工具

### 技術本質

牌卡遊戲的**核心抽象是固定的**，變化的只是**配置參數**

## 不變的核心抽象

### 1. 遊戲實體 (Game Entities)

```typescript
interface GameEntity {
  // 所有牌卡遊戲都有這些基本概念
  cards: Card[];           // 牌卡集合
  zones: Zone[];           // 區域集合
  actions: Action[];       // 動作歷史
  constraints: Rule[];     // 限制規則
}
```

### 2. 空間概念 (Spatial Concepts)

```typescript
interface SpatialSystem {
  deck: DeckArea;          // 牌組區域
  playArea: Zone[];        // 遊戲區域
  positions: Position[];   // 位置系統
}
```

### 3. 行為模式 (Behavioral Patterns)

```typescript
interface GameBehavior {
  validate: (action: Action) => boolean;  // 驗證動作
  execute: (action: Action) => GameState; // 執行動作
  undo: (action: Action) => GameState;    // 撤銷動作
  score: (state: GameState) => Score;     // 計算分數
}
```

## 可變的配置參數

### 1. 布局配置 (Layout Configuration)

```json
{
  "layout": {
    "deck": {"position": "left", "style": "stack|grid|categorized"},
    "zones": [
      {
        "id": "advantage",
        "position": "right_top",
        "size": {"width": 300, "height": 200},
        "maxCards": 5
      }
    ]
  }
}
```

### 2. 規則配置 (Rule Configuration)

```json
{
  "rules": {
    "placement": {
      "maxPerZone": {"advantage": 5, "disadvantage": 5},
      "minPerZone": {"advantage": 1},
      "totalLimit": 10
    },
    "movement": {
      "allowReorder": true,
      "allowCrossZone": true
    }
  }
}
```

### 3. 內容配置 (Content Configuration)

```json
{
  "content": {
    "cardTypes": ["skill", "trait", "value"],
    "categories": ["technical", "interpersonal", "creative"],
    "metadata": ["difficulty", "importance", "frequency"]
  }
}
```

## 系統架構設計

### 核心引擎 (Engine Core)

```typescript
class GameEngine {
  private rules: GameRules;
  private state: GameState;

  executeAction(action: Action): Result {
    // 1. 驗證動作是否符合當前規則
    if (!this.rules.validate(action, this.state)) {
      return Result.invalid();
    }

    // 2. 執行動作並更新狀態
    this.state = this.rules.execute(action, this.state);

    // 3. 觸發事件和副作用
    this.publishEvent(action, this.state);

    return Result.success(this.state);
  }
}
```

### 規則系統 (Rule System)

```typescript
interface GameRules {
  id: string;
  name: string;
  version: string;

  // 核心方法
  validate(action: Action, state: GameState): boolean;
  execute(action: Action, state: GameState): GameState;

  // 配置數據
  layout: LayoutConfig;
  constraints: ConstraintConfig;
  scoring: ScoringConfig;
}

// 具體規則實現
class SkillAssessmentRules implements GameRules {
  validate(action: Action, state: GameState): boolean {
    if (action.type === 'PLACE_CARD') {
      const zone = state.getZone(action.targetZone);
      return zone.cards.length < 5; // 最多5張
    }
    return true;
  }
}
```

### 牌卡系統 (Card System)

```typescript
interface CardDeck {
  id: string;
  gameRuleId: string;  // 屬於哪個遊戲規則
  name: string;
  version: string;
  cards: Card[];
}

interface Card {
  id: string;
  deckId: string;
  key: string;         // 唯一標識符
  title: string;
  description: string;
  category: string;    // 分類
  metadata: any;       // 擴展屬性
  assets: {            // 資源文件
    image?: string;
    audio?: string;
  };
}
```

## 資料庫設計

### 1. 規則模板表 (固定配置)

```sql
CREATE TABLE game_rules (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,  -- 'skill-assessment', 'value-sorting'
  version VARCHAR(20) DEFAULT '1.0',

  -- 配置數據
  layout_config JSONB NOT NULL,
  constraint_config JSONB NOT NULL,
  scoring_config JSONB,
  ui_config JSONB,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. 牌組表 (內容管理)

```sql
CREATE TABLE card_decks (
  id UUID PRIMARY KEY,
  game_rule_id UUID REFERENCES game_rules(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  is_official BOOLEAN DEFAULT false,  -- 官方 vs 用戶自定義
  is_default BOOLEAN DEFAULT false,   -- 該規則的默認牌組
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### 3. 牌卡表 (具體內容)

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES card_decks(id),
  card_key VARCHAR(100) NOT NULL,     -- 在該牌組內的唯一標識
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  subcategory VARCHAR(50),
  display_order INTEGER DEFAULT 0,

  -- 擴展屬性
  metadata JSONB DEFAULT '{}',
  assets JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(deck_id, card_key)
);
```

### 4. 房間表 (應用層)

```sql
ALTER TABLE rooms ADD COLUMN game_rule_id UUID REFERENCES game_rules(id);
ALTER TABLE rooms ADD COLUMN card_deck_id UUID REFERENCES card_decks(id);
```

### 5. 遊戲狀態表 (運行時)

```sql
CREATE TABLE game_states (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  state_data JSONB NOT NULL,          -- 當前遊戲狀態
  version INTEGER DEFAULT 1,          -- 樂觀鎖版本
  updated_at TIMESTAMP DEFAULT now()
);
```

## API 設計

### 1. 規則管理

```typescript
GET /api/game-rules                    // 獲取可用規則列表
GET /api/game-rules/:id/decks         // 獲取規則對應的牌組
GET /api/game-rules/:id/config        // 獲取規則完整配置
```

### 2. 房間創建

```typescript
POST /api/rooms {
  name: "職涯諮詢",
  gameRuleId: "uuid",
  cardDeckId: "uuid"  // 可選，默認使用該規則的默認牌組
}
```

### 3. 遊戲操作

```typescript
POST /api/rooms/:id/actions {
  type: "PLACE_CARD",
  cardKey: "skill_001",
  targetZone: "advantage",
  position: {x: 100, y: 200}
}
// 引擎自動驗證並更新狀態
```

## 實現策略

### 階段1：核心引擎

1. 實現基礎的 GameEngine 和 GameRules 接口
2. 創建職能盤點卡規則實現
3. 遷移現有功能到新架構

### 階段2：內容管理

1. 實現牌組和牌卡管理系統
2. 導入3套官方牌組
3. 實現規則選擇UI

### 階段3：擴展能力

1. 實現價值導航卡和職游旅人卡規則
2. 完善驗證和錯誤處理
3. 性能優化和緩存

## 架構優勢

### 1. 可擴展性

- 新規則只需實現 GameRules 接口
- 新牌組只需配置數據
- UI可通過配置自動生成

### 2. 可維護性

- 核心邏輯集中在引擎
- 規則和內容分離
- 清晰的抽象邊界

### 3. 可測試性

- 規則邏輯可獨立測試
- 狀態變化可預測
- 動作可重放和調試

### 4. 性能優化

- 規則配置可緩存
- 狀態更新可批量處理
- 可實現增量同步

這個架構設計可以支撐未來5-10年的業務發展，新的牌卡規則上線只需要數天而不是數週。
