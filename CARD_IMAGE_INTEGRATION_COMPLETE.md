# ✅ Card Image Integration - Complete

## 📦 整合完成時間

2025-11-04

## 🎯 完成項目

### 1. ✅ 圖片資源建立

- **命名規範**: `{deck}-{card}-{size}-{side}-{lang}.png`
- **GCS 位置**: `gs://career-creator-assets/cards/`
- **已上傳**: 12 files (RIASEC 6 cards × 2 sides × L size × zhtw)
- **Public URL**: `https://storage.googleapis.com/career-creator-assets/cards/`

### 2. ✅ 資料結構建立

- `frontend/src/data/card-assets.json` - 資產配置
- `frontend/src/lib/card-asset-manager.ts` - URL 管理工具
- `frontend/src/game-modes/data/cards/riasec-cards.json` - RIASEC 卡片資料（含 imageUrl）

### 3. ✅ 前端組件更新

- **Card.tsx** - 支援 imageUrl 顯示 + graceful fallback
  - 有圖片 → 顯示圖片
  - 無圖片 → fallback 到文字版面
  - 支援雙面卡片（front/back）
  - 圖片載入狀態處理
  - 錯誤處理（onError fallback）

### 4. ✅ 語言碼更新

- 從 `zh` 統一改為 `zhtw` (繁體中文)

---

## 🎮 可用功能

### 「六大性格分析」遊戲

- **路徑**: PersonalityAnalysisGame
- **牌組**: `riasec_explanation` (6張)
- **狀態**: ✅ 可顯示圖片

**RIASEC 6張卡片**:

1. ✅ 實作型 (Realistic) - R
2. ✅ 研究型 (Investigative) - I
3. ✅ 藝術型 (Artistic) - A
4. ✅ 社會型 (Social) - S
5. ✅ 企業型 (Enterprising) - E
6. ✅ 事務型 (Conventional) - C

---

## 📊 其他遊戲狀態

| 遊戲 | 牌組 | 圖片狀態 | 顯示模式 |
|------|------|---------|---------|
| 職業收藏家 | career_cards_100 | ❌ 無 | 文字 fallback |
| 優劣勢分析 | skill_cards_52 | ❌ 無 | 文字 fallback |
| 成長計畫 | skill_cards_52 | ❌ 無 | 文字 fallback |
| 職位拆解 | skill_cards_52 | ❌ 無 | 文字 fallback |
| 價值觀排序 | value_cards_36 | ❌ 無 | 文字 fallback |
| 生活改造王 | value_cards_36 | ❌ 無 | 文字 fallback |

---

## 🔧 技術細節

### Card.tsx 更新重點

```typescript
// 1. 圖片載入狀態
const [imageLoadError, setImageLoadError] = useState(false);
const [imageLoading, setImageLoading] = useState(true);

// 2. 判斷是否有圖片
const hasImage = card.imageUrl && !imageLoadError;
const imageUrls = typeof card.imageUrl === 'object'
  ? card.imageUrl  // 雙面卡 {front, back}
  : { front: card.imageUrl, back: card.imageUrl }; // 單面卡

// 3. Graceful fallback
{hasImage && imageUrls.front ? (
  <img src={imageUrls.front} onError={handleImageError} />
) : (
  <TextCard />  // 文字版面
)}
```

### 支援的 imageUrl 格式

```typescript
// 格式 1: 單面卡片
{
  "id": "card-1",
  "title": "卡片標題",
  "imageUrl": "https://..."
}

// 格式 2: 雙面卡片（RIASEC）
{
  "id": "riasec-artistic",
  "title": "藝術型",
  "imageUrl": {
    "front": "https://.../front-zhtw.png",
    "back": "https://.../back-zhtw.png"
  }
}

// 格式 3: 無圖片（fallback）
{
  "id": "card-2",
  "title": "卡片標題",
  "description": "卡片描述",
  // 無 imageUrl → 顯示文字版面
}
```

---

## 🚀 未來擴充步驟

### 新增 M/S 尺寸

```bash
# 1. 重新命名圖片
mv card_M_artistic_front.png personality-riasec-artistic-M-front-zhtw.png

# 2. 上傳 GCS
gsutil -m cp personality-riasec-*-M-*.png gs://career-creator-assets/cards/

# 3. 更新 card-assets.json availability
{
  "M": {
    "zhtw": { "front": true, "back": true }
  }
}
```

### 新增其他牌組

```bash
# 1. 建立圖片（按命名規範）
value-navigation-family-L-front-zhtw.png
skill-inventory-communication-L-front-zhtw.png

# 2. 上傳 GCS
gsutil -m cp value-navigation-*.png gs://career-creator-assets/cards/

# 3. 建立 JSON 資料
frontend/src/game-modes/data/cards/value-navigation-cards.json

# 4. 更新 CardLoaderService 載入新牌組
```

---

## 📁 檔案架構

```text
project/
├── card-image/
│   ├── personality-riasec-*-zhtw.png (12 files)
│   ├── rename.sh
│   └── GCS_UPLOAD.md
├── frontend/src/
│   ├── components/
│   │   └── Card.tsx ✅ 支援 imageUrl
│   ├── data/
│   │   └── card-assets.json
│   ├── lib/
│   │   ├── card-asset-manager.ts
│   │   └── card-asset-manager.example.tsx
│   └── game-modes/
│       ├── data/cards/
│       │   ├── riasec-cards.json ✅ 含圖片 URL
│       │   ├── career-cards.json (空)
│       │   ├── skill-cards.json (空)
│       │   ├── value-cards.json (空)
│       │   └── action-cards.json (空)
│       └── services/
│           └── card-loader.service.ts ✅ 支援 imageUrl
└── CARD_INTEGRATION.md
```

---

## ✅ 驗證清單

- [x] GCS 圖片可公開訪問 (HTTP 200)
- [x] riasec-cards.json 含正確 imageUrl
- [x] Card.tsx 支援圖片顯示
- [x] Card.tsx fallback 機制正常
- [x] 圖片載入錯誤處理
- [x] 雙面卡片支援 (front/back)
- [x] 語言碼統一為 zhtw
- [ ] 實際遊戲中測試 RIASEC 顯示（待部署後驗證）

---

## 🔗 相關文件

- [Card Integration Guide](./CARD_INTEGRATION.md) - 整合指南
- [GCS Upload Guide](./card-image/GCS_UPLOAD.md) - GCS 上傳說明
- [Card Data README](./frontend/src/game-modes/data/cards/README.md) - 卡片資料說明

---

**Status**: ✅ Ready for deployment
**Next Step**: Deploy to staging and test RIASEC cards in PersonalityAnalysisGame
