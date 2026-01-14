# 卡牌上傳標準作業流程 (SOP)

> 最後更新：2026-01-14

## 📋 目錄
- [卡牌格式規範](#卡牌格式規範)
- [上傳流程](#上傳流程)
- [JSON 結構標準](#json-結構標準)
- [檢查清單](#檢查清單)

---

## 🎯 卡牌格式規範

### 檔名規範

```
{deck-type}-{id}-{size}-{side}-{lang}.png
```

**範例**：
- `value-navigation-01-L-front-zhtw.png`
- `profession-collector-100-L-front-zhtw.png`
- `personality-riasec-realistic-M-back-zhtw.png`

**參數說明**：
- `{deck-type}`: 牌組類型（見下表）
- `{id}`: 卡片編號（2位數補0，如 01, 10, 100）
- `{size}`: 尺寸（L/M/S）
- `{side}`: 面（front/back）
- `{lang}`: 語言（zhtw）

### 牌組類型對照表

| 牌組名稱 | deck-type | 單/雙面 | 尺寸 | 數量 |
|---------|-----------|---------|------|------|
| RIASEC 性格卡 | `personality-riasec-{type}` | 雙面 | L/M/S | 6 張 |
| 職業收藏家 | `profession-collector` | 單面 | L | 100 張 |
| 價值導航卡 | `value-navigation` | 雙面 | L | 70 張 |
| 職能盤點卡 | `skill-inventory` | 雙面 | L | 52 張 |
| 策略行動卡 | `action-strategy` | 單面 | L | 24 張 |

---

## 🔄 上傳流程（6 步驟）

### Step 1: 檢查原始檔案

```bash
cd card-image

# 確認資料夾結構
ls -la "價值導航卡 價值觀排序/"
ls -la "職能盤點卡 成長規劃/"

# 計算檔案數量
find "價值導航卡 價值觀排序/L型卡片" -name "*.png" | wc -l
```

**檢查項目**：
- [ ] 資料夾存在
- [ ] 檔案數量正確
- [ ] 檔案命名一致

---

### Step 2: 執行 Rename 腳本

**使用現有腳本**：
```bash
# 價值導航卡
./rename-value-cards.sh

# 職業收藏家（已完成）
./rename-profession.sh

# RIASEC（已完成）
./rename.sh
```

**或建立新腳本**：

```bash
cat > rename-{deck-type}.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Renaming {deck-name} cards..."

cd "$(dirname "$0")"
count=0

# 處理 L 尺寸卡片
cd "{folder-path}/L型卡片"

for file in {original-pattern}; do
  if [ -f "$file" ]; then
    # 提取編號和面
    num=$(echo "$file" | sed 's/{pattern}/\1/')
    side=$(echo "$file" | sed 's/{pattern}/\2/')

    new_name="{deck-type}-${num}-L-${side}-zhtw.png"

    if [ "$file" != "$new_name" ]; then
      mv "$file" "$new_name"
      echo "✓ $file → $new_name"
      ((count++))
    fi
  fi
done

echo "✅ Rename complete! Total renamed: $count files"
EOF

chmod +x rename-{deck-type}.sh
```

---

### Step 3: 驗證 Rename 結果

```bash
# 檢查檔名格式
ls "{folder}/L型卡片/" | grep "{deck-type}" | head -5

# 計算數量
ls "{folder}/L型卡片/" | grep "{deck-type}" | wc -l

# 清理重複檔案（如有）
find "{folder}" -name "*\(1\)*" -type f -delete
```

---

### Step 4: 上傳到 GCS

**前置作業：GCP 認證**

```bash
# 切換到正確的 GCP 配置
gcloud config configurations activate career-creator

# 如需重新認證
gcloud auth login dev02@careercreator.tw

# 確認配置
gcloud config list
```

**上傳指令**：

```bash
# 單一牌組上傳
gsutil -m cp "{folder}/L型卡片/{deck-type}-*-L-*-zhtw.png" \
  gs://career-creator-assets/cards/

# 驗證上傳數量
gsutil ls gs://career-creator-assets/cards/ | grep "{deck-type}" | wc -l
```

**設定公開權限**（bucket 已預設公開，通常不需要）：

```bash
# 如需設定個別檔案權限
gsutil -m acl ch -u AllUsers:R \
  gs://career-creator-assets/cards/{deck-type}-*.png
```

---

### Step 5: 建立/更新 JSON

#### 5.1 讀取卡片圖片內容

使用 Claude 讀取卡片圖片，提取標題和描述。

#### 5.2 JSON 結構範本

**雙面卡片**（價值卡、RIASEC、職能卡）：

```json
{
  "deck": {
    "id": "{deck_id}",
    "name": "{牌組名稱}",
    "description": "{牌組描述}",
    "type": "main",
    "version": "1.0.0"
  },
  "cards": [
    {
      "id": "{card_id}",
      "title": "{卡片標題}",
      "category": "{分類}",
      "description": "{卡片描述}",
      "imageUrl": {
        "L": {
          "front": "https://storage.googleapis.com/career-creator-assets/cards/{deck-type}-{id}-L-front-zhtw.png",
          "back": "https://storage.googleapis.com/career-creator-assets/cards/{deck-type}-{id}-L-back-zhtw.png"
        }
      }
    }
  ]
}
```

**單面卡片**（職業收藏家、行動策略）：

```json
{
  "imageUrl": {
    "L": {
      "front": "https://storage.googleapis.com/career-creator-assets/cards/{deck-type}-{id}-L-front-zhtw.png"
    }
  }
}
```

**多尺寸卡片**（RIASEC）：

```json
{
  "imageUrl": {
    "L": {
      "front": "https://...L-front-zhtw.png",
      "back": "https://...L-back-zhtw.png"
    },
    "M": {
      "front": "https://...M-front-zhtw.png",
      "back": "https://...M-back-zhtw.png"
    },
    "S": {
      "front": "https://...S-front-zhtw.png",
      "back": "https://...S-back-zhtw.png"
    }
  }
}
```

#### 5.3 自動生成 JSON

```javascript
// generate-card-json.js
const fs = require('fs');

const deckConfig = {
  id: 'value_cards_70',
  name: '價值導航卡',
  description: '70張核心人生價值觀卡片',
  type: 'main',
  version: '2.0.0',
  deckType: 'value-navigation',
  count: 70,
  hasBothSides: true,
  sizes: ['L']  // or ['L', 'M', 'S']
};

const cards = [];

for (let i = 1; i <= deckConfig.count; i++) {
  const id = String(i).padStart(3, '0');
  const numId = String(i).padStart(2, '0');

  const imageUrl = {};

  deckConfig.sizes.forEach(size => {
    imageUrl[size] = {
      front: `https://storage.googleapis.com/career-creator-assets/cards/${deckConfig.deckType}-${numId}-${size}-front-zhtw.png`
    };

    if (deckConfig.hasBothSides) {
      imageUrl[size].back = `https://storage.googleapis.com/career-creator-assets/cards/${deckConfig.deckType}-${numId}-${size}-back-zhtw.png`;
    }
  });

  cards.push({
    id: `${deckConfig.id.split('_')[0]}_${id}`,
    title: `卡片 ${i}`,  // 需要從圖片讀取
    category: 'uncategorized',  // 需要從圖片讀取
    description: '',  // 需要從圖片讀取
    imageUrl
  });
}

const output = {
  deck: {
    id: deckConfig.id,
    name: deckConfig.name,
    description: deckConfig.description,
    type: deckConfig.type,
    version: deckConfig.version
  },
  cards
};

fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
console.log(`✅ Generated ${cards.length} cards`);
```

---

### Step 6: 驗證完整性

```bash
# 1. 驗證 JSON 格式
cat {deck}.json | jq '.' > /dev/null && echo "✅ JSON 格式正確"

# 2. 驗證卡片數量
cat {deck}.json | jq '.cards | length'

# 3. 測試 URL 可訪問性
curl -I "https://storage.googleapis.com/career-creator-assets/cards/{deck-type}-01-L-front-zhtw.png" | grep "HTTP"

# 4. 批次測試多張卡片
for i in 01 10 {last-num}; do
  echo "Testing card $i:"
  curl -I "https://storage.googleapis.com/career-creator-assets/cards/{deck-type}-${i}-L-front-zhtw.png" 2>&1 | grep "HTTP"
done
```

---

## ✅ 檢查清單

### Rename 階段
- [ ] 檔名格式符合規範
- [ ] 檔案數量正確
- [ ] 無重複檔案
- [ ] 無特殊字元

### GCS 上傳階段
- [ ] GCP 認證完成
- [ ] 上傳數量與本地一致
- [ ] URL 可公開訪問
- [ ] 測試 3-5 張卡片 URL

### JSON 階段
- [ ] JSON 格式驗證通過
- [ ] 卡片數量正確
- [ ] imageUrl 結構正確
- [ ] 單/雙面設定正確
- [ ] 所有 URL 可訪問

### 最終檢查
- [ ] Frontend 可正常載入
- [ ] 圖片顯示正確
- [ ] 無 404 錯誤
- [ ] README 已更新

---

## 🔧 常見問題

### Q1: 檔名編號格式不一致怎麼辦？

**範例問題**：`value_01.png` vs `value_001.png`

**解決方案**：
```bash
# 統一轉換為 2 位數
for file in value_*.png; do
  num=$(echo "$file" | grep -o '[0-9]\+')
  padded=$(printf "%02d" $num)
  new_name="value-navigation-${padded}-L-front-zhtw.png"
  mv "$file" "$new_name"
done
```

### Q2: GCS 上傳失敗

**錯誤**：`403 Forbidden` 或 `401 Unauthorized`

**解決**：
```bash
# 重新認證
gcloud auth login dev02@careercreator.tw

# 確認專案
gcloud config set project career-creator-card

# 重試上傳
gsutil -m cp *.png gs://career-creator-assets/cards/
```

### Q3: JSON imageUrl 格式錯誤

**錯誤**：`value-navigation-001-L-front` 應為 `value-navigation-01-L-front`

**解決**：使用 Node.js 批次修正（見 Step 5.3）

---

## 📚 參考文件

- GCS Upload Guide: `card-image/GCS_UPLOAD.md`
- Card Loader Service: `frontend/src/game-modes/services/card-loader.service.ts`
- Types Definition: `frontend/src/types/cards.ts`

---

**Created**: 2026-01-14
**Author**: Claude + Young
**Version**: 1.0.0
