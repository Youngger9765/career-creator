# 11月第一週報告（2025-10-29 ~ 11-04）

## 測試環境

- Staging: <https://career-creator-frontend-staging-990202338378.asia-east1.run.app>
- Production: <https://career-creator-frontend-production-990202338378.asia-east1.run.app>

---

## 📋 本週重點成果

### ✅ Beta 封測負載測試完成

**背景**：為 Beta 測試做準備，模擬 50 人同時加入房間的實際使用場景

**完成項目**：

- 建立完整負載測試基礎建設（測試腳本、測試帳號管理）
- 執行 50 併發訪客加入測試（Staging + Production）
- 發現並修復資料庫連線池瓶頸
- 實現 100% 成功率（從 0% → 100%）

**影響**：

- ✅ **系統穩定性**：通過高併發壓力測試，確保 Beta 測試穩定運作
- ✅ **效能優化**：平均響應時間從 5 秒降至 1.9-4.6 秒
- ✅ **基礎建設**：建立可重複使用的測試框架，方便未來擴充
- ✅ **成本控管**：零額外成本（僅配置優化）

---

## 🔧 技術突破

### 1. 資料庫連線池優化

**問題發現（Week 13 前期）**：

- Production: 50 人併發加入，成功率僅 28% (14/50)
- Staging: 50 人併發加入，成功率 0% (登入就失敗)
- 錯誤類型：HTTP 500 - Internal Server Error

**根本原因診斷**：

- **Staging**：使用了 Session pooler (port 5432)，只支援 ~15 個併發連線
  - 錯誤訊息：`MaxClientsInSessionMode: max clients reached`
- **Production**：資料庫連線池配置不足 (60 連線 < 50 併發請求)

**修復方案**：

1. **Staging**: 修改 GitHub Actions workflow，強制使用 Transaction pooler (port 6543)
   - 支援 200+ 併發連線
   - 適合 FastAPI 短事務模式
2. **Production**: 增加連線池容量
   - pool_size: 30 → 50
   - max_overflow: 30 → 50
   - 總容量: 60 → 100 connections

**修復後測試結果**：

| 環境 | 修復前 | 修復後 | 改善幅度 |
|------|--------|--------|---------|
| Staging 成功率 | 0% | 100% (50/50) | +100% |
| Staging 響應時間 | Timeout (60s+) | 1.9秒 | -97% |
| Production 成功率 | 28% (14/50) | 100% (50/50) | +72% |
| Production 響應時間 | ~5秒 | 4.6秒 | -8% |

### 2. 診斷工具建置

**新增端點**：

- `/debug/db-pool`: 即時查看連線池狀態（已簽出/簽入/溢出數量）
- `/debug/db-test`: 測試實際資料庫連線與響應時間

**價值**：快速定位 Staging 使用錯誤 pooler 的問題

### 3. 負載測試基礎建設

**測試框架完成**：

- Python ThreadPoolExecutor 真併發測試（非 async 偽併發）
- 自動化測試報告生成（JSON + Markdown）
- 測試帳號管理系統（臨時 init endpoint）
- 組織化測試結果儲存（test-results/ 資料夾）

**測試項目涵蓋**：

1. 資料庫連線測試
2. 登入壓力測試
3. 房間建立與分享
4. 50 併發訪客加入（核心測試）
5. Heartbeat 機制
6. 資料完整性驗證

---

## 🔐 安全性強化

### 1. Pre-commit Security Checks 升級

**完成項目**：

- 強化 gitleaks 密碼偵測規則
- 防止測試密碼洩漏至生產環境
- 移除所有 hardcoded Supabase keys

### 2. 測試環境安全

**完成項目**：

- 臨時測試 endpoint 加入 SECRET 保護
- 測試帳號使用 bcrypt hash（10 rounds 平衡安全與效能）
- 測試結果檔案 .gitignore 管理

---

## 📊 本週數據

- **Commits**: 48 個
- **核心修復**: 2 個關鍵資料庫瓶頸
- **測試場景**: 50 併發訪客加入
- **成功率**: 100% (Staging + Production)
- **測試報告**: 2 份詳細報告（FINAL_REPORT_STAGING.md, FINAL_REPORT_PRODUCTION.md）
- **新增診斷工具**: 2 個 debug endpoints

---

## 🎯 負載測試詳細報告

### Staging 環境

**測試配置**：

- URL: <https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app>
- 測試類型: 50 個訪客同時加入同一個房間
- Pooler: Transaction pooler (port 6543)
- 連線池: pool_size=50, max_overflow=50 (總計 100)

**測試結果**：

- ✅ 成功率: 100% (50/50)
- ✅ 總耗時: 1.9 秒
- ✅ 平均響應時間: ~38ms per visitor
- ✅ 無任何錯誤

### Production 環境

**測試配置**：

- URL: <https://career-creator-backend-production-x43mdhfwsq-de.a.run.app>
- 測試類型: 50 個訪客同時加入同一個房間
- Pooler: Transaction pooler (port 6543)
- 連線池: pool_size=50, max_overflow=50 (總計 100)

**測試結果**：

- ✅ 成功率: 100% (50/50)
- ✅ 總耗時: 4.6 秒
- ✅ 平均響應時間: ~92ms per visitor
- ✅ 無任何錯誤

**詳細報告**：

- [Staging 測試報告](test-results/FINAL_REPORT_STAGING.md)
- [Production 測試報告](test-results/FINAL_REPORT_PRODUCTION.md)

---

## 🧪 技術決策記錄

### Transaction Pooler vs Session Pooler

**選擇原因**：

| 特性 | Session Pooler (5432) | Transaction Pooler (6543) |
|------|----------------------|---------------------------|
| 連線數限制 | ~15 | 200+ |
| 連線模式 | 每個 client 獨占連線 | 每個事務釋放連線 |
| 適用場景 | 需要 session-level state | 短事務、高併發 |
| 限制 | 不支援準備語句、LISTEN | 完全支援 FastAPI 使用案例 |

**結論**：FastAPI 所有 API 皆為短事務，Transaction pooler 完全滿足需求，無任何副作用

### Bcrypt Performance Tuning

**決策**：使用 10 rounds（測試環境）

- 每次登入耗時：~100ms（可接受範圍）
- 安全性：足夠防暴力破解
- 併發效能：50 人登入不會卡死後端

---

## ⚠️ 本週未完成

### 1. 牌卡內容上架

**狀態**：等待 Hannah 提供牌卡素材
**現況**：資料結構和顯示邏輯已就位，可隨時匯入

### 2. Cloud Logging 監控

**狀態**：基礎 logging 已運作，進階監控待設定
**計畫**：Beta 測試啟動後根據實際需求調整

---

## 🎯 下週計畫（11/05 ~ 11/11）

### P0：Beta 測試啟動準備

1. **用戶帳號建立**
   - 等待 KM 提供 Beta 測試用戶名單（50 人 Email）
   - 使用管理員後台批量建立帳號
   - 發送登入資訊與使用說明

2. **牌卡內容上架**
   - 等待 Hannah 提供三種牌卡素材
   - 真實牌卡導入系統
   - 內部驗收測試

### P1：監控與文檔

1. **Cloud Logging 設定**
   - 異常告警機制
   - 效能監控儀表板

2. **用戶文檔準備**
   - Beta 測試使用手冊
   - 常見問題 FAQ

---

## 💬 需要協助

**KM**：

1. Beta 測試用戶清單（50 人 Email）
2. 確認 Beta 測試啟動時間（目標 11 月中）
3. 協調 Hannah 提供牌卡素材進度

**Hannah**：

1. 三種牌卡圖片與文案（職游旅人卡、職能盤點卡、價值導航卡）
2. 建議優先提供一種牌卡完整測試

---

## 📋 總結

本週完成 **Beta 封測最關鍵的負載測試**，發現並修復兩個嚴重的資料庫連線池問題：

- **Staging**: 從登入就失敗（0%）→ 100% 成功率
- **Production**: 從 28% 成功率 → 100% 成功率

系統現已**通過 50 人同時加入房間的壓力測試**，確保 Beta 測試階段的穩定運作。

建立的負載測試基礎建設和診斷工具，為未來擴展和監控提供堅實基礎。

**下週最優先**：等待 KM 提供用戶名單 + Hannah 牌卡素材，準備啟動 Beta 測試。

---

**報告時間**: 2025-11-04
**涵蓋期間**: 2025-10-29 ~ 11-04
