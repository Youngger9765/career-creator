# Card Image Integration Complete

## ✅ 完成項目

### 1. 檔案命名規範

**最終格式**: `{deck}-{card}-{size}-{side}-{lang}.png`

```text
personality-riasec-artistic-L-front-zhtw.png
personality-riasec-realistic-M-back-en.png
value-navigation-family-L-front-zhtw.png
```

- **Separator**: 全部使用 dash (-)
- **Language Code**: zhtw (繁體中文), en, ja, ko

### 2. GCS 資源

**Bucket**: `gs://career-creator-assets/cards/`

**Public URL**: `https://storage.googleapis.com/career-creator-assets/cards/`

**已上傳**: 12 files (6 RIASEC cards × 2 sides × L size × zhtw)

### 3. 前端整合

#### 檔案結構

```text
frontend/src/
├── data/
│   └── card-assets.json                    # 資產配置
├── lib/
│   ├── card-asset-manager.ts               # URL 管理工具
│   └── card-asset-manager.example.tsx      # 使用範例
└── game-modes/
    ├── data/cards/
    │   ├── riasec-cards.json               # RIASEC 卡片資料 (含 GCS URLs)
    │   ├── career-cards.json               # Placeholder
    │   ├── skill-cards.json                # Placeholder
    │   ├── value-cards.json                # Placeholder
    │   ├── action-cards.json               # Placeholder
    │   └── README.md                       # 卡片資料說明
    └── services/
        └── card-loader.service.ts          # 已更新支援 imageUrl
```

#### TypeScript Interface 更新

```typescript
// Card interface 新增 imageUrl 支援
export interface Card {
  id: string;
  title: string;
  description: string;
  category?: string;
  icon?: string;
  imageUrl?: string | { front: string; back: string }; // ✨ 新增
  [key: string]: any;
}
```

---

## 🎯 使用方式

### 方式 1: 直接使用 card-asset-manager (推薦)

```typescript
import { getCardImageUrl, getCardBothSides } from '@/lib/card-asset-manager';

// 取得單張圖片 URL
const url = getCardImageUrl({
  deck: 'personality-riasec',
  card: 'artistic',
  size: 'L',
  side: 'front',
  lang: 'zhtw'
});

// 取得雙面圖片
const { front, back } = getCardBothSides('personality-riasec', 'artistic', 'L', 'zhtw');
```

### 方式 2: 透過 CardLoaderService

```typescript
import { CardLoaderService } from '@/game-modes/services/card-loader.service';

// 載入 RIASEC 牌組
const deck = await CardLoaderService.getDeck('riasec_explanation');

// 取得卡片
const card = deck.cards.find(c => c.id === 'riasec-artistic');

// 使用圖片 URL
if (typeof card.imageUrl === 'object') {
  <img src={card.imageUrl.front} />  // 正面
  <img src={card.imageUrl.back} />   // 背面
}
```

---

## 📋 RIASEC 卡片列表

| ID | Title | Front URL | Back URL |
|----|-------|-----------|----------|
| riasec-realistic | 實作型 (R) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-realistic-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-realistic-L-back-zhtw.png) |
| riasec-investigative | 研究型 (I) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-investigative-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-investigative-L-back-zhtw.png) |
| riasec-artistic | 藝術型 (A) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-back-zhtw.png) |
| riasec-social | 社會型 (S) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-social-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-social-L-back-zhtw.png) |
| riasec-enterprising | 企業型 (E) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-enterprising-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-enterprising-L-back-zhtw.png) |
| riasec-conventional | 事務型 (C) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-conventional-L-front-zhtw.png) | [Link](https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-conventional-L-back-zhtw.png) |

---

## 🚀 未來擴充

### 新增 M/S 尺寸

```bash
# 1. 產生並重新命名圖片
mv card_M_artistic_front.png personality-riasec-artistic-M-front-zhtw.png

# 2. 上傳到 GCS
gsutil -m cp personality-riasec-*-M-*.png gs://career-creator-assets/cards/

# 3. 更新 card-assets.json availability
{
  "M": {
    "zhtw": {
      "front": true,
      "back": true
    }
  }
}
```

### 新增英文版

```bash
# 1. 上傳英文版圖片
gsutil -m cp personality-riasec-*-en.png gs://career-creator-assets/cards/

# 2. 更新 availability
{
  "L": {
    "en": {
      "front": true,
      "back": true
    }
  }
}
```

### 新增其他牌組（價值導航卡、職能盤點卡）

```bash
# 1. 按命名規範命名
value-navigation-family-L-front-zhtw.png
skill-inventory-communication-L-front-zhtw.png

# 2. 上傳 GCS
gsutil -m cp value-navigation-*.png gs://career-creator-assets/cards/
gsutil -m cp skill-inventory-*.png gs://career-creator-assets/cards/

# 3. 建立對應的 JSON 資料檔案
frontend/src/game-modes/data/cards/value-navigation-cards.json
frontend/src/game-modes/data/cards/skill-inventory-cards.json

# 4. 更新 card-assets.json
```

---

## 📝 檔案清單

### Card Image (本地)

- [x] `card-image/rename.sh` - 重新命名腳本
- [x] `card-image/GCS_UPLOAD.md` - 上傳指南
- [x] `card-image/personality-riasec-*-zhtw.png` (12 files)

### Frontend Code

- [x] `frontend/src/data/card-assets.json` - 資產配置
- [x] `frontend/src/lib/card-asset-manager.ts` - URL 管理
- [x] `frontend/src/lib/card-asset-manager.example.tsx` - 使用範例
- [x] `frontend/src/game-modes/data/cards/riasec-cards.json` - RIASEC 資料
- [x] `frontend/src/game-modes/data/cards/README.md` - 卡片資料說明
- [x] `frontend/src/game-modes/services/card-loader.service.ts` - 更新支援 imageUrl

### Documentation

- [x] `CARD_INTEGRATION.md` (本檔案) - 整合總覽

---

**整合完成時間**: 2025-11-04
**語言碼**: zhtw (繁體中文)
**GCS Bucket**: career-creator-assets
**已驗證**: ✅ 所有 URL 可正常訪問 (HTTP 200)
