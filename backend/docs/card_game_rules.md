# 牌卡遊戲規則設計

## 職游旅人卡 - 六大性格分析

### 規則概述

- **牌組構成**: 解釋卡6張 + 職業卡100張
- **操作區域**: 三列分類區
- **分類標準**: 喜歡 / 中立 / 討厭

### 遊戲流程

1. **準備階段**: 諮詢師展示6張解釋卡，說明六大性格類型
2. **探索階段**: 來訪者從100張職業卡中選擇並分類
3. **討論階段**: 針對「喜歡」和「討厭」的職業深入對話
4. **總結階段**: 分析性格偏好與職涯方向的關聯

### 分類邏輯

```typescript
type CategoryType = 'like' | 'neutral' | 'dislike';

interface DropZoneRule {
  zone: CategoryType;
  displayName: string;
  description: string;
  maxCards?: number; // 可選：限制每區最大牌數
}

const CAREER_GAME_ZONES: DropZoneRule[] = [
  {
    zone: 'like',
    displayName: '喜歡',
    description: '感興趣、想嘗試的職業',
    maxCards: 20
  },
  {
    zone: 'neutral',
    displayName: '中立',
    description: '沒有特別感覺的職業'
  },
  {
    zone: 'dislike',
    displayName: '討厭',
    description: '不感興趣、不想從事的職業',
    maxCards: 20
  }
];
```

### 與現有系統整合

```json
{
  "event_type": "card_arranged",
  "event_data": {
    "drop_zone": "like",  // "like" | "neutral" | "dislike"
    "game_type": "career_personality",
    "position": {"x": 200, "y": 100}
  }
}
```

### 分析價值

- **喜歡區**: 發現職涯興趣點，探索動機
- **討厭區**: 識別職涯地雷，避免誤入
- **中立區**: 潛在機會，可能需要更多了解

### UI 設計建議

```
┌─────────────────────────────────────────┐
│  解釋卡區 (6張)                          │
│  [R] [I] [A] [S] [E] [C]                │
├─────────────────────────────────────────┤
│  ┌─────────┐   ┌─────────┐   ┌─────────┐│
│  │  喜歡   │   │  中立   │   │  討厭   ││
│  │  😍     │   │  😐     │   │  😤     ││
│  │ (0/20)  │   │  (無限)   │   │ (0/20)  ││
│  └─────────┘   └─────────┘   └─────────┘│
├─────────────────────────────────────────┤
│  職業卡牌組 (100張)                      │
│  [軟體工程師] [醫生] [老師] ...           │
└─────────────────────────────────────────┘
```
