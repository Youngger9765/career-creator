# 牌局規則系統架構

## 設計原則

- **規則模板**: 固定遊戲規則 (3種)
- **官方牌組**: 每種規則配對應官方牌卡
- **未來擴展**: 保留自定義牌卡接口

## DB Schema 設計

### 1. GameRuleTemplate (規則模板表)

```sql
CREATE TABLE game_rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                    -- '職能盤點卡', '價值導航卡', '職游旅人卡'
  description TEXT,
  layout_config JSONB NOT NULL,                  -- 布局配置
  validation_rules JSONB NOT NULL,               -- 驗證規則
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Room (修改現有表)

```sql
ALTER TABLE rooms
ADD COLUMN game_rule_id UUID REFERENCES game_rule_templates(id);
```

### 3. OfficialDeck (官方牌組表)

```sql
CREATE TABLE official_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_rule_id UUID REFERENCES game_rule_templates(id),
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### 4. Card (牌卡表)

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES official_decks(id),
  card_key VARCHAR(50) NOT NULL,                 -- 'career_001', 'value_high_001'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  card_type VARCHAR(50),                         -- 'career', 'value', 'explanation'
  category VARCHAR(50),                          -- 分類標籤
  display_order INTEGER,
  metadata JSONB,                                -- 額外屬性
  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(deck_id, card_key)
);
```

### 5. CardEvent (修改現有表)

```sql
ALTER TABLE card_events
ADD COLUMN card_key VARCHAR(50),               -- 引用 cards.card_key
ADD COLUMN game_rule_id UUID REFERENCES game_rule_templates(id);
```

## 規則配置範例

### 職能盤點卡配置

```json
{
  "layout": {
    "deck_area": {"position": "left", "type": "stack"},
    "drop_zones": [
      {
        "id": "advantage",
        "name": "優勢",
        "position": "right_top",
        "max_cards": 5,
        "required": false
      },
      {
        "id": "disadvantage",
        "name": "劣勢",
        "position": "right_bottom",
        "max_cards": 5,
        "required": false
      }
    ]
  },
  "validation": {
    "max_total_placed": 10,
    "zone_limits": {
      "advantage": 5,
      "disadvantage": 5
    }
  }
}
```

### 價值導航卡配置

```json
{
  "layout": {
    "deck_area": {"position": "left", "type": "categorized"},
    "drop_zones": [
      {"id": "rank_1", "name": "第1名", "position": "grid_1_1", "max_cards": 1},
      {"id": "rank_2", "name": "第2名", "position": "grid_1_2", "max_cards": 1},
      {"id": "rank_9", "name": "第9名", "position": "grid_3_3", "max_cards": 1}
    ]
  },
  "validation": {
    "total_required": 9,
    "unique_positions": true
  }
}
```

### 職游旅人卡配置

```json
{
  "layout": {
    "deck_area": {"position": "left", "type": "dual_layer"},
    "drop_zones": [
      {"id": "like", "name": "喜歡", "position": "column_1", "max_cards": 20},
      {"id": "neutral", "name": "中立", "position": "column_2"},
      {"id": "dislike", "name": "討厭", "position": "column_3", "max_cards": 20}
    ]
  },
  "validation": {
    "min_per_zone": {"like": 1, "dislike": 1}
  }
}
```

## API 流程設計

### 1. 創建房間時選擇規則

```typescript
POST /api/rooms
{
  name: "張小明職涯諮詢",
  game_rule_id: "uuid-of-career-template"
}
```

### 2. 房間載入時獲取完整配置

```typescript
GET /api/rooms/:id/game-config
Response: {
  rule: GameRuleTemplate,
  deck: OfficialDeck,
  cards: Card[]
}
```

### 3. 牌卡操作驗證

```typescript
POST /api/card-events/
{
  room_id: "room-uuid",
  event_type: "card_arranged",
  card_key: "career_001",
  event_data: {
    drop_zone: "advantage",
    position: {x: 100, y: 200}
  }
}
// 後端自動驗證是否符合該房間的規則限制
```

## 實現優勢

1. **規則與內容分離** - 規則固定，牌卡可替換
2. **配置驅動** - 新規則只需加配置，不需改代碼
3. **驗證自動化** - 後端自動驗證操作合法性
4. **未來擴展** - 保留用戶自定義牌卡接口

## 遷移策略

1. 創建新表結構
2. 插入3套官方規則和牌組
3. 現有房間默認使用「職能盤點卡」
4. 前端UI增加規則選擇器
