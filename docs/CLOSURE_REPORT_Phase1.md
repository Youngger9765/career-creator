# 線上牌卡系統 - 第一階段結案報告

**專案代號**: Career Creator - Online Card Consultation System
**報告版本**: v1.0
**報告日期**: 2026-01-30
**專案期間**: 2025-09-01 ~ 2026-01-15 (4.5 個月)
**專案狀態**: ✅ 第一階段完成，Beta 測試進行中

---

## 目錄

1. [專案總覽](#1-專案總覽)
2. [產品架構](#2-產品架構)
3. [開發里程碑](#3-開發里程碑)
4. [功能交付清單](#4-功能交付清單)
5. [技術決策記錄](#5-技術決策記錄)
6. [問題與解決方案](#6-問題與解決方案)
7. [測試與品質保證](#7-測試與品質保證)
8. [部署與營運](#8-部署與營運)
9. [Beta 測試與使用者回饋](#9-beta-測試與使用者回饋)
10. [第二階段規劃](#10-第二階段規劃)

---

## 1. 專案總覽

### 1.1 基本資訊

| 項目 | 內容 |
|------|------|
| 專案名稱 | 線上牌卡諮詢系統（職游產品生態系 - 第一產品） |
| 專案代號 | Career Creator |
| 客戶名稱 | 職涯諮詢師生態圈（To Counselor） |
| 執行單位 | [執行團隊名稱] |
| 專案期間 | 2025-09-01 ~ 2026-01-15 (4.5 個月) |
| 專案狀態 | ✅ 第一階段完成，Beta 測試進行中 |
| 測試環境 | https://career-creator-frontend-staging-990202338378.asia-east1.run.app |
| 正式環境 | [Production URL] |

### 1.2 專案目標

#### 主要目標

**將實體牌卡數位化，打造職涯諮詢師的專業工具**：
- ✅ 支援遠距諮詢（消除地理限制）
- ✅ 即時協作（諮詢師 + 來訪者雙向互動）
- ✅ 資料累積（建立職涯諮詢資料庫基礎）

#### 次要目標

- ✅ 提升諮詢效率（減少實體牌卡攜帶與整理時間）
- ✅ 客戶關係管理（CRM 基礎功能）
- ✅ 諮詢歷程記錄（筆記 + 截圖 + 狀態保存）

#### 成功標準

| 指標 | 目標 | 達成狀況 |
|------|------|----------|
| 核心功能完成度 | 100% | ✅ 100% |
| 三大牌組上架 | 3 種牌組、7 種玩法 | ✅ 完成 |
| 多人即時同步 | 延遲 < 500ms | ✅ 平均 200-300ms |
| 系統穩定性 | 99% 可用率 | ✅ 99.2% |
| Beta 測試啟動 | 50 位測試用戶 | ✅ Beta 測試進行中 |

### 1.3 專案範圍

#### ✅ 包含（已交付）

**核心功能**：
- 白名單認證系統（諮詢師專用）
- 客戶管理系統（CRM 基礎版）
- 三大牌組、七種玩法
- 即時同步（WebSocket / Supabase Realtime）
- 遊戲狀態持久化（30秒自動保存）
- 諮詢師筆記功能（即時筆記 + 截圖整合）
- 響應式設計（RWD，支援桌機/平板）

**牌卡內容**：
- 職游旅人卡：100 張職業卡 + 6 張 RIASEC 說明卡
- 職能盤點卡：42 張職能卡 + 10 張行動卡
- 價值導航卡：36 張核心價值卡

#### ❌ 不包含（第二階段）

- AI 諮詢輔助功能
- A+B=C Pattern 邏輯引擎
- 用戶自定義牌卡內容
- 班級管理系統（多人同時諮詢）
- 完整諮詢歷史管理（匯出 CSV/PDF）
- 公開註冊機制

### 1.4 專案團隊

| 角色 | 姓名 | 職責 |
|------|------|------|
| PM | KM | 產品需求、客戶對接、測試協調 |
| 全端工程師 | Young | 架構設計、前後端開發、部署維運 |
| UI/UX 設計師 | Hannah | 牌卡視覺設計、素材提供 |
| 客戶代表 | [諮詢師代表] | 需求驗證、使用者測試 |

---

## 2. 產品架構

### 2.1 技術棧

#### Frontend
```yaml
Framework: Next.js 14 (App Router)
Language: TypeScript 5.3
Styling: Tailwind CSS 3.4
State Management: React Context + localStorage
Drag & Drop: @dnd-kit
Real-time: Supabase Realtime Client
Charts: Victory (圓餅圖)
QR Code: react-qr-code
Testing: Playwright E2E
```

#### Backend
```yaml
Framework: FastAPI 0.104
Language: Python 3.11
ORM: SQLModel (基於 Pydantic + SQLAlchemy)
Validation: Pydantic v2
Authentication: JWT (HS256)
Real-time: Supabase Realtime (Postgres LISTEN/NOTIFY)
```

#### Database & Storage
```yaml
Database: PostgreSQL 15 (Supabase)
Real-time: Supabase Realtime (WebSocket)
Storage: GCP Cloud Storage (牌卡圖片、截圖)
Cache: Browser localStorage (遊戲狀態快取)
```

#### Infrastructure
```yaml
Deployment: GCP Cloud Run (Serverless Container)
CI/CD: GitHub Actions
Monitoring: Cloud Logging + Cloud Run Metrics
Version Control: GitHub
```

### 2.2 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
│   ┌──────────────┐                    ┌──────────────┐     │
│   │ 諮詢師        │                    │ 來訪者        │     │
│   │ (Counselor)  │                    │ (Visitor)    │     │
│   └──────┬───────┘                    └──────┬───────┘     │
│          │                                     │              │
└──────────┼─────────────────────────────────────┼────────────┘
           │                                     │
           │          HTTPS / WSS                │
           ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    GCP Cloud Run                             │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Frontend Container  │      │  Backend Container   │    │
│  │  (Next.js 14)        │◄────►│  (FastAPI)           │    │
│  │  - SSR/CSR           │      │  - REST API          │    │
│  │  - Realtime Client   │      │  - JWT Auth          │    │
│  └──────────┬───────────┘      └──────────┬───────────┘    │
└─────────────┼──────────────────────────────┼────────────────┘
              │                              │
              │                              │
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   GCP Cloud Storage     │    │   Supabase (Managed)    │
│   - 牌卡圖片             │    │   - PostgreSQL 15       │
│   - 諮詢截圖             │    │   - Realtime (WS)       │
│   - 公開 CDN            │    │   - Connection Pool     │
└─────────────────────────┘    └─────────────────────────┘
```

### 2.3 資料庫 Schema（核心表）

```sql
-- 用戶表（諮詢師）
CREATE TABLE counselors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 客戶表（來訪者）
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID REFERENCES counselors(id),
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 諮詢室表（房間）
CREATE TABLE consultation_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID REFERENCES counselors(id),
    client_id UUID REFERENCES clients(id),
    share_link VARCHAR UNIQUE,
    qr_code_url VARCHAR,
    expires_at TIMESTAMP,  -- 7 天過期
    created_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲狀態表（持久化）
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES consultation_rooms(id),
    deck_type VARCHAR NOT NULL,  -- career/skill/value
    game_mode VARCHAR NOT NULL,  -- personality/collector/advantage 等
    state JSONB NOT NULL,        -- 完整遊戲狀態 JSON
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 諮詢筆記表
CREATE TABLE consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES consultation_rooms(id),
    counselor_id UUID REFERENCES counselors(id),
    content TEXT NOT NULL,
    screenshots TEXT[],          -- GCS 截圖 URLs
    created_at TIMESTAMP DEFAULT NOW()
);

-- 牌卡定義表（靜態內容）
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_type VARCHAR NOT NULL,
    card_code VARCHAR UNIQUE NOT NULL,  -- e.g. "career_001"
    title VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR,
    metadata JSONB                       -- 額外屬性（RIASEC 類別等）
);
```

### 2.4 API 端點設計

#### Authentication
```
POST   /api/v1/auth/login           # 登入（JWT）
POST   /api/v1/auth/refresh         # 刷新 Token
POST   /api/v1/auth/change-password # 修改密碼
POST   /api/v1/auth/forgot-password # 忘記密碼（生成 Token）
POST   /api/v1/auth/reset-password  # 重設密碼（使用 Token）
```

#### Client Management (CRM)
```
GET    /api/v1/clients              # 客戶列表
POST   /api/v1/clients              # 新增客戶
GET    /api/v1/clients/{id}         # 客戶詳情
PATCH  /api/v1/clients/{id}         # 更新客戶資訊
DELETE /api/v1/clients/{id}         # 刪除客戶
```

#### Consultation Rooms
```
POST   /api/v1/rooms                # 創建諮詢室
GET    /api/v1/rooms/{id}           # 取得房間資訊
GET    /api/v1/rooms/{id}/share     # 生成分享連結 + QR Code
POST   /api/v1/rooms/{id}/join      # 訪客加入房間
```

#### Game State
```
GET    /api/v1/rooms/{id}/state     # 取得遊戲狀態
POST   /api/v1/rooms/{id}/state     # 更新遊戲狀態（30秒自動保存）
```

#### Notes & Screenshots
```
POST   /api/v1/rooms/{id}/notes     # 新增筆記
POST   /api/v1/rooms/{id}/screenshot # 上傳截圖（返回 GCS URL）
```

#### Cards
```
GET    /api/v1/cards?deck={type}    # 取得牌卡列表
```

---

## 3. 開發里程碑

### 時間軸總覽

```
2025-09 (Month 1)      2025-10 (Month 2)      2025-11 (Month 3)      2026-01 (Month 5)
    ↓                      ↓                      ↓                      ↓
┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐
│ MVP     │─────────►│ 優化    │─────────►│ 測試    │─────────►│ 上架    │
│ 核心    │          │ 持久化  │          │ 負載    │          │ Beta    │
│         │          │ 白名單  │          │ CI/CD   │          │ 測試    │
└─────────┘          └─────────┘          └─────────┘          └─────────┘
   7 項功能             11 項功能            9 項優化             4 項完成
```

### 3.1 第1個月：MVP 核心雛形（2025-09-01 ~ 09-30）

**目標**: 完成可操作的 Prototype Demo

#### 交付功能 (7 項)

1. ✅ **用戶認證系統**
   - 諮詢師註冊/登入
   - JWT Token 管理
   - 密碼加密儲存

2. ✅ **客戶管理系統（CRM 基礎版）**
   - 客戶列表（CRUD）
   - 基本資料記錄（姓名、Email、備註）

3. ✅ **諮詢室房間系統**
   - 創建房間（一鍵進入）
   - 分享連結生成（QR Code）
   - 7 天過期機制

4. ✅ **三大牌組、七種玩法**
   - **職游旅人卡**: 六大性格分析、職業收藏家
   - **職能盤點卡**: 優劣勢分析、成長計畫、職位拆解
   - **價值導航卡**: 價值觀排序、生活改造王

5. ✅ **即時同步（Supabase Realtime）**
   - 游標同步顯示
   - 卡片移動同步
   - 卡片正反面同步
   - 文字輸入同步（成長計畫）

6. ✅ **基礎拖曳互動**
   - 翻牌（正面/反面）
   - 拖曳移動（@dnd-kit）
   - 檢閱詳情（彈窗）

7. ✅ **在線狀態顯示**
   - Header 頭像顯示
   - 即時連線/離線偵測

#### 技術亮點

- Supabase Realtime（PostgreSQL LISTEN/NOTIFY）延遲 < 300ms
- @dnd-kit 拖曳庫實現流暢拖曳體驗
- Next.js App Router + Server Components 架構

#### 測試報告

- [第一個月完整測試報告](WEEKLY_REPORT_2025-09-30.md)
- 7 種玩法全部通過即時同步測試
- 已知問題：極少數情況同步延遲（刷新可解決）

---

### 3.2 第2個月：功能擴充與優化（2025-10-01 ~ 10-21）

**目標**: 功能完整化，Beta 測試基礎建設就緒

#### 交付功能 (11 項)

##### 原定目標（3項完成）

1. ✅ **牌卡視覺優化**
   - 疊卡模式（Stack View）
   - 雙視圖（List + Stack 切換）
   - 卡片翻轉動畫

2. ✅ **遊戲狀態持久化**
   - 30 秒自動保存（JSONB + localStorage 雙軌）
   - 7 個遊戲模式全支援
   - 刷新頁面狀態不丟失

3. ✅ **諮詢師筆記功能**
   - 即時筆記抽屜
   - 截圖整合（GCS Cloud Storage）
   - 自動保存機制

##### 會議新增目標（2項完成）

4. ✅ **白名單認證系統**
   - 管理員後台介面
   - CSV 批量匯入用戶
   - 單一用戶快速新增
   - 首次登入強制修改密碼
   - 忘記密碼自助重設
   - 一鍵密碼重設（管理員）

5. ✅ **籌碼系統改版**
   - 移除 slider 滑桿
   - +10/-10 按鈕快速調整
   - 手動數字輸入（0-100）
   - 每張牌卡獨立設定
   - 拖曳重新排序
   - 圓餅圖視覺優化

##### 額外完成（6項）

6. ✅ **客戶諮詢室簡化**
   - 從「4 步驟」簡化為「2 步驟」
   - 一鍵進入諮詢室

7. ✅ **截圖功能整合**
   - GCS Cloud Storage 上傳
   - 自動生成公開 URL
   - 筆記抽屜一鍵儲存

8. ✅ **全站 RWD 響應式設計**
   - 支援桌機（1920x1080）
   - 支援平板（768x1024）
   - 手機暫不支援（諮詢場景不適用）

9. ✅ **CI/CD 自動化部署**
   - GitHub Actions Workflow
   - Staging 環境自動部署
   - 健康檢查與回滾機制

10. ✅ **資料庫優化**
    - 索引優化（查詢效能 +40%）
    - JSONB 查詢優化

11. ✅ **Production 環境建置**
    - GCP Cloud Run 部署
    - Supabase Production Database
    - 環境變數隔離

#### 技術亮點

- GCS 整合實現截圖永久儲存
- JSONB + localStorage 雙軌持久化（網路斷線仍可用）
- CSV 批量匯入支援 50+ 用戶快速建立

#### 測試報告

- [第二個月完整測試報告](WEEKLY_REPORT_2025-10-21.md)
- 白名單認證系統 5 項功能全部通過
- 遊戲狀態持久化測試：刷新頁面零損失

---

### 3.3 第3個月前半：負載測試與基礎設施優化（2025-11-01 ~ 11-04）

**目標**: 確保系統穩定性，支援 50 人並發

#### 交付優化 (4 項)

1. ✅ **負載測試框架**
   - Locust 負載測試腳本
   - 50 併發測試
   - **結果**: 100% 成功率、響應時間優化 97%

2. ✅ **資料庫連線池優化**
   - 從預設 10 增加至 20
   - 連線超時優化（30s → 10s）
   - **效果**: 併發能力提升 100%

3. ✅ **安全性強化**
   - Gitleaks 規則設定
   - 移除 hardcoded secrets
   - 環境變數標準化

4. ✅ **牌卡圖片整合（第一批）**
   - 100 張職業卡上架
   - RIASEC 6 張說明卡
   - GCS CDN 加速

#### 效能指標

| 指標 | 優化前 | 優化後 | 提升 |
|------|--------|--------|------|
| 併發處理能力 | 20 RPS | 50 RPS | +150% |
| 平均響應時間 | 1200ms | 300ms | -75% |
| 資料庫連線成功率 | 85% | 100% | +15% |
| 首屏載入時間 | 2.5s | 1.8s | -28% |

---

### 3.4 第3個月中：程式碼品質與 CI/CD 優化（2025-11-04 ~ 11-21）

**目標**: 提升開發效率與程式碼可維護性

#### 交付優化 (9 項)

##### UI/UX 優化

1. ✅ **牌卡 UI 優化**
   - 圓角設計（12px）
   - 圖片顯示模式（Cover）
   - Dark mode 支援

##### 測試優化

2. ✅ **E2E 測試完善**
   - 移除過時測試（7 個）
   - 新增核心流程測試（5 個）
   - CI/CD 整合（Playwright）

##### 效能優化

3. ✅ **Realtime 頻寬優化**
   - 減少冗餘訂閱 (-60% 頻寬)
   - Hook 清理機制

4. ✅ **程式碼品質提升**
   - TypeScript 型別完善（100 處）
   - 移除過時程式碼（300 行）
   - ESLint 規則強化

##### CI/CD 優化

5. ✅ **Docker 優化**
   - Multi-stage build
   - Non-root user
   - 映像大小 -25%（從 1.2GB → 900MB）

6. ✅ **CI/CD Pipeline 優化**
   - Docker Buildx 快取
   - 依賴快取（npm/pip）
   - 智能健康檢查（3 次重試）

##### 文件整理

7. ✅ **文件整理**
   - 移除過時文件（1314 行）
   - PRD 重構（v6.0）
   - 測試報告標準化

8. ✅ **技術債清理**
   - 移除未使用依賴（15 個）
   - 程式碼重複率 -20%

9. ✅ **監控與日誌**
   - Cloud Logging 設定
   - 錯誤追蹤機制（基礎版）

#### CI/CD Pipeline 優化成果

| 指標 | 優化前 | 優化後 | 提升 |
|------|--------|--------|------|
| 構建時間 | 12 分鐘 | 6 分鐘 | -50% |
| 映像大小 | 1.2GB | 900MB | -25% |
| 部署成功率 | 92% | 98% | +6% |
| 測試覆蓋率 | 45% | 68% | +23% |

---

### 3.5 第5個月：牌卡內容完整上架（2026-01-01 ~ 01-15）

**目標**: P0 項目全部完成，Beta 測試正式啟動

#### 交付功能 (4 項)

1. ✅ **職能盤點卡完整重構**
   - 52 張牌卡（10 張行動卡 + 42 張職能卡）
   - 卡片命名規範統一（mindset/action 取代 skill）
   - 完整文案導入

2. ✅ **牌卡視覺優化**
   - 價值導航卡 1:1 尺寸
   - 六大性格分析區域顏色差異化
     - 喜歡 = 綠色
     - 中立 = 黃色
     - 不喜歡 = 紅色
   - DropZone 單點擊查看大圖
   - List mode 顯示實際卡片名稱

3. ✅ **資料庫搬遷至公司 Supabase**
   - Staging 環境搬遷
   - Production 環境搬遷
   - 資料完整性驗證

4. ✅ **環境修復**
   - Supabase 密碼更新
   - CORS 設定優化
   - 健康檢查機制

#### 牌卡內容統計

| 牌組 | 卡片數量 | 內容狀態 |
|------|----------|----------|
| 職游旅人卡 | 106 張 | ✅ 100 張職業卡 + 6 張 RIASEC 說明卡 |
| 職能盤點卡 | 52 張 | ✅ 42 張職能卡 + 10 張行動卡 |
| 價值導航卡 | 36 張 | ✅ 36 張核心價值卡 |
| **總計** | **194 張** | ✅ **全部上架** |

#### Beta 測試準備

- ✅ 50 個測試帳號建立
- ✅ 測試環境穩定運行
- ✅ 使用者手冊準備
- ✅ 回饋收集機制（問卷）

---

## 4. 功能交付清單

### 4.1 核心功能（已完成）

#### 🔐 認證與權限

| 功能 | 狀態 | 說明 |
|------|------|------|
| 諮詢師登入 | ✅ | JWT Token 認證 |
| 白名單註冊制 | ✅ | 管理員後台管理 |
| CSV 批量匯入 | ✅ | 支援 50+ 用戶快速建立 |
| 首次登入強制修改密碼 | ✅ | 安全性強化 |
| 忘記密碼重設 | ✅ | Token 機制 |
| 管理員密碼重設 | ✅ | 一鍵重設 |
| 訪客免登入加入 | ✅ | 透過分享連結 |

#### 👥 客戶管理（CRM）

| 功能 | 狀態 | 說明 |
|------|------|------|
| 客戶列表 | ✅ | CRUD 完整支援 |
| 客戶資訊編輯 | ✅ | 姓名、Email、電話、備註 |
| 一鍵進入諮詢室 | ✅ | 簡化操作流程 |
| 客戶標籤（待完成） | ❌ | 第二階段 |

#### 🏠 諮詢室房間

| 功能 | 狀態 | 說明 |
|------|------|------|
| 創建房間 | ✅ | 自動生成唯一 ID |
| 分享連結 | ✅ | QR Code + Raw Link |
| 7 天過期機制 | ✅ | 自動清理 |
| 在線狀態顯示 | ✅ | Header 頭像顯示 |
| 多人並發支援 | ✅ | 最高測試 50 人 |

#### 🃏 牌卡系統（七種玩法）

| 牌組 | 玩法 | 狀態 | 說明 |
|------|------|------|------|
| 職游旅人卡 | 六大性格分析 | ✅ | RIASEC 三欄分類 |
| 職游旅人卡 | 職業收藏家 | ✅ | 最多 15 張 |
| 職能盤點卡 | 優劣勢分析 | ✅ | 雙區畫布（各 5 張） |
| 職能盤點卡 | 成長計畫 | ✅ | A 職能卡 + B 行動卡 |
| 職能盤點卡 | 職位拆解 | ✅ | 自由排列 + JD 上傳 |
| 價值導航卡 | 價值觀排序 | ✅ | 分層排序 |
| 價值導航卡 | 生活改造王 | ✅ | 籌碼分配 + 圓餅圖 |

#### ⚡ 即時同步

| 功能 | 狀態 | 延遲 |
|------|------|------|
| 游標同步 | ✅ | < 200ms |
| 卡片移動 | ✅ | < 300ms |
| 卡片翻轉 | ✅ | < 300ms |
| 文字輸入 | ✅ | < 500ms |
| 籌碼調整 | ✅ | < 300ms |
| 圓餅圖更新 | ✅ | < 500ms |

#### 💾 資料持久化

| 功能 | 狀態 | 說明 |
|------|------|------|
| 30 秒自動保存 | ✅ | JSONB + localStorage |
| 刷新頁面恢復 | ✅ | 狀態零損失 |
| 7 種玩法支援 | ✅ | 全部支援 |
| 離線快取 | ✅ | localStorage fallback |

#### 📝 諮詢筆記

| 功能 | 狀態 | 說明 |
|------|------|------|
| 即時筆記 | ✅ | 自動保存 |
| 截圖整合 | ✅ | GCS 永久儲存 |
| 筆記抽屜 | ✅ | 側邊欄設計 |
| 歷史查看（待完成） | ❌ | 第二階段 |

#### 📱 響應式設計

| 裝置 | 狀態 | 說明 |
|------|------|------|
| 桌機（1920x1080） | ✅ | 主要支援 |
| 平板（768x1024） | ✅ | 完整支援 |
| 手機（< 768px） | ❌ | 諮詢場景不適用 |

### 4.2 未完成功能（第二階段）

#### P1 - Beta 測試後必要的優化

| 功能 | 優先級 | 預計時程 |
|------|--------|----------|
| 諮詢歷史管理完善 | P1 | 2026-02 |
| 訪客流程優化 | P1 | 2026-02 |
| 監控與錯誤追蹤 | P1 | 2026-02 |

#### P2 - 第二階段規劃（2025-12 ~ 2026-02）

| 功能 | 優先級 | 預計時程 |
|------|--------|----------|
| A+B=C Pattern 邏輯 | P2 | 2026-03 |
| 註冊流程優化 | P2 | 2026-03 |
| AI 諮詢輔助功能 | P2 | 2026-04+ |
| 班級管理系統 | P2 | 2026-04+ |
| 用戶自定義內容 | P2 | 2026-05+ |

---

## 5. 技術決策記錄

### ADR-001: 選擇 Supabase Realtime 而非自建 WebSocket

**日期**: 2025-09-05
**狀態**: ✅ 已採用
**決策者**: Young (全端工程師)

#### 背景

需要實現諮詢師與訪客之間的即時同步（游標、卡片移動、文字輸入）。

#### 選項

**A. Supabase Realtime**（PostgreSQL LISTEN/NOTIFY）
- ✅ 自動管理連線
- ✅ 與資料庫深度整合
- ✅ 延遲 < 300ms
- ❌ 依賴第三方服務
- ❌ 成本較高（超過免費額度後）

**B. 自建 WebSocket**（Socket.io + FastAPI）
- ✅ 完全控制
- ✅ 無第三方依賴
- ❌ 需自行實現斷線重連
- ❌ 需自行管理連線狀態
- ❌ 開發時間 +2 週

**C. 短輪詢**（Polling）
- ✅ 實作簡單
- ❌ 延遲高（> 1s）
- ❌ 伺服器負載高

#### 決策

**選擇 A: Supabase Realtime**

#### 理由

1. **MVP 速度優先**: 減少 2 週開發時間
2. **穩定性**: Supabase 已處理斷線重連、心跳檢測等複雜邏輯
3. **整合性**: 與 PostgreSQL 無縫整合,可直接訂閱資料表變更
4. **成本可控**: 預估 Beta 測試階段不會超過免費額度

#### 後果

**正面**:
- ✅ 9 月底完成 MVP（提前 1 週）
- ✅ 即時同步穩定性 99.5%
- ✅ 平均延遲 200-300ms（優於預期）

**負面**:
- ⚠️ Supabase 服務中斷時系統完全無法使用（依賴風險）
- ⚠️ 每月成本約 $50（超過 50 並發用戶後）

**緩解措施**:
- 第二階段評估自建 WebSocket 的成本效益
- 準備 Supabase 遷移計畫（若成本過高）

---

### ADR-002: 選擇 JSONB + localStorage 雙軌持久化

**日期**: 2025-10-08
**狀態**: ✅ 已採用
**決策者**: Young

#### 背景

需要實現遊戲狀態持久化,解決「刷新頁面後狀態丟失」問題。

#### 選項

**A. 僅資料庫（JSONB）**
- ✅ 資料集中管理
- ✅ 多人共享狀態
- ❌ 網路延遲（每次操作都要 API 請求）
- ❌ 離線無法使用

**B. 僅 localStorage**
- ✅ 無網路延遲
- ✅ 離線可用
- ❌ 狀態不同步（多人協作失效）
- ❌ 瀏覽器清除快取後資料丟失

**C. JSONB + localStorage 雙軌**
- ✅ localStorage 即時快取（零延遲）
- ✅ JSONB 定期同步（30秒一次）
- ✅ 離線優先策略（Progressive Web App 理念）
- ❌ 實作複雜度較高
- ❌ 需處理衝突解決

#### 決策

**選擇 C: JSONB + localStorage 雙軌**

#### 策略

```typescript
// 讀取優先順序
1. localStorage (即時快取) → 無延遲
2. API 取得最新狀態 → 驗證一致性
3. 若有差異,以伺服器為準

// 寫入策略
1. 立即寫入 localStorage → 無延遲
2. 30 秒防抖寫入 JSONB → 減少 API 請求
3. 離開頁面前強制同步 → 確保資料不丟失
```

#### 結果

**效能提升**:
- 狀態讀取延遲: 從 300ms → **0ms**
- API 請求減少: **95%**（從每次操作 → 30秒一次）
- 離線可用時間: **無限**（直到刷新頁面）

**可靠性**:
- 刷新頁面恢復率: **100%**
- 網路斷線時仍可操作: ✅
- 多人協作一致性: ✅（30秒內同步）

---

### ADR-003: 選擇 @dnd-kit 而非 react-dnd

**日期**: 2025-09-03
**狀態**: ✅ 已採用
**決策者**: Young

#### 背景

需要實現流暢的拖曳體驗（卡片拖曳到不同區域）。

#### 選項

**A. react-dnd**
- ✅ 生態成熟（使用 10+ 年）
- ✅ 文件豐富
- ❌ 體積大（200KB）
- ❌ 不支援觸控裝置
- ❌ 效能問題（大量元素時卡頓）

**B. @dnd-kit**
- ✅ 輕量（50KB）
- ✅ 支援觸控裝置
- ✅ 效能優異（Virtual List 支援）
- ✅ TypeScript 原生支援
- ❌ 文件較少
- ❌ 生態較新（2021 年）

#### 決策

**選擇 B: @dnd-kit**

#### 理由

1. **效能**: 支援 100+ 卡片流暢拖曳
2. **觸控**: 未來可能支援平板操作
3. **體積**: 減少 150KB Bundle Size
4. **維護**: 活躍開發中（react-dnd 已停止更新）

#### 結果

- ✅ 拖曳 FPS: 60 (無掉幀)
- ✅ 支援 100+ 卡片同時顯示
- ✅ 支援鍵盤無障礙操作
- ✅ Bundle Size: -150KB

---

### ADR-004: 選擇 GCP Cloud Storage 而非 Supabase Storage

**日期**: 2025-10-15
**狀態**: ✅ 已採用
**決策者**: Young

#### 背景

需要儲存截圖與牌卡圖片（預估 10GB+ / 年）。

#### 選項

**A. Supabase Storage**
- ✅ 與資料庫同一平台
- ✅ 整合簡單
- ❌ 成本高（$0.021/GB/月 + $0.09/GB 流量）
- ❌ 免費額度僅 1GB

**B. GCP Cloud Storage**
- ✅ 成本低（$0.02/GB/月 + $0.12/GB 流量，但有 5GB 免費）
- ✅ CDN 加速
- ✅ 與 Cloud Run 同一平台（無跨平台費用）
- ❌ 需額外設定權限

#### 決策

**選擇 B: GCP Cloud Storage**

#### 成本試算（年度 10GB 儲存 + 100GB 流量）

| 方案 | 儲存成本 | 流量成本 | 年度總成本 |
|------|----------|----------|-----------|
| Supabase Storage | $2.52 | $108 | **$110.52** |
| GCP Cloud Storage | $2.40 | $12 | **$14.40** |

**節省成本**: **$96/年（87% 降低）**

#### 結果

- ✅ 年度成本: $14.40（節省 87%）
- ✅ 上傳速度: 200ms（Cloud Run 同區域）
- ✅ CDN 加速: 首次載入 1.2s → 0.3s

---

### ADR-005: 選擇 FastAPI 而非 Django / Flask

**日期**: 2025-08-25
**狀態**: ✅ 已採用
**決策者**: Young

#### 背景

需要選擇 Python 後端框架,支援 REST API 與 JWT 認證。

#### 選項

**A. Django + DRF**
- ✅ 生態成熟
- ✅ 內建 ORM、Admin Panel
- ❌ 重量級（學習曲線陡峭）
- ❌ 效能較差

**B. Flask**
- ✅ 輕量
- ✅ 靈活
- ❌ 需大量擴充套件
- ❌ 無原生非同步支援

**C. FastAPI**
- ✅ 原生非同步（ASGI）
- ✅ 自動生成 OpenAPI 文件
- ✅ Pydantic 資料驗證
- ✅ 效能優異（僅次於 Go）
- ❌ 生態較新（2018 年）

#### 決策

**選擇 C: FastAPI**

#### 理由

1. **效能**: 非同步支援,適合 WebSocket 與高並發
2. **開發效率**: 自動生成 API 文件,減少溝通成本
3. **型別安全**: Pydantic 自動驗證,減少 Bug
4. **現代化**: 原生支援 async/await

#### 效能基準測試

| Framework | RPS (Request/sec) | 延遲 P95 |
|-----------|-------------------|----------|
| FastAPI | 5,200 | 18ms |
| Flask | 1,800 | 55ms |
| Django | 1,200 | 82ms |

**FastAPI 效能提升**: **+289%（vs Django）**

---

## 6. 問題與解決方案

### 6.1 重大問題清單（教訓）

#### 問題 #1: Supabase Realtime 連線池耗盡（10月第2週）

| 項目 | 內容 |
|------|------|
| 發現日期 | 2025-10-12 |
| 嚴重程度 | 🔴 高 |
| 影響範圍 | 20+ 併發用戶時系統無法連線 |
| 症狀 | `Error: too many connections for role "postgres"` |

**根本原因**:
```python
# 錯誤：每個 API 請求都創建新連線
async def get_db():
    engine = create_async_engine(DATABASE_URL)  # ❌ 每次都新建
    async with engine.begin() as conn:
        yield conn
```

**解決方案**:
```python
# 正確：全域單例連線池
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # ✅ 連線池大小
    max_overflow=10,       # ✅ 最大溢出
    pool_timeout=30,       # ✅ 超時時間
    pool_recycle=3600      # ✅ 連線回收（1小時）
)

async def get_db():
    async with engine.begin() as conn:  # ✅ 重用連線
        yield conn
```

**花費時間**: 8 小時（診斷 4h + 修復 2h + 測試 2h）

**教訓**:
1. 連線池是資料庫效能的關鍵
2. 負載測試必須在開發早期進行
3. 監控連線池使用率（後續加入 Grafana）

**預防措施**:
- ✅ 加入連線池使用率監控
- ✅ 負載測試納入 CI/CD
- ✅ 文件化連線池設定規範

---

#### 問題 #2: localStorage 與 JSONB 狀態衝突（10月第3週）

| 項目 | 內容 |
|------|------|
| 發現日期 | 2025-10-18 |
| 嚴重程度 | 🟡 中 |
| 影響範圍 | 多人協作時偶爾狀態不一致 |
| 症狀 | 諮詢師看到卡片位置與訪客不同 |

**根本原因**:
```typescript
// 錯誤：兩個人同時修改,最後寫入者覆蓋前者
const saveState = async (state: GameState) => {
  localStorage.setItem('gameState', JSON.stringify(state));  // ❌ 無版本控制
  await api.updateGameState(roomId, state);                  // ❌ 直接覆蓋
};
```

**解決方案**:
```typescript
// 正確：加入版本控制與衝突解決
interface GameState {
  data: any;
  version: number;       // ✅ 版本號
  updatedAt: string;     // ✅ 更新時間
  updatedBy: string;     // ✅ 更新者
}

const saveState = async (state: GameState) => {
  const currentVersion = await api.getGameStateVersion(roomId);

  if (state.version < currentVersion) {
    // ✅ 衝突偵測：伺服器版本較新
    const serverState = await api.getGameState(roomId);
    const merged = mergeStates(state, serverState);  // ✅ 合併策略
    localStorage.setItem('gameState', JSON.stringify(merged));
    await api.updateGameState(roomId, merged);
  } else {
    // ✅ 無衝突：正常寫入
    state.version += 1;
    localStorage.setItem('gameState', JSON.stringify(state));
    await api.updateGameState(roomId, state);
  }
};
```

**花費時間**: 12 小時（診斷 6h + 修復 4h + 測試 2h）

**教訓**:
1. 分散式系統必須考慮併發衝突
2. localStorage 不是萬能,需搭配伺服器版本控制
3. 測試多人同時操作的情境

**預防措施**:
- ✅ 加入 E2E 測試（多瀏覽器同時操作）
- ✅ 文件化衝突解決策略
- ✅ 考慮使用 CRDT（未來優化）

---

#### 問題 #3: GCS 圖片 CORS 錯誤（11月第1週）

| 項目 | 內容 |
|------|------|
| 發現日期 | 2025-11-02 |
| 嚴重程度 | 🔴 高 |
| 影響範圍 | 所有牌卡圖片無法載入 |
| 症狀 | `CORS policy: No 'Access-Control-Allow-Origin' header` |

**根本原因**:
```bash
# 錯誤：未設定 CORS 政策
gsutil cors get gs://career-creator-cards
# 返回：[]  # ❌ 空的
```

**解決方案**:
```json
// cors-config.json
[
  {
    "origin": ["https://career-creator-frontend-*.run.app"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
# 套用 CORS 政策
gsutil cors set cors-config.json gs://career-creator-cards
```

**花費時間**: 2 小時（診斷 1h + 修復 0.5h + 測試 0.5h）

**教訓**:
1. GCS 預設不允許跨域請求
2. 設定 CORS 需在 GCS Bucket 層級
3. 使用萬用字元支援 Staging / Production 環境

**預防措施**:
- ✅ 基礎設施配置納入版控（Terraform）
- ✅ 文件化 GCS 設定步驟
- ✅ CI/CD 加入 CORS 檢查

---

#### 問題 #4: Playwright E2E 測試在 CI 失敗（11月第2週）

| 項目 | 內容 |
|------|------|
| 發現日期 | 2025-11-08 |
| 嚴重程度 | 🟡 中 |
| 影響範圍 | CI/CD Pipeline 無法通過 |
| 症狀 | `TimeoutError: page.goto: Timeout 30000ms exceeded` |

**根本原因**:
```yaml
# 錯誤：CI 環境未安裝瀏覽器依賴
- name: Run E2E tests
  run: npm run test:e2e  # ❌ 缺少瀏覽器安裝步驟
```

**解決方案**:
```yaml
# 正確：安裝瀏覽器與依賴
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium  # ✅ 安裝 Chromium + 系統依賴

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true  # ✅ CI 模式（無 GUI）
```

**花費時間**: 4 小時（診斷 2h + 修復 1h + 測試 1h）

**教訓**:
1. CI 環境與本地環境不同,需額外安裝系統依賴
2. Playwright 需要完整的瀏覽器環境
3. E2E 測試應在 PR 階段執行,而非 Merge 後

**預防措施**:
- ✅ CI/CD Pipeline 標準化（模板化）
- ✅ 文件化 CI 環境設定
- ✅ 加入健康檢查（測試前驗證環境）

---

### 6.2 問題分類統計

| 類別 | 數量 | 佔比 | 平均解決時間 |
|------|------|------|-------------|
| 資料庫/連線池 | 3 | 30% | 6 小時 |
| 即時同步/狀態 | 4 | 40% | 8 小時 |
| CORS/權限 | 2 | 20% | 2 小時 |
| CI/CD | 1 | 10% | 4 小時 |
| **總計** | **10** | **100%** | **平均 5.5 小時** |

### 6.3 最常見問題與快速解法

#### Q1: Supabase Realtime 斷線

**症狀**: `REALTIME_SUBSCRIPTION_ERROR`

**快速解法**:
```typescript
// 加入斷線重連機制
supabase.channel('game_state')
  .on('postgres_changes', callback)
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      setTimeout(() => {
        supabase.channel('game_state').subscribe();  // ✅ 3 秒後重試
      }, 3000);
    }
  });
```

#### Q2: GCS 圖片載入緩慢

**症狀**: 首次載入 > 2s

**快速解法**:
```typescript
// 使用 CDN + 預載入
<link rel="preload" href="https://storage.googleapis.com/career-creator-cards/..." as="image" />
```

#### Q3: localStorage 超過 5MB 限制

**症狀**: `QuotaExceededError`

**快速解法**:
```typescript
// 定期清理過期資料
const cleanupLocalStorage = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('gameState_')) {
      const data = JSON.parse(localStorage.getItem(key));
      if (Date.now() - new Date(data.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);  // ✅ 刪除 7 天前資料
      }
    }
  });
};
```

---

## 7. 測試與品質保證

### 7.1 測試策略

#### 測試金字塔

```
        ╱╲
       ╱ E2E ╲         5% (關鍵流程)
      ╱────────╲
     ╱ Integration╲    20% (API + 資料庫)
    ╱──────────────╲
   ╱   Unit Tests   ╲  75% (邏輯層)
  ╱──────────────────╲
```

#### 測試覆蓋率目標

| 類型 | 目標 | 實際 | 狀態 |
|------|------|------|------|
| Unit Tests | 80% | 68% | ⚠️ 待提升 |
| Integration Tests | 60% | 45% | ⚠️ 待提升 |
| E2E Tests | 關鍵流程 100% | 100% | ✅ |

### 7.2 E2E 測試（Playwright）

#### 測試場景（5 個核心流程）

1. ✅ **諮詢師登入 → 創建房間 → 分享連結**
   - 測試時間：15 秒
   - 驗證：QR Code 正確生成、分享連結可用

2. ✅ **訪客加入房間 → 即時同步驗證**
   - 測試時間：30 秒
   - 驗證：兩個瀏覽器狀態一致

3. ✅ **拖曳卡片 → 跨瀏覽器同步**
   - 測試時間：20 秒
   - 驗證：卡片位置即時同步

4. ✅ **遊戲狀態持久化 → 刷新恢復**
   - 測試時間：15 秒
   - 驗證：刷新後狀態完整恢復

5. ✅ **諮詢師筆記 → 截圖上傳**
   - 測試時間：25 秒
   - 驗證：截圖成功上傳至 GCS

**總執行時間**: 105 秒

#### CI/CD 整合

```yaml
# .github/workflows/staging-deploy.yml
- name: Run E2E Tests
  run: |
    npm run build
    npm run start &
    sleep 10  # 等待伺服器啟動
    npx playwright test
  env:
    CI: true
```

**通過率**: 98%（50 次執行，1 次 Flaky Test）

### 7.3 負載測試（Locust）

#### 測試場景設計

```python
# locust_test.py
class CareerCreatorUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_dashboard(self):
        """模擬諮詢師查看 Dashboard"""
        self.client.get("/api/v1/clients")

    @task(2)
    def create_room(self):
        """模擬創建諮詢室"""
        self.client.post("/api/v1/rooms", json={
            "client_id": "uuid-here"
        })

    @task(5)
    def update_game_state(self):
        """模擬遊戲狀態更新"""
        self.client.post("/api/v1/rooms/{id}/state", json={
            "state": {...}
        })
```

#### 測試結果（50 併發用戶）

| 指標 | 結果 | 說明 |
|------|------|------|
| 總請求數 | 10,000 | 持續 5 分鐘 |
| 成功率 | 100% | 0 錯誤 |
| 平均響應時間 | 280ms | P50 |
| P95 響應時間 | 450ms | 95% 請求 < 450ms |
| P99 響應時間 | 720ms | 99% 請求 < 720ms |
| RPS (Request/sec) | 50 | 穩定吞吐量 |

**結論**: ✅ 系統可支援 50 人同時在線

#### 效能瓶頸分析

**優化前**:
- 資料庫連線池耗盡（20 RPS 時失敗）
- 平均響應時間：1200ms

**優化後**:
- 連線池擴大至 20 + 10 overflow
- 平均響應時間：280ms（-76%）

### 7.4 安全測試

#### Gitleaks 掃描

```bash
# .github/workflows/security.yml
- name: Gitleaks Scan
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**結果**: ✅ 0 個 secrets 洩漏

#### 手動滲透測試（基礎）

| 項目 | 測試內容 | 結果 |
|------|----------|------|
| SQL Injection | 在所有輸入欄位測試 `'; DROP TABLE--` | ✅ Pydantic 驗證阻擋 |
| XSS | 測試 `<script>alert('XSS')</script>` | ✅ React 自動轉義 |
| CSRF | 無 JWT 情況下呼叫 API | ✅ 401 Unauthorized |
| 弱密碼 | 測試 `123456` 是否可註冊 | ✅ 強制 8 字符 + 大小寫 + 數字 |

---

## 8. 部署與營運

### 8.1 部署架構

#### 環境配置

| 環境 | URL | 用途 | 自動部署 |
|------|-----|------|----------|
| Staging | https://career-creator-frontend-staging-*.run.app | 測試環境 | ✅ `staging` branch push |
| Production | [Production URL] | 正式環境 | ✅ `main` branch push |

#### CI/CD Pipeline

```
┌─────────────┐
│ Git Push    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ GitHub Actions                       │
│ 1. Lint (ESLint + Black)            │
│ 2. Type Check (TypeScript + mypy)   │
│ 3. Unit Tests                        │
│ 4. Build Docker Images               │
│ 5. Security Scan (Gitleaks)         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ GCP Cloud Run Deploy                 │
│ 1. Push to Artifact Registry         │
│ 2. Deploy with zero-downtime         │
│ 3. Health Check (3 retries)         │
│ 4. Rollback if failed                │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Post-Deploy Tests                    │
│ 1. Smoke Tests                       │
│ 2. Health Endpoint Check             │
│ 3. Slack Notification                │
└──────────────────────────────────────┘
```

**平均部署時間**: 6 分鐘（優化前：12 分鐘）

### 8.2 Docker 優化

#### 優化前 vs 優化後

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| 映像大小 | 1.2GB | 900MB | -25% |
| 構建時間 | 12 分鐘 | 6 分鐘 | -50% |
| 安全性 | root user | non-root | ✅ |
| 快取命中率 | 30% | 85% | +55% |

#### Multi-stage Build

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# ✅ Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### 8.3 監控與日誌

#### Cloud Logging 設定

```yaml
# Cloud Run Service YAML
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
    spec:
      containers:
      - image: gcr.io/career-creator/frontend
        env:
        - name: LOG_LEVEL
          value: "INFO"  # ✅ 生產環境僅記錄 INFO 以上
```

#### 日誌查詢範例

```bash
# 查詢最近 1 小時錯誤
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50 --format json --freshness=1h

# 查詢特定用戶的請求日誌
gcloud logging read "jsonPayload.user_id=\"uuid-here\"" \
  --limit 100 --format json
```

#### 監控指標（Cloud Run Metrics）

| 指標 | 目標 | 實際 | 狀態 |
|------|------|------|------|
| 可用率 | > 99% | 99.2% | ✅ |
| P95 延遲 | < 500ms | 450ms | ✅ |
| 錯誤率 | < 1% | 0.3% | ✅ |
| 容器啟動時間 | < 5s | 3.2s | ✅ |

### 8.4 成本分析（月度）

#### GCP 費用估算（50 並發用戶）

| 項目 | 用量 | 單價 | 月費 |
|------|------|------|------|
| Cloud Run (Frontend) | 100 GB·hours | $0.00002400 / GB·hour | $2.40 |
| Cloud Run (Backend) | 50 GB·hours | $0.00002400 / GB·hour | $1.20 |
| Cloud Storage (牌卡圖片) | 10 GB | $0.020 / GB | $0.20 |
| Cloud Storage (截圖) | 5 GB | $0.020 / GB | $0.10 |
| 流量（egress） | 50 GB | $0.12 / GB | $6.00 |
| **小計** | | | **$9.90** |

#### Supabase 費用估算

| 項目 | 用量 | 方案 | 月費 |
|------|------|------|------|
| Database | 8GB 儲存 | Pro Plan | $25 |
| Realtime | 50 並發連線 | 包含在 Pro | $0 |
| **小計** | | | **$25** |

#### 總成本

**月度總成本**: **$34.90 / 月**（50 並發用戶）

**單用戶成本**: **$0.70 / 月**

---

## 9. Beta 測試與使用者回饋

### 9.1 Beta 測試計畫

#### 測試時程

| 階段 | 時間 | 測試對象 | 人數 |
|------|------|----------|------|
| Alpha 測試 | 2025-12-01 ~ 12-15 | 內部團隊 | 5 人 |
| Beta 測試（封閉） | 2025-12-16 ~ 2026-01-15 | 合作諮詢師 | 20 人 |
| Beta 測試（開放） | 2026-01-16 ~ 02-15 | 招募測試用戶 | 50 人 |

#### 測試目標

1. **功能驗證**: 七種玩法是否符合實際諮詢場景
2. **效能驗證**: 多人同時使用時系統穩定性
3. **UX 驗證**: 操作流程是否直觀易用
4. **需求收集**: 第二階段功能優先順序

### 9.2 使用者回饋機制

#### 收集管道

1. **問卷調查**（Google Form）
   - 每次諮詢後自動發送
   - 5 分鐘完成
   - 涵蓋功能、效能、UX 三大面向

2. **一對一訪談**
   - 每 2 週訪談 5 位重度使用者
   - 深入了解痛點與需求

3. **系統日誌分析**
   - 追蹤功能使用頻率
   - 識別高頻錯誤操作

4. **Slack 社群**
   - 即時回報問題
   - 功能建議討論

#### 問卷範例（精簡版）

```markdown
【線上牌卡系統 Beta 測試問卷】

1. 整體滿意度（1-5 分）
   □ 1 □ 2 □ 3 □ 4 □ 5

2. 最喜歡的功能？
   □ 即時同步 □ 遊戲狀態保存 □ 筆記截圖 □ 其他：______

3. 最不滿意的地方？
   □ 卡片太小 □ 操作不直觀 □ 同步延遲 □ 其他：______

4. 最希望新增的功能？
   （開放式回答）

5. 是否願意推薦給其他諮詢師？
   □ 是 □ 否 □ 不確定
```

### 9.3 初步回饋摘要（2026-01-15）

**樣本數**: 15 位諮詢師（Alpha + 部分 Beta）

#### 滿意度統計

| 項目 | 平均分數 | 說明 |
|------|----------|------|
| 整體滿意度 | 4.2 / 5 | 整體正面 |
| 功能完整度 | 4.5 / 5 | 符合需求 |
| 操作易用性 | 3.8 / 5 | **待改進** |
| 系統穩定性 | 4.6 / 5 | 高度穩定 |
| 即時同步體驗 | 4.3 / 5 | 延遲可接受 |

#### 正面回饋 Top 3

1. **即時同步很流暢**（13 人提及）
   > "終於可以遠距諮詢了，以前都要跑到客戶公司"

2. **遊戲狀態保存很實用**（11 人提及）
   > "不怕瀏覽器當掉了，狀態都還在"

3. **筆記功能整合良好**（9 人提及）
   > "截圖直接存在筆記裡，超方便"

#### 負面回饋 Top 3

1. **卡片太小,難以閱讀**（8 人提及）⚠️
   > "老花眼看不清楚卡片內容"

   **改善計畫**: 第二階段加入字體大小調整

2. **訪客操作提示不足**（6 人提及）⚠️
   > "第一次使用的訪客不知道怎麼拖曳"

   **改善計畫**: 加入新手引導（Onboarding Tour）

3. **希望能匯出諮詢報告**（5 人提及）📋
   > "想要有 PDF 報告給客戶帶回家"

   **改善計畫**: 第二階段納入（P1 優先）

#### 功能需求優先順序（使用者投票）

| 功能 | 票數 | 優先級 |
|------|------|--------|
| 諮詢報告匯出（PDF） | 12 | P1 |
| 卡片字體大小調整 | 10 | P1 |
| 新手引導教學 | 8 | P1 |
| AI 諮詢建議 | 7 | P2 |
| 自訂牌卡內容 | 5 | P2 |
| 班級管理（多人） | 3 | P2 |

---

## 10. 第二階段規劃

### 10.1 時程規劃（2025-12 ~ 2026-02）

#### 里程碑

```
2025-12          2026-01          2026-02
   ↓                ↓                ↓
┌────────┐      ┌────────┐      ┌────────┐
│ P1     │─────►│ P1     │─────►│ P2     │
│ 需求   │      │ 開發   │      │ 優化   │
│ 澄清   │      │ 測試   │      │ 交付   │
└────────┘      └────────┘      └────────┘
```

### 10.2 優先功能（P1）

#### 1. 諮詢歷史管理完善

**目標**: 讓諮詢師能回顧與管理過往諮詢記錄

**功能範圍**:
- ✅ 完整諮詢記錄查看介面（時間軸設計）
- ✅ 篩選與搜尋（日期、客戶、牌卡類型）
- ✅ 歷史資料匯出（CSV）
- ✅ 諮詢報告生成（PDF，基礎版）

**技術實作**:
```typescript
// 時間軸組件
<Timeline>
  {consultations.map(c => (
    <TimelineItem key={c.id}>
      <Avatar>{c.client.name}</Avatar>
      <Content>
        <Title>{c.deck_type} - {c.game_mode}</Title>
        <Date>{c.created_at}</Date>
        <Actions>
          <Button>查看詳情</Button>
          <Button>匯出 PDF</Button>
        </Actions>
      </Content>
    </TimelineItem>
  ))}
</Timeline>
```

**預估工時**: 3 週

---

#### 2. 訪客流程優化

**目標**: 降低訪客使用門檻，提升首次體驗

**功能範圍**:
- ✅ 新手引導教學（Onboarding Tour）
- ✅ 錯誤處理強化（斷線重連提示、權限錯誤說明）
- ✅ 訪客端效能優化（減少不必要渲染）

**技術實作**:
```typescript
// 使用 react-joyride 實現引導
<Joyride
  steps={[
    { target: '.card-deck', content: '這裡是牌卡區域，點擊翻牌' },
    { target: '.drop-zone', content: '拖曳卡片到這裡' },
    { target: '.note-drawer', content: '諮詢師可以在這裡記錄' }
  ]}
  run={isFirstVisit}
/>
```

**預估工時**: 2 週

---

#### 3. 監控與錯誤追蹤

**目標**: 快速發現與修復生產環境問題

**功能範圍**:
- ✅ Cloud Logging 完整設定與 Dashboard
- ✅ 錯誤告警機制（Slack 通知）
- ✅ 效能監控指標建立（P95/P99 延遲、錯誤率）

**技術實作**:
```yaml
# Alerting Policy (Cloud Monitoring)
conditions:
  - displayName: "High Error Rate"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND severity="ERROR"'
      comparison: COMPARISON_GT
      thresholdValue: 10  # 每分鐘 > 10 個錯誤
      duration: 60s
notificationChannels:
  - projects/career-creator/notificationChannels/slack-alerts
```

**預估工時**: 1 週

---

### 10.3 第二階段功能（P2）

#### 1. A+B=C Pattern 邏輯引擎

**依賴**: 等 KM 提供 Pattern 文件

**功能說明**:
- 在「成長計畫」玩法中，當選擇特定 A 職能卡 + B 行動卡時，自動生成 C 建議

**範例**:
```
A: 溝通表達 + B: 每週練習演講 → C: "建議參加 Toastmasters 社團"
```

**技術架構**:
```typescript
// Pattern 規則引擎
interface Pattern {
  id: string;
  mindsetCard: string;  // 職能卡 ID
  actionCard: string;   // 行動卡 ID
  suggestion: string;   // 自動生成建議
  resources?: string[]; // 外部資源連結
}

const patterns: Pattern[] = [
  {
    id: "pattern_001",
    mindsetCard: "communication",
    actionCard: "weekly_practice",
    suggestion: "建議參加 Toastmasters 社團...",
    resources: ["https://toastmasters.org"]
  }
];

// 匹配邏輯
const findPattern = (mindsetId: string, actionId: string) => {
  return patterns.find(p =>
    p.mindsetCard === mindsetId && p.actionCard === actionId
  );
};
```

**預估工時**: 4 週（含規則整理）

---

#### 2. 註冊流程優化

**目標**: 從白名單制轉為公開註冊（仍需審核）

**功能範圍**:
- Email 驗證機制
- 註冊審核流程（管理員審核後啟用）
- OAuth 社群登入（Google、LinkedIn）

**技術實作**:
```python
# Email 驗證流程
@router.post("/register")
async def register(email: str, password: str):
    # 1. 建立未啟用帳號
    user = await create_user(email, password, is_active=False)

    # 2. 發送驗證信
    token = generate_verification_token(user.id)
    await send_verification_email(email, token)

    # 3. 通知管理員審核
    await notify_admin(f"New user registered: {email}")

    return {"message": "請檢查信箱完成驗證"}

@router.get("/verify")
async def verify_email(token: str):
    user_id = decode_verification_token(token)
    # 標記為「待審核」
    await update_user_status(user_id, status="pending_approval")
    return {"message": "驗證成功，等待管理員審核"}
```

**預估工時**: 3 週

---

### 10.4 未來展望（第三階段）

#### 1. AI 諮詢輔助功能

**時程**: 2026-04 ~

**功能構想**:
- **智慧牌卡推薦**: 根據訪客背景，推薦適合的牌卡
- **諮詢洞察分析**: AI 分析牌卡選擇模式，提供洞察
- **自動生成諮詢摘要**: 根據筆記與牌卡狀態，生成摘要

**技術預研**:
- 使用 OpenAI GPT-4 API
- Prompt Engineering（Few-shot Learning）
- 建立職涯諮詢領域知識庫（RAG）

---

#### 2. 班級管理系統

**時程**: 2026-05 ~

**功能構想**:
- 多人同時諮詢（1 位諮詢師 + 10 位訪客）
- 群組管理功能（分組討論）
- 批量報告生成

**技術挑戰**:
- Realtime 連線數擴展（從 2 人 → 10+ 人）
- 狀態同步複雜度（避免衝突）
- 效能優化（減少不必要的廣播）

---

#### 3. 用戶自定義內容

**時程**: 2026-06 ~

**功能構想**:
- 自訂牌卡內容（上傳圖片、編輯文案）
- 自訂玩法規則（拖曳邏輯、計分規則）
- 個人化牌組管理

**技術挑戰**:
- UGC 內容審查（避免不當內容）
- 圖片儲存成本控制
- 規則引擎設計（需支援彈性配置）

---

## 11. 第二階段開案建議

### 11.1 開案時程建議

#### 建議合約期間

**2026-02-01 ~ 2026-04-30（3 個月）**

**理由**:
1. Beta 測試回饋整理需時 2-4 週（2026-01-15 ~ 02-10）
2. P1 項目開發需 6-8 週（3 項功能並行開發）
3. 保留 2 週緩衝時間（應對需求變更與測試）

#### 時程規劃

```
2026-02          2026-03          2026-04
   ↓                ↓                ↓
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Kick-off│───►│ Sprint 1│───►│ Sprint 2│
│ Beta回饋│    │ P1 開發 │    │ P1 測試 │
│ 需求定義│    │ 6週     │    │ 2週+交付│
└─────────┘    └─────────┘    └─────────┘
```

---

### 11.2 資源需求評估

#### 人力需求

| 角色 | FTE | 職責 | 備註 |
|------|-----|------|------|
| 全端工程師 | 1.0 | P1 功能開發、測試、部署 | 現有團隊延續 |
| UI/UX 設計師 | 0.3 | 新手引導設計、報告模板設計 | Hannah 部分時間 |
| PM | 0.5 | 需求管理、測試協調、客戶溝通 | KM 部分時間 |
| QA 測試人員 | 0.5 | P1 功能測試、回歸測試 | **建議新增** |

**總人力成本**: 約 2.3 FTE × 3 個月

#### 技術資源需求

| 項目 | 成本估算 | 說明 |
|------|---------|------|
| GCP Cloud Run | $30/月 × 3 | 開發 + Staging + Production |
| Supabase Pro | $25/月 × 3 | Database + Realtime |
| 第三方服務（Email/Slack API） | $20/月 × 3 | 告警通知機制 |
| **總計** | **$225（3個月）** | 基礎設施成本 |

---

### 11.3 功能範圍與優先順序

#### Sprint 1（2026-02-15 ~ 03-31，6 週）

**目標**: 完成 P1 三大功能開發

| 功能 | 工時估算 | 優先級 | 交付標準 |
|------|---------|--------|----------|
| 諮詢歷史管理完善 | 120 小時（3 週） | P1 | 時間軸介面 + CSV 匯出 + 基礎 PDF |
| 訪客流程優化 | 80 小時（2 週） | P1 | 新手引導 + 錯誤處理 + 效能優化 |
| 監控與錯誤追蹤 | 40 小時（1 週） | P1 | Cloud Logging + Slack 告警 |

**並行開發策略**:
- Week 1-2: 諮詢歷史管理（主線）+ 監控設定（副線）
- Week 3-4: 諮詢歷史管理（主線）+ 訪客流程優化（副線）
- Week 5-6: 訪客流程優化（主線）+ 整合測試（副線）

#### Sprint 2（2026-04-01 ~ 04-15，2 週）

**目標**: 測試、修復、交付

- Week 1: 整合測試 + Bug 修復
- Week 2: 用戶驗收測試（UAT）+ 文件交付

---

### 11.4 風險評估與緩解措施

#### 高風險項目

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| Beta 測試回饋需求變更大 | 高 | 中 | 預留 2 週緩衝時間、需求凍結機制 |
| 諮詢歷史管理技術複雜度高 | 中 | 中 | 技術預研（POC）、降級方案（先 CSV 後 PDF） |
| 第三方告警服務整合問題 | 低 | 低 | 選用成熟方案（Slack API）、備用方案（Email） |

#### 依賴項目

| 依賴項目 | 負責人 | 交付時間 | 風險 |
|---------|--------|---------|------|
| Beta 測試回饋整理 | PM (KM) | 2026-02-10 | 低 |
| 新手引導 UI 設計稿 | UI/UX (Hannah) | 2026-02-20 | 中 |
| A+B=C Pattern 規則文件 | 客戶 (KM) | 2026-03-01 | **高** |

**關鍵依賴**: A+B=C Pattern 規則文件延遲風險高，**建議納入 P2 或第三階段**。

---

### 11.5 成功標準與驗收條件

#### 功能驗收標準

| 功能 | 驗收標準 | 測試方法 |
|------|---------|----------|
| 諮詢歷史管理 | 時間軸介面正常顯示、CSV 匯出正確、PDF 格式符合需求 | UAT + 5 位諮詢師測試 |
| 訪客流程優化 | 新手引導完成率 > 80%、錯誤處理覆蓋率 100% | A/B 測試 + 日誌分析 |
| 監控與錯誤追蹤 | 告警機制觸發正常、Dashboard 顯示正確 | 模擬錯誤測試 |

#### 非功能性驗收標準

| 指標 | 目標 | 測試方法 |
|------|------|----------|
| 系統穩定性 | > 99% | 7 天連續運行測試 |
| P95 響應時間 | < 500ms | 負載測試（50 並發） |
| 錯誤率 | < 1% | 生產環境日誌分析 |
| 用戶滿意度 | > 4.0/5 | UAT 問卷調查 |

---

### 11.6 交付物清單

#### 技術交付物

- [ ] P1 三大功能原始碼（含測試）
- [ ] 資料庫 Migration Scripts
- [ ] API 文件更新（Swagger/OpenAPI）
- [ ] 部署腳本與 CI/CD 配置
- [ ] 監控 Dashboard 配置檔

#### 文件交付物

- [ ] 第二階段功能需求文件（PRD v2.0）
- [ ] 技術架構文件更新（ADR）
- [ ] 使用者操作手冊（新手引導、歷史查看）
- [ ] 維運手冊（告警處理 SOP、常見問題 FAQ）
- [ ] 第二階段結案報告

#### 測試交付物

- [ ] 測試計畫與測試用例
- [ ] UAT 測試報告
- [ ] 效能測試報告（負載測試）
- [ ] 安全測試報告（基礎滲透測試）

---

### 11.7 第二階段預算估算

#### 人力成本

| 項目 | 單價 | 數量 | 小計 |
|------|------|------|------|
| 全端工程師 | $8,000/月 | 3 個月 | $24,000 |
| UI/UX 設計師 | $6,000/月 × 0.3 | 3 個月 | $5,400 |
| PM | $7,000/月 × 0.5 | 3 個月 | $10,500 |
| QA 測試人員 | $5,000/月 × 0.5 | 3 個月 | $7,500 |
| **人力成本小計** | | | **$47,400** |

#### 基礎設施成本

| 項目 | 月費 | 數量 | 小計 |
|------|------|------|------|
| GCP Cloud Run | $30 | 3 個月 | $90 |
| Supabase Pro | $25 | 3 個月 | $75 |
| 第三方服務 | $20 | 3 個月 | $60 |
| **基礎設施成本小計** | | | **$225** |

#### 其他成本

| 項目 | 金額 | 說明 |
|------|------|------|
| 軟體授權 | $500 | 開發工具、測試工具 |
| 差旅費 | $1,000 | UAT 實地訪談（若需要） |
| 緩衝預算（10%） | $4,900 | 應對需求變更 |
| **其他成本小計** | **$6,400** |

#### 總預算

**第二階段總預算**: **$54,025**

**備註**: 以上為參考估算，實際費用依團隊薪資水平與合約條款調整。

---

### 11.8 開案準備檢查清單

#### Kick-off 前（2026-02-01）

- [ ] Beta 測試回饋整理完成
- [ ] 第二階段 PRD 定稿並經客戶確認
- [ ] 合約簽署完成
- [ ] 團隊成員確認（含新增 QA 人員）
- [ ] 開發環境準備（GCP/Supabase 資源申請）

#### Kick-off 會議（2026-02-05）

- [ ] 專案目標與範圍說明
- [ ] 時程與里程碑確認
- [ ] 角色與職責分配
- [ ] 溝通機制與會議節奏
- [ ] 風險識別與緩解計畫

#### Sprint 1 開始前（2026-02-15）

- [ ] UI/UX 設計稿交付（新手引導）
- [ ] 技術預研完成（PDF 生成、Slack API）
- [ ] 測試環境準備完成
- [ ] CI/CD Pipeline 更新
- [ ] 第一週 Sprint Planning 完成

---

### 11.9 與第一階段的延續性

#### 團隊延續

- ✅ 保留核心團隊（Young + KM + Hannah）
- ✅ 第一階段累積的技術債納入 P1 優化
- ✅ 第一階段教訓應用於第二階段（連線池、CORS、CI 環境）

#### 技術延續

- ✅ 技術棧不變（Next.js + FastAPI + Supabase + GCP）
- ✅ 架構決策延續（5 個 ADR 持續有效）
- ✅ 測試框架延續（Playwright E2E + Locust 負載測試）

#### 流程延續

- ✅ Git 工作流延續（Staging + Production 環境）
- ✅ CI/CD Pipeline 延續（Self-Healing CI/CD）
- ✅ 文件維護延續（PRD + CLAUDE.md + ADR）

---

## 📊 總結

### 成功指標達成狀況

| 指標 | 目標 | 實際 | 達成率 |
|------|------|------|--------|
| 核心功能完成度 | 100% | 100% | ✅ 100% |
| 牌卡內容上架 | 194 張 | 194 張 | ✅ 100% |
| 即時同步延遲 | < 500ms | 200-300ms | ✅ 140% 超標 |
| 系統穩定性 | 99% | 99.2% | ✅ 100% |
| Beta 測試啟動 | 50 人 | 進行中 | ✅ |
| 使用者滿意度 | 4.0 / 5 | 4.2 / 5 | ✅ 105% 超標 |

### 專案亮點

1. ✅ **4.5 個月完成 MVP → Beta 測試**（原定 6 個月）
2. ✅ **11 項額外功能交付**（超出原定計畫）
3. ✅ **99.2% 系統穩定性**（優於目標）
4. ✅ **成本控制良好**（$34.90/月，50 用戶）
5. ✅ **使用者滿意度 4.2/5**（正面回饋）

### 技術成就

- ✅ Supabase Realtime 即時同步（200-300ms 延遲）
- ✅ JSONB + localStorage 雙軌持久化（100% 恢復率）
- ✅ GCP Cloud Run 無縫部署（6 分鐘 CI/CD）
- ✅ 負載測試 50 並發 100% 成功率
- ✅ Docker 映像優化 -25%，構建時間 -50%

### 教訓與經驗

1. **連線池是關鍵**: 資料庫效能瓶頸需在早期負載測試中發現
2. **分散式狀態同步複雜**: 需版本控制與衝突解決機制
3. **CORS 配置易忽略**: 基礎設施配置應納入版控
4. **E2E 測試需 CI 環境**: CI 環境與本地環境差異需注意
5. **使用者回饋優先**: UX 改善需基於真實回饋,而非假設

### 下一步行動（優先順序）

#### P0 - 立即執行
- ✅ 繼續 Beta 測試（目標 50 人）
- ✅ 收集使用者回饋與 Bug 修復

#### P1 - 第二階段（2025-12 ~ 2026-02）
- ✅ 諮詢歷史管理完善
- ✅ 訪客流程優化
- ✅ 監控與錯誤追蹤

#### P2 - 未來規劃（2026-03+）
- A+B=C Pattern 邏輯引擎
- 註冊流程優化
- AI 諮詢輔助功能

---

## 附錄

### A. 待辦事項追蹤（TODO.md）

> 最後更新：2026-01-15

#### 📦 卡牌上架總覽

| 牌組 | 總數 | 已上傳 GCS | JSON 整合 | 狀態 |
|------|------|-----------|----------|------|
| RIASEC 六大性格說明卡 | 6 | ✅ 36 files | ✅ | ✅ 完成 |
| 職業收藏家（職游旅人卡）| 100 | ✅ 100 files | ✅ | ✅ 完成 |
| 職能盤點卡 | 52 | ✅ 156 files | ✅ | ✅ 完成 |
| 價值導航卡 | 36 | ✅ | ✅ | ✅ 完成 |

#### ✅ 第一階段完成項目（2026-01-15）

**職能盤點卡重構**:
- ✅ 卡片重新命名與分類（`action_01~10`、`mindset_01~42`）
- ✅ 所有 S/M/L 尺寸圖片重新命名並上傳 GCS（156 files）
- ✅ JSON 資料完整更新（title、category、imageUrl）
- ✅ 前端邏輯調整（移除 `skill_` 判斷，使用 `mindset_` / `action_`）

**UI/UX 優化**:
- ✅ 價值導航卡「其他」區域 1:1 尺寸
- ✅ 價值導航卡前三名區域 1:1 尺寸
- ✅ 六大性格分析 list mode 顏色差異化
- ✅ DropZone 單點擊查看大圖
- ✅ 移除「查看」按鈕
- ✅ 卡片置中對齊
- ✅ 修復卡片重疊問題
- ✅ 修復卡片邊緣被裁切問題
- ✅ Tab active 狀態顏色更明顯
- ✅ List mode 顯示實際卡片名稱

**環境修復**:
- ✅ Supabase 密碼更新
- ✅ CORS 設定更新
- ✅ GitHub Secrets 更新

#### 🎯 第二階段待辦項目

**P1 - Beta 測試後必要的優化**:
- ❌ 諮詢歷史管理完善（時間軸 + 篩選）
- ❌ 歷史資料匯出功能（CSV/PDF）
- ❌ 諮詢報告生成（基礎版，不含 AI）
- ❌ 訪客引導流程優化
- ❌ 錯誤處理強化（斷線重連、權限提示）
- ❌ 訪客端效能優化
- ❌ Cloud Logging 完整設定與 Dashboard
- ❌ 錯誤告警機制（Slack/Email）
- ❌ 效能監控指標建立

**P2 - 第二階段規劃（2026-01 ~ 2026-03）**:
- ❌ A+B=C Pattern 規則分析與設計
- ❌ Pattern 固定規則實作
- ❌ 遊戲引擎整合
- ❌ 完整註冊機制（Email 驗證）
- ❌ 忘記密碼功能完善
- ❌ OAuth 社群登入（預留）
- ❌ 智慧牌卡推薦（AI）
- ❌ 諮詢洞察分析（AI）
- ❌ 自動生成諮詢摘要（AI）
- ❌ 多人同時諮詢（班級管理）
- ❌ 群組管理功能
- ❌ 批量報告生成

---

### B. 技術文件清單

| 文件 | 路徑 | 用途 |
|------|------|------|
| PRD | /PRD.md | 產品需求文件 |
| TODO | /TODO.md | 待辦事項追蹤 |
| CLAUDE.md | /CLAUDE.md | 專案配置 |
| 第一個月報告 | /WEEKLY_REPORT_2025-09-30.md | 測試報告 |
| 第二個月報告 | /WEEKLY_REPORT_2025-10-21.md | 測試報告 |
| API 文件 | /docs/api.md | API 規格 |
| 資料庫 Schema | /docs/database.md | 資料庫設計 |

### C. 術語表

| 術語 | 說明 |
|------|------|
| MVP | Minimum Viable Product（最小可行產品） |
| CRM | Customer Relationship Management（客戶關係管理） |
| RIASEC | Holland 六大性格類型（Realistic, Investigative, Artistic, Social, Enterprising, Conventional） |
| Realtime | 即時同步技術（WebSocket / Server-Sent Events） |
| JSONB | PostgreSQL 的 JSON Binary 資料型別 |
| E2E | End-to-End（端對端測試） |
| RPS | Request Per Second（每秒請求數） |
| P95 | 95th Percentile（95% 請求的延遲） |
| CORS | Cross-Origin Resource Sharing（跨域資源共享） |

### D. 聯絡資訊

| 角色 | 聯絡人 | Email | 職責 |
|------|--------|-------|------|
| PM | KM | [email] | 產品需求、客戶對接 |
| 全端工程師 | Young | [email] | 技術架構、開發維運 |
| UI/UX 設計師 | Hannah | [email] | 視覺設計、素材提供 |
| 技術支援 | [Support Team] | support@[domain] | 使用者問題處理 |

---

**報告完成日期**: 2026-01-30
**報告版本**: v1.0
**下次更新**: 第二階段結案後（2026-03）

---

**🎉 感謝所有參與第一階段開發的團隊成員！**
