# Career Creator - 卡牌上架待辦事項

> 最後更新：2026-01-14

## 📦 卡牌上架總覽

| 牌組 | 總數 | 已上傳 GCS | JSON 整合 | 狀態 |
|------|------|-----------|----------|------|
| RIASEC 六大性格說明卡 | 6 | ✅ 36 files | ✅ | 完成 |
| 職業收藏家（職游旅人卡）| 100 | ⏳ 0 files | ✅ | 待上傳 |
| 職能盤點卡 | 52 | ⏳ 0 files | ⚠️ 10 張測試 | 待補充 |
| 價值導航卡 | 36 | ⏳ 0 files | ✅ | 待補充圖片 |
| 策略行動卡 | 24 | ⏳ 0 files | ✅ | 待補充圖片 |

---

## 🎯 Phase 1: 職業收藏家 100 張卡片上傳（優先）

### ✅ 準備工作
- [x] 檢查本地圖片檔案（`card-image/profession-collector-*.png`）
- [x] 驗證 JSON 資料完整性（`career-cards.json`）
- [x] 確認命名規範正確（`profession-collector-{id}-L-front-zhtw.png`）

### ⏳ 待執行
- [ ] **上傳到 GCS**
  ```bash
  cd card-image
  gsutil -m cp profession-collector-*-L-front-zhtw.png gs://career-creator-assets/cards/
  ```

- [ ] **設定公開讀取權限**
  ```bash
  gsutil -m acl ch -u AllUsers:R gs://career-creator-assets/cards/profession-collector-*.png
  ```

- [ ] **驗證上傳結果**
  ```bash
  gsutil ls gs://career-creator-assets/cards/ | grep profession-collector | wc -l
  # 預期：100
  ```

- [ ] **測試前端顯示**
  - 啟動開發伺服器
  - 測試職業收藏家模式
  - 確認圖片載入正常

- [ ] **更新文件**
  - 更新 `README.md` 上架狀態
  - 更新 `cards/README.md` 已整合清單

---

## 🎯 Phase 2: 職能盤點卡 52 張（次要）

### 準備工作
- [ ] **確認圖片檔案**
  - 取得設計師提供的 52 張圖片
  - 確認尺寸規格（L: 440px）
  - 檢查是否需要正反面

- [ ] **命名規範處理**
  - 建立批次重命名腳本 `rename-skill-cards.sh`
  - 格式：`skill-inventory-{id}-L-front-zhtw.png`
  - 執行重命名

- [ ] **更新 JSON 資料**
  - 補充缺少的 42 張卡片資料
  - 新增 `imageUrl` 欄位
  - 驗證資料完整性

### 上傳流程
- [ ] 上傳到 GCS
- [ ] 設定公開權限
- [ ] 驗證 URL 可存取
- [ ] 測試前端顯示

---

## 🎯 Phase 3: 價值導航卡 36 張

### 準備工作
- [ ] **取得設計檔案**
  - 確認是否有設計稿
  - 確認尺寸規格
  - 確認單面/雙面需求

- [ ] **設計/製作圖片**
  - 如無現有圖片，需要設計
  - 或使用 emoji + 文字卡片樣式
  - 產出 36 張圖片

- [ ] **命名與上傳**
  - 建立重命名腳本
  - 格式：`value-navigation-{id}-L-front-zhtw.png`
  - 上傳 GCS

- [ ] **JSON 整合**
  - 更新 `imageUrl` 欄位
  - 測試顯示

---

## 🎯 Phase 4: 策略行動卡 24 張

### 準備工作
- [ ] **取得設計檔案**
  - 確認設計規格
  - 確認內容需求

- [ ] **製作圖片**
  - 產出 24 張卡片圖片
  - 確保符合命名規範

- [ ] **上傳與整合**
  - 格式：`action-strategy-{id}-L-front-zhtw.png`
  - 上傳 GCS
  - 更新 JSON
  - 測試顯示

---

## 🛠️ 工具與腳本

### 現有工具
- ✅ `rename.sh` - RIASEC 卡片重命名
- ✅ `rename-profession.sh` - 職業收藏家重命名
- ✅ `GCS_UPLOAD.md` - GCS 上傳指南

### 待建立工具
- [ ] `rename-skill-cards.sh` - 職能盤點卡重命名
- [ ] `rename-value-cards.sh` - 價值導航卡重命名
- [ ] `rename-action-cards.sh` - 策略行動卡重命名
- [ ] `batch-upload.sh` - 批次上傳所有卡片
- [ ] `verify-gcs.sh` - 驗證 GCS 上傳狀態

---

## 📝 檢查清單（每個牌組完成後）

- [ ] GCS 上傳成功
- [ ] 公開權限設定完成
- [ ] URL 可正常存取
- [ ] JSON 資料已更新
- [ ] Frontend 測試通過
- [ ] README 文件已更新
- [ ] Git commit 變更

---

## 🚀 快速指令參考

```bash
# 1. 上傳單一牌組
gsutil -m cp {deck}-*.png gs://career-creator-assets/cards/

# 2. 設定公開權限
gsutil -m acl ch -u AllUsers:R gs://career-creator-assets/cards/{deck}-*.png

# 3. 驗證上傳
gsutil ls gs://career-creator-assets/cards/ | grep {deck}

# 4. 測試 URL
curl -I https://storage.googleapis.com/career-creator-assets/cards/{file}.png
```

---

## 📊 進度追蹤

### 本週目標
- [ ] 完成 Phase 1（職業收藏家 100 張）

### 下週目標
- [ ] 取得職能盤點卡設計檔案
- [ ] 規劃價值導航卡設計需求

---

## 🔗 相關文件

- [GCS 上傳指南](card-image/GCS_UPLOAD.md)
- [卡片資料格式](frontend/src/game-modes/data/cards/README.md)
- [Card Loader Service](frontend/src/game-modes/services/card-loader.service.ts)
