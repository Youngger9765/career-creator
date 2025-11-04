# Card Data Files

這個目錄包含所有牌卡的 JSON 資料檔案。

## 📁 檔案結構

```text
cards/
├── riasec-cards.json      # RIASEC 六大性格說明卡（已整合 GCS 圖片）
├── career-cards.json      # 職游旅人卡（100張，待補充）
├── skill-cards.json       # 職能盤點卡（52張，待補充）
├── value-cards.json       # 價值導航卡（36張，待補充）
└── action-cards.json      # 行動方案卡（24張，待補充）
```

## 🎴 Card JSON 格式

### 基本格式

```json
{
  "deck": {
    "id": "deck_id",
    "name": "牌組名稱",
    "description": "牌組描述",
    "type": "main | auxiliary | explanation",
    "version": "1.0.0"
  },
  "cards": [
    {
      "id": "card-id",
      "title": "卡片標題",
      "description": "卡片描述",
      "category": "分類",
      "imageUrl": "單張圖片URL"
    }
  ]
}
```

### 雙面卡片格式（RIASEC 範例）

```json
{
  "id": "riasec-artistic",
  "title": "藝術型 (Artistic)",
  "description": "喜歡創作、設計和藝術表現...",
  "category": "personality",
  "imageUrl": {
    "front": "https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-front-zhtw.png",
    "back": "https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-back-zhtw.png"
  }
}
```

## 🖼️ 圖片 URL 規範

所有圖片存放在 GCS：`https://storage.googleapis.com/career-creator-assets/cards/`

### 檔名格式

```text
{deck}-{card}-{size}-{side}-{lang}.png

範例：
personality-riasec-artistic-L-front-zhtw.png
value-navigation-family-M-back-en.png
```

### 參數說明

- **deck**: 牌組ID（personality-riasec, value-navigation, skill-inventory）
- **card**: 卡片ID（artistic, realistic, family, etc.）
- **size**: L (440px) | M (300px) | S (150px)
- **side**: front | back
- **lang**: zh | en | ja | ko

## 📝 使用方式

### 1. 透過 CardLoaderService

```typescript
import { CardLoaderService } from '@/game-modes/services/card-loader.service';

// 取得 RIASEC 牌組
const riasecDeck = await CardLoaderService.getDeck('riasec_explanation');

// 取得單張卡片
const card = riasecDeck.cards.find((c) => c.id === 'riasec-artistic');

// 使用圖片
if (typeof card.imageUrl === 'object') {
  console.log(card.imageUrl.front); // 正面圖片
  console.log(card.imageUrl.back); // 背面圖片
}
```

### 2. 透過 card-asset-manager (推薦)

```typescript
import { getCardImageUrl, getCardBothSides } from '@/lib/card-asset-manager';

// 方式 1: 直接生成 URL
const url = getCardImageUrl({
  deck: 'personality-riasec',
  card: 'artistic',
  size: 'L',
  side: 'front',
  lang: 'zh',
});

// 方式 2: 取得雙面
const { front, back } = getCardBothSides('personality-riasec', 'artistic');
```

## ✅ 已整合牌組

- [x] **RIASEC 六大性格說明卡** (6張，含 GCS 圖片)

## ⏳ 待補充牌組

- [ ] **職游旅人卡** (100張)
- [ ] **職能盤點卡** (52張)
- [ ] **價值導航卡** (36張)
- [ ] **行動方案卡** (24張)

## 🔄 更新流程

1. 設計師提供新圖片
2. 按照命名規範重新命名
3. 上傳到 GCS: `gsutil -m cp *.png gs://career-creator-assets/cards/`
4. 更新對應的 JSON 檔案
5. 更新 `card-assets.json` 的 availability

## 📚 相關文件

- [Card Asset Manager](../../../lib/card-asset-manager.ts) - 圖片 URL 管理
- [Card Loader Service](../../services/card-loader.service.ts) - 牌卡資料載入
- [GCS Upload Guide](../../../../../card-image/GCS_UPLOAD.md) - GCS 上傳指南
