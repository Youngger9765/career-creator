# TDD重構計畫：三大模式架構升級

Test-Driven Development Refactoring Plan for Three Game Modes Architecture

## 📋 重構概述

**目標**：從現有的單一規則引擎升級為支援「模式→玩法→配置」的三層架構

**現狀分析**：

```text
目前架構：GameEngine + RuleFactory + 3個固定規則
目標架構：Mode → Gameplay → Configuration (Cards + Canvas + Props)
```

## 🎯 TDD原則（基於Kent Beck方法論）

### 核心流程

1. **列出預期行為** - 在編碼前列出所有變體
2. **紅綠重構循環** - Red → Green → Refactor
3. **一次一個測試** - 專注單一測試直到通過
4. **測試作為提示** - 測試描述精確需求給AI

## 📝 預期行為清單 (Expected Behaviors)

### 1. 模式選擇系統 (Mode Selection)

**基本情況**：

- [ ] 用戶能選擇三大模式之一（職游旅人/職能盤點/價值導航）
- [ ] 每個模式有唯一ID和名稱
- [ ] 選擇模式後自動顯示可用玩法

**邊緣情況**：

- [ ] 無效模式ID回傳錯誤
- [ ] 模式切換時清空當前狀態
- [ ] 模式資料缺失時的fallback

**現有行為保護**：

- [ ] 現有三個規則仍能正常運作
- [ ] 向後兼容舊的rule_id

### 2. 玩法配置系統 (Gameplay Configuration)

**基本情況**：

- [ ] 每個模式包含2-3個玩法選項
- [ ] 選擇玩法自動配置牌卡組
- [ ] 選擇玩法自動配置畫布類型
- [ ] 選擇玩法自動配置道具（如籌碼）

**邊緣情況**：

- [ ] 玩法配置檔缺失
- [ ] 牌卡資料不完整
- [ ] 畫布類型不匹配

**現有行為保護**：

- [ ] 優劣勢分析仍為2區5張限制
- [ ] 價值觀排序仍為3x3格子
- [ ] 六大性格仍為3欄分類

### 3. 籌碼系統 (Token/Props System)

**基本情況**：

- [ ] 生活改造王有100點籌碼
- [ ] 籌碼可在不同區域間分配
- [ ] 總和必須等於100
- [ ] 視覺化顯示籌碼數量

**邊緣情況**：

- [ ] 分配超過100點時警告
- [ ] 負數籌碼處理
- [ ] 籌碼重置功能
- [ ] 籌碼分配的即時同步

**互動邏輯**：

- [ ] 點擊+/-按鈕調整籌碼
- [ ] 拖曳籌碼在區域間轉移
- [ ] 即時顯示剩餘籌碼
- [ ] 自動平衡機制（可選）

## 🧪 測試優先開發步驟

### Phase 1: Mode System Tests (模式系統測試)

```typescript
// 1. 測試檔案：mode-system.test.ts
describe('GameModeSystem', () => {
  // RED: 寫失敗測試
  it('should return three available modes', () => {
    const modes = GameModeService.getAllModes();
    expect(modes).toHaveLength(3);
    expect(modes[0].id).toBe('career_traveler');
    expect(modes[1].id).toBe('skill_inventory');
    expect(modes[2].id).toBe('value_navigation');
  });

  it('should return gameplays for a specific mode', () => {
    const gameplays = GameModeService.getGameplays('career_traveler');
    expect(gameplays).toHaveLength(2);
    expect(gameplays[0].id).toBe('personality_analysis');
    expect(gameplays[1].id).toBe('career_collector');
  });

  it('should auto-configure canvas for selected gameplay', () => {
    const config = GameModeService.getGameplayConfig(
      'career_traveler',
      'personality_analysis'
    );
    expect(config.canvas.type).toBe('three_columns');
    expect(config.canvas.columns).toEqual(['like', 'neutral', 'dislike']);
  });

  // GREEN: 實作最簡單的通過方案
  // REFACTOR: 優化程式碼結構
});
```

### Phase 2: Gameplay Configuration Tests (玩法配置測試)

```typescript
// 2. 測試檔案：gameplay-config.test.ts
describe('GameplayConfiguration', () => {
  it('should load correct cards for personality analysis', () => {
    const config = GameplayConfig.load('personality_analysis');
    expect(config.cards.explanation).toHaveLength(6); // RIASEC
    expect(config.cards.main).toHaveLength(100); // 職業卡
  });

  it('should configure grid canvas for value ranking', () => {
    const config = GameplayConfig.load('value_ranking');
    expect(config.canvas.type).toBe('grid');
    expect(config.canvas.rows).toBe(3);
    expect(config.canvas.cols).toBe(3);
  });

  it('should include token system for life redesign', () => {
    const config = GameplayConfig.load('life_redesign');
    expect(config.props.tokens).toBeDefined();
    expect(config.props.tokens.total).toBe(100);
    expect(config.props.tokens.distributable).toBe(true);
  });
});
```

### Phase 3: Token System Tests (籌碼系統測試)

```typescript
// 3. 測試檔案：token-system.test.ts
describe('TokenSystem', () => {
  it('should initialize with 100 tokens', () => {
    const tokenSystem = new TokenSystem(100);
    expect(tokenSystem.getTotal()).toBe(100);
    expect(tokenSystem.getRemaining()).toBe(100);
  });

  it('should distribute tokens to different areas', () => {
    const tokenSystem = new TokenSystem(100);
    tokenSystem.allocate('health', 30);
    tokenSystem.allocate('career', 50);

    expect(tokenSystem.getRemaining()).toBe(20);
    expect(tokenSystem.getAllocation('health')).toBe(30);
  });

  it('should prevent over-allocation', () => {
    const tokenSystem = new TokenSystem(100);
    tokenSystem.allocate('health', 60);

    expect(() => {
      tokenSystem.allocate('career', 50);
    }).toThrow('Insufficient tokens');
  });

  it('should support token transfer between areas', () => {
    const tokenSystem = new TokenSystem(100);
    tokenSystem.allocate('health', 40);
    tokenSystem.allocate('career', 30);

    tokenSystem.transfer('health', 'career', 10);

    expect(tokenSystem.getAllocation('health')).toBe(30);
    expect(tokenSystem.getAllocation('career')).toBe(40);
  });
});
```

## 📂 檔案結構規劃

```text
/frontend/src
├── /game-modes                 # 新增：模式系統
│   ├── /types
│   │   ├── mode.types.ts      # 模式類型定義
│   │   └── gameplay.types.ts  # 玩法類型定義
│   ├── /services
│   │   ├── mode.service.ts    # 模式服務
│   │   └── config.service.ts  # 配置服務
│   ├── /configs               # 配置檔案
│   │   ├── career-traveler.json
│   │   ├── skill-inventory.json
│   │   └── value-navigation.json
│   └── /components
│       ├── ModeSelector.tsx
│       └── GameplaySelector.tsx
│
├── /token-system              # 新增：籌碼系統
│   ├── TokenManager.ts
│   ├── TokenDisplay.tsx
│   └── TokenControls.tsx
│
└── /game                      # 現有：遊戲引擎
    ├── engine.ts              # 需重構：支援新架構
    └── rules/                 # 保留：向後兼容

/backend
├── /seeds                     # 新增：種子資料
│   ├── game_modes.sql         # 模式基礎資料
│   ├── gameplays.sql          # 玩法配置資料
│   ├── card_decks.sql         # 牌組資料
│   └── canvas_configs.sql     # 畫布配置資料
└── /alembic/seeds             # 資料庫遷移種子
    └── seed_game_content.py   # 執行種子資料腳本
```

## 🌱 種子資料建立 (Seed Data)

### Database Seed Structure

```sql
-- 1. game_modes table
CREATE TABLE game_modes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. gameplays table
CREATE TABLE gameplays (
    id VARCHAR(50) PRIMARY KEY,
    mode_id VARCHAR(50) REFERENCES game_modes(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    canvas_type VARCHAR(50) NOT NULL,
    has_tokens BOOLEAN DEFAULT false,
    token_config JSONB,
    card_config JSONB,
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- 3. card_decks table
CREATE TABLE card_decks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    deck_type VARCHAR(50), -- main, auxiliary, explanation
    total_cards INTEGER,
    cards_data JSONB, -- 儲存所有卡片資料
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. canvas_configs table
CREATE TABLE canvas_configs (
    id VARCHAR(50) PRIMARY KEY,
    canvas_type VARCHAR(50) NOT NULL, -- grid, columns, zones
    layout_config JSONB,
    constraints JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Seed Data Examples

#### 1. 模式種子資料 (game_modes.sql)

```sql
-- 三大模式種子資料
INSERT INTO game_modes (id, name, description, sort_order) VALUES
('career_traveler', '職游旅人卡', '探索職業性格與職涯方向', 1),
('skill_inventory', '職能盤點卡', '分析個人優勢與成長領域', 2),
('value_navigation', '價值導航卡', '釐清人生價值觀與優先順序', 3);
```

#### 2. 玩法種子資料 (gameplays.sql)

```sql
-- 職游旅人卡的玩法
INSERT INTO gameplays (id, mode_id, name, canvas_type, card_config) VALUES
('personality_analysis', 'career_traveler', '六大性格分析', 'three_columns',
 '{"main_deck": "career_cards_100", "aux_deck": "riasec_cards"}'),
('career_collector', 'career_traveler', '職業收藏家', 'collection_zone',
 '{"main_deck": "career_cards_100", "max_collection": 15}');

-- 職能盤點卡的玩法
INSERT INTO gameplays (id, mode_id, name, canvas_type, card_config) VALUES
('advantage_analysis', 'skill_inventory', '優劣勢分析', 'two_zones',
 '{"main_deck": "skill_cards", "zone_limits": {"advantage": 5, "disadvantage": 5}}'),
('growth_planning', 'skill_inventory', '成長計畫', 'three_zones',
 '{"deck_a": "skill_cards", "deck_b": "ability_cards"}'),
('position_breakdown', 'skill_inventory', '職位拆解', 'free_canvas',
 '{"main_deck": "skill_cards", "allow_screenshot": true}');

-- 價值導航卡的玩法
INSERT INTO gameplays (id, mode_id, name, canvas_type, has_tokens, token_config) VALUES
('value_ranking', 'value_navigation', '價值觀排序', 'grid_3x3',
 false, NULL),
('life_redesign', 'value_navigation', '生活改造王', 'value_gauge',
 true, '{"total_tokens": 100, "token_name": "生活能量", "constraints": {"sum_equals": 100}}');
```

#### 3. 牌組種子資料 (card_decks.sql)

```sql
-- 職業卡牌組（100張）
INSERT INTO card_decks (id, name, deck_type, total_cards, cards_data) VALUES
('career_cards_100', '職業卡', 'main', 100,
 '[
   {"id": "c001", "title": "軟體工程師", "category": "R",
    "description": "..."},
   {"id": "c002", "title": "護理師", "category": "S",
    "description": "..."},
   -- ... 98 more cards
 ]');

-- RIASEC解釋卡（6張）
INSERT INTO card_decks (id, name, deck_type, total_cards, cards_data) VALUES
('riasec_cards', 'RIASEC性格卡', 'explanation', 6,
 '[
   {"id": "R", "title": "實用型(R)",
    "description": "喜歡動手操作..."},
   {"id": "I", "title": "研究型(I)",
    "description": "喜歡思考分析..."},
   {"id": "A", "title": "藝術型(A)", "description": "喜歡創意表達..."},
   {"id": "S", "title": "社交型(S)", "description": "喜歡與人互動..."},
   {"id": "E", "title": "企業型(E)", "description": "喜歡領導管理..."},
   {"id": "C", "title": "傳統型(C)", "description": "喜歡規律有序..."}
 ]');

-- 職能卡組
INSERT INTO card_decks (id, name, deck_type, total_cards, cards_data) VALUES
('skill_cards', '職能卡', 'main', 52,
 '[
   {"id": "s001", "title": "溝通表達", "category": "soft", "description": "..."},
   {"id": "s002", "title": "專案管理", "category": "hard", "description": "..."},
   -- ... more skills
 ]');

-- 價值觀卡組（36張核心價值）
INSERT INTO card_decks (id, name, deck_type, total_cards, cards_data) VALUES
('value_cards', '價值觀卡', 'main', 36,
 '[
   {"id": "v001", "title": "家庭", "description": "與家人共度時光..."},
   {"id": "v002", "title": "事業", "description": "職涯成就與發展..."},
   {"id": "v003", "title": "健康", "description": "身心健康與平衡..."},
   -- ... 33 more values
 ]');
```

#### 4. 畫布配置種子資料 (canvas_configs.sql)

```sql
-- 三欄式畫布（六大性格）
INSERT INTO canvas_configs (id, canvas_type, layout_config, constraints) VALUES
('three_columns', 'columns',
 '{"columns": ["like", "neutral", "dislike"], "column_names": ["喜歡", "中立", "討厭"]}',
 '{"max_per_column": {"like": 20, "dislike": 20}}');

-- 3x3格子畫布（價值觀排序）
INSERT INTO canvas_configs (id, canvas_type, layout_config, constraints) VALUES
('grid_3x3', 'grid',
 '{"rows": 3, "cols": 3, "numbered": true}',
 '{"unique_placement": true, "max_cards": 9}');

-- 雙區畫布（優劣勢）
INSERT INTO canvas_configs (id, canvas_type, layout_config, constraints) VALUES
('two_zones', 'zones',
 '{"zones": ["advantage", "disadvantage"], "zone_names": ["優勢", "劣勢"]}',
 '{"max_per_zone": 5}');

-- 量表畫布（生活改造王）
INSERT INTO canvas_configs (id, canvas_type, layout_config, constraints) VALUES
('value_gauge', 'gauge',
 '{"scale_min": 0, "scale_max": 100, "has_tokens": true}',
 '{"token_distribution": "manual", "token_sum": 100}');
```

### Seed Execution Script

```python
# backend/alembic/seeds/seed_game_content.py
import json
from sqlalchemy import text
from app.core.database import SessionLocal

def seed_game_modes():
    """種植遊戲模式基礎資料"""
    db = SessionLocal()
    try:
        # 讀取並執行SQL種子檔案
        with open('seeds/game_modes.sql', 'r') as f:
            db.execute(text(f.read()))

        with open('seeds/gameplays.sql', 'r') as f:
            db.execute(text(f.read()))

        with open('seeds/card_decks.sql', 'r') as f:
            db.execute(text(f.read()))

        with open('seeds/canvas_configs.sql', 'r') as f:
            db.execute(text(f.read()))

        db.commit()
        print("✅ Game content seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_game_modes()
```

### Testing Seed Data

```typescript
// Test that seed data is properly loaded
describe('Seed Data Tests', () => {
  it('should have all three game modes in database', async () => {
    const modes = await db.query('SELECT * FROM game_modes');
    expect(modes.rows).toHaveLength(3);
  });

  it('should have correct gameplays for each mode', async () => {
    const careerGameplays = await db.query(
      'SELECT * FROM gameplays WHERE mode_id = $1',
      ['career_traveler']
    );
    expect(careerGameplays.rows).toHaveLength(2);
  });

  it('should have complete card deck data', async () => {
    const careerCards = await db.query(
      'SELECT * FROM card_decks WHERE id = $1',
      ['career_cards_100']
    );
    expect(careerCards.rows[0].total_cards).toBe(100);
    expect(JSON.parse(careerCards.rows[0].cards_data)).toHaveLength(100);
  });
});
```

## 🔄 重構步驟（TDD循環）

### Step 1: Red Phase (寫失敗測試)

```bash
# 1. 創建測試檔案
touch frontend/src/__tests__/game-modes.test.ts
touch frontend/src/__tests__/token-system.test.ts

# 2. 寫第一個失敗測試
# 3. 執行測試確認失敗
npm test -- --watch
```

### Step 2: Green Phase (最小實作)

```typescript
// 只實作讓測試通過的最少程式碼
// 不考慮優化，只求通過
export class GameModeService {
  static getAllModes() {
    // Hardcode for now
    return [
      { id: 'career_traveler', name: '職游旅人卡' },
      { id: 'skill_inventory', name: '職能盤點卡' },
      { id: 'value_navigation', name: '價值導航卡' }
    ];
  }
}
```

### Step 3: Refactor Phase (優化重構)

```typescript
// 測試通過後，優化程式碼
// 提取常數、改善命名、減少重複
const GAME_MODES = {
  CAREER_TRAVELER: 'career_traveler',
  SKILL_INVENTORY: 'skill_inventory',
  VALUE_NAVIGATION: 'value_navigation'
} as const;

// 使用配置檔案取代硬編碼
import modeConfigs from './configs/modes.json';
```

## 🎮 資料結構設計

### Mode Configuration Schema

```typescript
interface GameMode {
  id: string;
  name: string;
  description: string;
  gameplays: Gameplay[];
}

interface Gameplay {
  id: string;
  name: string;
  description: string;
  config: GameplayConfig;
}

interface GameplayConfig {
  cards: {
    main?: CardDeck;
    auxiliary?: CardDeck;
    explanation?: CardDeck;
  };
  canvas: CanvasConfig;
  props?: {
    tokens?: TokenConfig;
    timer?: TimerConfig;
  };
  rules: GameRules;
}

interface TokenConfig {
  total: number;
  distributable: boolean;
  constraints?: {
    min?: number;
    max?: number;
    sumEquals?: number;
  };
}
```

## 🚦 測試覆蓋目標

### 單元測試 (Unit Tests)

- [ ] Mode selection logic - 80% coverage
- [ ] Gameplay configuration - 80% coverage
- [ ] Token system - 90% coverage
- [ ] Canvas types - 75% coverage

### 整合測試 (Integration Tests)

- [ ] Mode → Gameplay flow
- [ ] Gameplay → Configuration flow
- [ ] Token distribution with canvas
- [ ] State persistence across mode switches

### E2E測試 (End-to-End Tests)

- [ ] Complete user journey for each mode
- [ ] Mode switching without data loss
- [ ] Token system in 生活改造王
- [ ] Multi-user token sync

## 📊 成功指標

### 技術指標

- ✅ 所有測試通過 (100% pass rate)
- ✅ 測試覆蓋率 > 75%
- ✅ 無破壞性變更 (backward compatible)
- ✅ TypeScript類型完整

### 業務指標

- ✅ 新玩法上線時間 < 3天
- ✅ 配置變更不需改程式碼
- ✅ 支援未來擴展10+種玩法
- ✅ 用戶體驗保持一致

## 🔴 風險與緩解

### 風險1：破壞現有功能

**緩解**：

- 保持舊API向後兼容
- 使用feature flag逐步切換
- 完整的regression測試

### 風險2：複雜度增加

**緩解**：

- 清晰的抽象層級
- 完善的文件說明
- 程式碼審查機制

### 風險3：效能影響

**緩解**：

- 配置檔案lazy loading
- 使用React.memo優化
- 監控關鍵效能指標

## 📅 實施時程

### Day 1-2: Test Writing Phase

- 寫完所有失敗測試
- 定義清楚的介面契約
- 建立測試基礎設施

### Day 3-4: Implementation Phase

- Mode系統實作
- Gameplay配置實作
- Token系統實作

### Day 5: Integration Phase

- 整合新舊系統
- 資料遷移腳本
- 整合測試

### Day 6-7: Polish Phase

- UI/UX優化
- 效能調校
- 文件更新

## 🎯 下一步行動

1. **立即開始**：創建第一個測試檔案
2. **小步前進**：一次只專注一個測試
3. **持續整合**：每個測試通過就commit
4. **及時重構**：綠燈後立即優化

## 📚 參考資源

- Kent Beck's "Test Driven Development: By Example"
- Martin Fowler's "Refactoring"
- Clean Architecture principles
- React Testing Library best practices

---

*Version: 1.0*
*Date: 2025-09-21*
*Status: Planning Phase*
*Approach: Test-Driven Development with AI assistance*
