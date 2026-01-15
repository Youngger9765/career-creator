# Changelog

所有重要變更都會記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)。

---

## [Unreleased]

---

## [2026-01-15] - 職能盤點卡重構與 UI 優化

### Added
- 六大性格分析 list mode 卡片依區域顯示差異化顏色（喜歡=綠、中立=黃、不喜歡=紅）
- DropZone 卡片單點擊即可查看 L size 大圖
- `zoneColorScheme` prop 支援區域顏色主題

### Changed
- 職能盤點卡完整重構：52 張（10 行動卡 + 42 職能卡）
- 卡片命名規範統一：`skill_` → `mindset_` / `action_`
- 所有職能盤點卡 title 更新為正確名稱
- RIASEC 卡片 title 改為純中文（移除英文括號）
- 價值導航畫布名稱：「3x3網格畫布」→「價值排序畫布」
- 價值導航卡前三名區域卡片改為 1:1 尺寸
- 成長計畫卡片大小統一，加入翻面功能
- Tab active 狀態顏色更明顯

### Fixed
- DropZone 移除 overflow-x-hidden 避免卡片邊緣被裁切
- DropZone 卡片置中對齊
- DropZone 卡片不再重疊
- 行動卡沒有背面時不顯示翻轉按鈕
- 驚嘆號只在 showCounter 為 true 時才顯示
- 新增 staging frontend URL 到 CORS 設定

### Removed
- 移除 `skill_` 卡片 id 判斷
- 移除 DropZone「查看」按鈕（改為單點擊查看）

---

## [2025-11-21] - PRD 重構與 CI/CD 優化

### Added
- 新增 agents 系統支援 Claude CLI
- 新增 session-start hook 支援 context persistence

### Changed
- PRD 大重構：聚焦未完成工作，新增 P0/P1/P2 優先順序
- Docker builds 優化：multi-stage approach
- CI/CD workflows 優化：caching 和 smart health checks

### Fixed
- N+1 queries 優化：rooms 和 clients API endpoints
- Markdown linting issues 修復

### Removed
- 移除過時文件（1314 行）
- 移除 obsolete card-events 和 game-sessions 程式碼

---

## [2025-11-14] - 測試清理與效能優化

### Added
- E2E tests 整合到 deployment pipeline
- Throttle/debounce 機制減少 Realtime 頻寬 60%

### Changed
- 測試套件優化：移除重複程式碼
- Hooks 優化：cleanup 和 memory safety

### Fixed
- useClientManagement async loading state 測試修復
- E2E tests 使用 baseURL from config

### Removed
- 移除過時 skipped unit tests
- 移除過時 E2E tests

---

## [2025-11-07] - 牌卡 UI 優化

### Added
- 100 張職業卡（O*NET 資料結構）
- RIASEC 六大性格說明卡 S size 圖片

### Changed
- 卡片圓角從 lg 增加到 xl
- Card display 改進：dynamic scaling 和 taller aspect ratio

### Fixed
- CardModal 圓角顯示（object-contain）
- Dark mode 對比度改善（text-based cards）
- M size image fallback 邏輯修正
- 隱藏無背面卡片的背面

---

## [2025-11-04] - 負載測試與安全性強化

### Added
- 負載測試框架（50 併發測試）
- Supabase 環境變數到 Cloud Run deployment

### Changed
- 資料庫連線池優化：100% 成功率、響應時間優化 97%
- Deck ID 從 `career_cards_100` 改為 `profession-collector`

### Fixed
- Email verification UI 隱藏（CRM client form）

### Removed
- 移除 card asset manager 和相關檔案

---

## [2025-10-28] - Production 環境建置

### Added
- GCP Cloud Run 部署
- 白名單認證系統（管理員後台、CSV 匯入、密碼重設）

### Changed
- GCP 遷移至公司專案
- 大型組件重構

---

## [2025-10-21] - 白名單認證系統

### Added
- 管理員後台
- CSV 匯入功能
- 密碼重設機制

---

## [2025-10-01] - 資料持久化

### Added
- 遊戲狀態持久化（JSONB + localStorage 雙軌）
- 諮詢師筆記功能（即時筆記 + 截圖整合）
- 客戶諮詢室簡化（一鍵進入）
- 籌碼系統改版（+/- 按鈕、手動輸入）

### Changed
- 牌卡視覺優化（疊卡模式、雙視圖）

---

## [2025-09-01] - MVP 發布

### Added
- 核心功能：註冊登入、房間管理、牌卡操作
- 三種牌卡七大玩法
- Supabase Realtime 即時同步
- 客戶管理系統（CRM 基礎版）

