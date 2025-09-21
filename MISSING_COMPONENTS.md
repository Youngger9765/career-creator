# 缺少的牌卡與畫布元件清單

Missing Cards and Canvas Components Checklist

## 📋 現況分析

### ✅ 已完成

- 基礎架構（Mode → Gameplay → Config）
- 橋接層（LegacyAdapter）
- 三個基本規則（skill_assessment, value_ranking, personality_assessment）

### ❌ 缺少的重要元件

## 1. 🃏 牌卡資料（Card Decks）

### 1.1 職游旅人卡模式

- [ ] **100張職業卡**
  - 需要：卡片ID、職業名稱、RIASEC分類、描述、圖片
  - 範例：軟體工程師(R)、護理師(S)、設計師(A)...

- [ ] **6張RIASEC解釋卡**
  - R: 實用型 (Realistic)
  - I: 研究型 (Investigative)
  - A: 藝術型 (Artistic)
  - S: 社交型 (Social)
  - E: 企業型 (Enterprising)
  - C: 傳統型 (Conventional)

### 1.2 職能盤點卡模式

- [ ] **52張職能卡**
  - 軟技能：溝通、領導、團隊合作...
  - 硬技能：程式設計、數據分析、專案管理...
  - 需要：技能名稱、類別、描述、等級

- [ ] **技能成長卡組**（成長計畫玩法）
  - 現有技能卡
  - 目標技能卡
  - 學習路徑卡

### 1.3 價值導航卡模式

- [ ] **36張核心價值卡**
  - 家庭、事業、健康、自由、成就...
  - 需要：價值名稱、描述、圖示

## 2. 🎨 畫布配置（Canvas Configurations）

### 2.1 現有畫布（需優化）

- [x] 雙區畫布（優劣勢分析）
- [x] 3x3格子（價值觀排序）
- [x] 三欄分類（六大性格）

### 2.2 缺少的畫布

- [ ] **收藏區畫布**（職業收藏家）

  ```
  單一大區域，最多15張卡片
  卡片可自由排列
  顯示收藏數量計數器
  ```

- [ ] **三區成長畫布**（成長計畫）

  ```
  左區：現有技能
  中區：學習路徑
  右區：目標技能
  支援文字註記
  ```

- [ ] **自由畫布**（職位拆解）

  ```
  大型自由排列區
  支援截圖上傳對照
  可添加連線關係
  ```

- [ ] **量表畫布**（生活改造王）🎯

  ```
  滿意度量表 (0-100)
  籌碼分配區
  視覺化顯示分配比例
  總和約束提示
  ```

## 3. 🎲 特殊機制

### 3.1 籌碼系統（生活改造王專用）

- [ ] **TokenManager 類別**

  ```typescript
  class TokenManager {
    total: 100
    allocated: Map<string, number>
    remaining: number

    allocate(area: string, amount: number): void
    transfer(from: string, to: string, amount: number): void
    validate(): boolean
    reset(): void
  }
  ```

- [ ] **籌碼UI元件**
  - 可拖曳籌碼
  - +/- 按鈕調整
  - 即時顯示剩餘
  - 分配視覺化（圓餅圖/長條圖）

### 3.2 截圖上傳（職位拆解專用）

- [ ] 圖片上傳元件
- [ ] 圖片顯示層
- [ ] 透明度調整
- [ ] 對照模式切換

## 4. �� 資料結構設計

### 4.1 牌卡資料結構

```typescript
interface CardData {
  id: string;
  title: string;
  category?: string;  // RIASEC, skill type, value type
  description: string;
  imageUrl?: string;
  metadata?: {
    level?: number;    // 技能等級
    priority?: number; // 價值優先級
    tags?: string[];   // 標籤
  };
}
```

### 4.2 畫布配置結構

```typescript
interface CanvasConfig {
  type: 'zones' | 'grid' | 'free' | 'gauge';
  layout: {
    zones?: ZoneConfig[];
    grid?: { rows: number; cols: number };
    free?: { width: number; height: number };
    gauge?: { min: number; max: number; scale: number };
  };
  features?: {
    hasTokens?: boolean;
    hasCounter?: boolean;
    hasAnnotations?: boolean;
    hasScreenshot?: boolean;
  };
  constraints?: CanvasConstraints;
}
```

## 5. 🚀 實作優先順序

### Phase 1: 核心資料（立即需要）

1. **建立JSON配置檔**
   - [ ] cards/career-cards.json (100張)
   - [ ] cards/skill-cards.json (52張)
   - [ ] cards/value-cards.json (36張)
   - [ ] cards/riasec-cards.json (6張)

2. **畫布配置檔**
   - [ ] canvas/collection-zone.json
   - [ ] canvas/growth-three-zones.json
   - [ ] canvas/free-canvas.json
   - [ ] canvas/value-gauge.json

### Phase 2: 籌碼系統（生活改造王）

- [ ] TokenManager 實作
- [ ] TokenDisplay 元件
- [ ] TokenControls 互動元件
- [ ] 測試籌碼約束邏輯

### Phase 3: 進階功能

- [ ] 截圖上傳功能
- [ ] 卡片關聯連線
- [ ] 動態註記系統
- [ ] 匯出報告功能

## 6. 📝 測試需求

### 6.1 資料完整性測試

```typescript
describe('Card Data Integrity', () => {
  it('should have 100 career cards with valid RIASEC categories', () => {
    const careerCards = loadCareerCards();
    expect(careerCards).toHaveLength(100);
    careerCards.forEach(card => {
      expect(['R','I','A','S','E','C']).toContain(card.category);
    });
  });

  it('should have unique IDs for all cards', () => {
    const allCards = [...careerCards, ...skillCards, ...valueCards];
    const ids = allCards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

### 6.2 畫布配置測試

```typescript
describe('Canvas Configuration', () => {
  it('should load correct canvas for each gameplay', () => {
    const lifeRedesign = CanvasLoader.load('life_redesign');
    expect(lifeRedesign.type).toBe('gauge');
    expect(lifeRedesign.features?.hasTokens).toBe(true);
  });
});
```

### 6.3 籌碼系統測試

```typescript
describe('Token System', () => {
  it('should enforce 100 point constraint', () => {
    const tokens = new TokenManager(100);
    tokens.allocate('health', 40);
    tokens.allocate('career', 70); // Should fail
    expect(tokens.getRemaining()).toBe(60);
  });
});
```

## 7. 🎯 下一步行動

### 立即行動（Day 1）

1. 建立牌卡資料JSON檔案
2. 實作 CardLoader 服務
3. 測試資料載入

### 短期目標（Week 1）

1. 完成所有畫布配置
2. 實作籌碼系統
3. 整合到現有UI

### 中期目標（Week 2-3）

1. 完善所有7種玩法
2. 添加動畫效果
3. 優化使用體驗

---

*這份清單列出了所有缺少的元件，優先處理核心功能*
*預估完成時間：2-3週*
