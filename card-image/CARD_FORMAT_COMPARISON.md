# 卡牌格式比較表

> 快速參考：各牌組 JSON 格式差異

## 📊 格式對照表

| 牌組 | imageUrl 結構 | 尺寸 | 面數 | 特殊欄位 |
|------|--------------|------|------|---------|
| **RIASEC 性格卡** | `L/M/S` → `front/back` | 3種 | 雙面 | `riasecCode`, `traits` |
| **職業收藏家** | `L` → `front` only | 1種 | 單面 | `academic_group`, `riasec_codes` |
| **價值導航卡** | `L` → `front/back` | 1種 | 雙面 | `category` (12類) |
| **職能盤點卡** | 🚧 待補充 | 1種 | 雙面 | `level`, `time_to_develop` |
| **策略行動卡** | 🚧 待補充 | 1種 | 單面 | `duration`, `difficulty`, `cost` |

---

## 1. RIASEC 性格卡（完整範本）

**特點**：最完整，三種尺寸 + 雙面

```json
{
  "id": "riasec-realistic",
  "deck_id": "riasec_explanation",
  "key": "realistic",
  "title": "實踐者 (Realistic)",
  "description": "喜歡實際動手操作...",
  "category": "personality",
  "riasecCode": "R",
  "traits": ["務實", "動手能力強", "喜歡具體成果"],
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/.../realistic-L-front-zhtw.png",
      "back": "https://storage.googleapis.com/.../realistic-L-back-zhtw.png"
    },
    "M": {
      "front": "https://storage.googleapis.com/.../realistic-M-front-zhtw.png",
      "back": "https://storage.googleapis.com/.../realistic-M-back-zhtw.png"
    },
    "S": {
      "front": "https://storage.googleapis.com/.../realistic-S-front-zhtw.png",
      "back": "https://storage.googleapis.com/.../realistic-S-back-zhtw.png"
    }
  }
}
```

**檔名範例**：
- `personality-riasec-realistic-L-front-zhtw.png`
- `personality-riasec-artistic-M-back-zhtw.png`

---

## 2. 職業收藏家（單面範本）

**特點**：單一尺寸 + 單面 + 職業資訊

```json
{
  "id": "career_001",
  "deck_id": "profession-collector",
  "title": "幼教老師",
  "description": "負責教導幼兒知識與課程...",
  "category": "profession",
  "academic_group": "教育學群",
  "riasec_codes": ["S", "A"],
  "knowledge": ["顧客服務", "教育訓練", "語文文學"],
  "work_activities": ["建立整伴關係", "教導與協助個人發展"],
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/.../profession-collector-01-L-front-zhtw.png"
    }
  }
}
```

**檔名範例**：
- `profession-collector-01-L-front-zhtw.png`
- `profession-collector-100-L-front-zhtw.png`

**注意**：沒有 `back`（單面卡）

---

## 3. 價值導航卡（標準雙面）

**特點**：單一尺寸 + 雙面 + 12 種分類

```json
{
  "id": "value_001",
  "title": "享受生活、美食等休閒娛樂",
  "category": "lifestyle",
  "description": "追求生活品質，享受美食與各種休閒娛樂活動",
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/.../value-navigation-01-L-front-zhtw.png",
      "back": "https://storage.googleapis.com/.../value-navigation-01-L-back-zhtw.png"
    }
  }
}
```

**分類清單**（12 種）：
- `lifestyle` - 生活方式
- `personal` - 個人成長
- `wellbeing` - 身心健康
- `values` - 價值觀
- `social` - 社會關懷
- `relationships` - 人際關係
- `work` - 工作
- `achievement` - 成就
- `growth` - 成長發展
- `material` - 物質
- `contribution` - 貢獻
- `spiritual` - 靈性

**檔名範例**：
- `value-navigation-01-L-front-zhtw.png`
- `value-navigation-70-L-back-zhtw.png`

---

## 4. 職能盤點卡（待整合）

**特點**：雙面 + 技能類型 + 學習資源

```json
{
  "id": "skill_001",
  "title": "程式設計",
  "description": "使用程式語言開發軟體應用程式的能力",
  "category": "hard",
  "level": "專業",
  "related_careers": ["軟體工程師", "資料科學家"],
  "learning_resources": ["線上課程", "實作專案"],
  "time_to_develop": "1-2年",
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/.../skill-inventory-01-L-front-zhtw.png",
      "back": "https://storage.googleapis.com/.../skill-inventory-01-L-back-zhtw.png"
    }
  }
}
```

**檔名範例**（建議）：
- `skill-inventory-01-L-front-zhtw.png`
- `skill-inventory-52-L-back-zhtw.png`

**目前狀態**：❌ JSON 沒有 `imageUrl`

---

## 5. 策略行動卡（待整合）

**特點**：單面 + 行動策略 + 資源需求

```json
{
  "id": "action_001",
  "title": "線上課程學習",
  "description": "參與線上課程平台系統性學習新技能",
  "category": "learning",
  "duration": "3-6個月",
  "difficulty": "簡單",
  "cost": "低",
  "resources": ["電腦", "網路", "時間規劃"],
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/.../action-strategy-01-L-front-zhtw.png"
    }
  }
}
```

**檔名範例**（建議）：
- `action-strategy-01-L-front-zhtw.png`
- `action-strategy-24-L-front-zhtw.png`

**目前狀態**：❌ JSON 沒有 `imageUrl`

---

## 🔄 統一規則

### 檔名規範

```
{deck-type}-{id}-{size}-{side}-{lang}.png
```

### imageUrl 結構規範

**單尺寸雙面**（標準）：
```json
{
  "imageUrl": {
    "L": {
      "front": "...",
      "back": "..."
    }
  }
}
```

**單尺寸單面**：
```json
{
  "imageUrl": {
    "L": {
      "front": "..."
    }
  }
}
```

**多尺寸雙面**：
```json
{
  "imageUrl": {
    "L": { "front": "...", "back": "..." },
    "M": { "front": "...", "back": "..." },
    "S": { "front": "...", "back": "..." }
  }
}
```

---

## ⚠️ 常見錯誤

### 錯誤 1：編號格式不一致

❌ **錯誤**：
```json
"front": ".../value-navigation-001-L-front-zhtw.png"  // 3位數
```

✅ **正確**：
```json
"front": ".../value-navigation-01-L-front-zhtw.png"   // 2位數
```

### 錯誤 2：忘記雙面結構

❌ **錯誤**（價值卡應該有背面）：
```json
{
  "imageUrl": {
    "L": {
      "front": "..."
    }
  }
}
```

✅ **正確**：
```json
{
  "imageUrl": {
    "L": {
      "front": "...",
      "back": "..."
    }
  }
}
```

### 錯誤 3：URL 路徑錯誤

❌ **錯誤**：
```
https://storage.googleapis.com/career-creator/cards/...
```

✅ **正確**：
```
https://storage.googleapis.com/career-creator-assets/cards/...
```

---

## 📋 快速檢查清單

- [ ] 檔名格式符合 `{deck-type}-{id}-{size}-{side}-{lang}.png`
- [ ] 編號補0正確（2位數：01-99，3位數：100）
- [ ] 單/雙面設定正確
- [ ] imageUrl 結構符合牌組類型
- [ ] GCS bucket 名稱正確（`career-creator-assets`）
- [ ] 所有 URL 可訪問（HTTP 200）

---

**Updated**: 2026-01-14
**Reference**: `CARD_UPLOAD_SOP.md`
