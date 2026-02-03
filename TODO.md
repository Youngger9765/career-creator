# Career Creator - 待辦事項

> 最後更新：2026-01-31

---

## 🚨 Young 負責項目（2026-02-03）

### 🐛 已修復 Bug（2026-02-03）
- [x] **GCS 403 權限錯誤** ✅ FIXED
  - Commit: `4254f12`
  - 問題：`blob.make_public()` 需要 IAM 權限，Cloud Run SA 沒有
  - 修復：移除 `blob.make_public()` 呼叫（bucket 已有公開存取設定）
  - 狀態：已部署到 staging

- [x] **PDF 檔案雙向同步失敗** ✅ FIXED
  - Commit: `1f46693`
  - 問題：上傳的 PDF 無法在所有參與者之間同步
    - Owner 上傳 → Visitor 看到 ✓
    - Visitor 上傳 → Owner 看不到 ❌
    - 新加入 Visitor → 看不到之前上傳的檔案 ❌
  - Root Cause：
    1. `saveGameState` 缺少 `uploadedFile` 欄位
    2. Owner 接收 visitor 上傳時不保存狀態
  - 修復：
    - 在 `handleCardMove` 和 `handleCardReorder` 的 `saveGameState` 中加入 `uploadedFile`
    - 在 `onFileUpload` callback 中，owner 接收時保存狀態
  - 檔案：`frontend/src/hooks/use-unified-card-sync.ts`
  - 狀態：已 commit，等待 CI/CD 部署

### Production Bug 修復
- [ ] **調整 PROD DB 參數** 🔴 URGENT
  - [ ] 修復訪客看到 "等待諮詢師回來" overlay（即使 counselor 在線）
  - [ ] 修復 Game state changed 訊息狂跳問題（infinite loop）
  - [ ] 優化 Supabase Realtime 連線效能

### 第一階段結案報告
- [ ] **撰寫線上牌卡系統第一階段結案報告** 🔴 Young
  - [ ] 專案概述與目標
  - [ ] 已完成功能清單（4 套牌組、UI/UX 優化等）
  - [ ] 技術架構說明（Next.js 14 + FastAPI + GCS）
  - [ ] 測試階段成果
  - [ ] 下一階段規劃
  - 參考：`/Users/young/project/young_job_maanger/templates/project-template.md`

### 封測 QA 表格
- [ ] **設計並提供封測夥伴 QA 表格** 🔴 Young
  - [ ] 設計 QA 問卷結構（功能測試、使用體驗、bug 回報）
  - [ ] 建立 Google Form 或類似工具
  - [ ] 包含以下區塊：
    - 使用者基本資訊（姓名、使用日期）
    - 各牌組功能測試（能否正常操作、卡片顯示正確性）
    - 使用體驗評分（UI/UX、流暢度、直覺性）
    - Bug 回報（截圖、重現步驟）
    - 功能建議與改進意見
  - [ ] 提供表格連結給封測夥伴
  - 參考：已完成功能清單（見下方）

### 正式域名申請
- [ ] **申請線上牌卡系統正式 GoDaddy 域名** 🔴 PM/KM
  - [ ] 向案主/團隊確認域名需求
  - [ ] 在 GoDaddy 申請正式域名
  - [ ] 配置 DNS 指向 Production 環境
  - [ ] 更新文件中的正式網址

---

## 📦 卡牌上架總覽

| 牌組 | 總數 | 已上傳 GCS | JSON 整合 | 狀態 |
|------|------|-----------|----------|------|
| RIASEC 六大性格說明卡 | 6 | ✅ 36 files | ✅ | ✅ 完成 |
| 職業收藏家（職游旅人卡）| 100 | ✅ 100 files | ✅ | ✅ 完成 |
| 職能盤點卡 | 52 | ✅ 156 files | ✅ | ✅ 完成 |
| 價值導航卡 | 36 | ✅ | ✅ | ✅ 完成 |

---

## ✅ 已完成項目

### 2026-01-15 職能盤點卡重構

- [x] 卡片重新命名與分類
  - `action_01~10`（行動卡，10張）
  - `mindset_01~42`（職能卡，42張）
- [x] 所有 S/M/L 尺寸圖片重新命名並上傳 GCS（156 files）
- [x] JSON 資料完整更新（title、category、imageUrl）
- [x] 前端邏輯調整（移除 `skill_` 判斷，使用 `mindset_` / `action_`）

### 2026-01-15 UI/UX 優化

- [x] 價值導航卡「其他」區域 1:1 尺寸
- [x] 價值導航卡前三名區域 1:1 尺寸
- [x] 六大性格分析 list mode 顏色差異化
- [x] DropZone 單點擊查看大圖
- [x] 移除「查看」按鈕
- [x] 卡片置中對齊
- [x] 修復卡片重疊問題
- [x] 修復卡片邊緣被裁切問題
- [x] Tab active 狀態顏色更明顯
- [x] List mode 顯示實際卡片名稱

### 2026-01-15 環境修復

- [x] Supabase 密碼更新
- [x] CORS 設定更新
- [x] GitHub Secrets 更新

---

## 🎯 待完成項目

### P1 - Beta 測試後必要的優化項目

#### 1. 諮詢歷史管理完善

- [ ] 完整諮詢記錄查看介面（時間軸 + 篩選）
- [ ] 歷史資料匯出功能（CSV/PDF）
- [ ] 諮詢報告生成（基礎版，不含 AI）

#### 2. 訪客流程優化

- [ ] 訪客引導流程優化
- [ ] 錯誤處理強化（斷線重連、權限提示）
- [ ] 訪客端效能優化

#### 3. 監控與錯誤追蹤

- [ ] Cloud Logging 完整設定與 Dashboard
- [ ] 錯誤告警機制（Slack/Email）
- [ ] 效能監控指標建立

---

### P2 - 第二階段規劃（2026-01 ~ 2026-03）

#### 1. A+B=C Pattern 邏輯

- [ ] Pattern 規則分析與設計
- [ ] 固定規則實作
- [ ] 遊戲引擎整合

#### 2. 註冊流程優化

- [ ] 完整註冊機制（Email 驗證）
- [ ] 忘記密碼功能完善
- [ ] OAuth 社群登入（預留）

#### 3. AI 諮詢輔助功能

- [ ] 智慧牌卡推薦
- [ ] 諮詢洞察分析
- [ ] 自動生成諮詢摘要

#### 4. 班級管理系統

- [ ] 多人同時諮詢
- [ ] 群組管理功能
- [ ] 批量報告生成

---

## 🔗 相關文件

- [CHANGELOG](CHANGELOG.md) - 版本變更紀錄
- [PRD](PRD.md) - 產品需求文件
- [Weekly Report](WEEKLY_REPORT_2026-01-15.md) - 週報
