# QA Sheet Integration - 規格與 TODO

## 背景脈絡

### 目標
讓 QA 測試員可以透過 `docs/qa-checklist.html` 填寫檢核表後，一鍵提交到 Google Sheets。

### 已完成
- [x] 建立 Service Account: `qa-feedback-writer@career-creator-card.iam.gserviceaccount.com`
- [x] 啟用 Google Sheets API
- [x] 建立 FastAPI 端點: `POST /api/qa/feedback`
- [x] 設定 GitHub Secrets (`QA_SHEET_ID`, `GOOGLE_SHEETS_CREDENTIALS_B64`)
- [x] 更新 CI/CD workflow 自動帶入環境變數
- [x] CORS 支援 `"null"` origin (本地 HTML 檔案)
- [x] API 測試成功，資料可寫入 Sheet

### 待修正問題
目前 API 只寫入「摘要」，沒有寫入每個檢核點的明細，導致無法追蹤哪個步驟 Pass/Fail。

---

## 規格設計

### Google Sheet 結構

#### Tab 1: 測試 (`測試`)
每個檢核點獨立一行，方便追蹤問題。

| 欄位 | 說明 | 範例 |
|------|------|------|
| A: 提交時間 | ISO 時間戳 | 2026-02-04 13:00:00 |
| B: 測試者 | 測試員姓名 | 小明 |
| C: 環境 | staging/production | staging |
| D: 瀏覽器 | Chrome/Safari/Firefox | Chrome |
| E: OS | macOS/Windows/iOS/Android | macOS |
| F: 流程 | Section 名稱 | 諮詢師登入流程 |
| G: 步驟ID | data-id | 1.3 |
| H: 步驟描述 | desc | 點擊「登入」按鈕 |
| I: 預期結果 | expected | 成功進入 Dashboard |
| J: 狀態 | pass/fail/skip | fail |
| K: Bug描述 | 問題描述 | 按鈕沒有反應 |

#### Tab 2: 統計 (`統計`)
每次提交的統計總覽。

| 欄位 | 說明 | 範例 |
|------|------|------|
| A: 提交時間 | ISO 時間戳 | 2026-02-04 13:00:00 |
| B: 測試者 | 測試員姓名 | 小明 |
| C: 環境 | staging/production | staging |
| D: 瀏覽器 | Chrome/Safari/Firefox | Chrome |
| E: OS | macOS/Windows/iOS/Android | macOS |
| F: Pass | 通過數量 | 38 |
| G: Fail | 失敗數量 | 2 |
| H: Skip | 跳過數量 | 5 |
| I: 備註 | 總體備註 | 登入流程有問題 |

---

### API 規格

#### Endpoint
```
POST /api/qa/feedback
```

#### Request Body
```json
{
  "tester_name": "小明",
  "environment": "staging",
  "browser": "chrome",
  "os": "macos",
  "test_date": "2026-02-04 13:00:00",
  "items": [
    {
      "section": "諮詢師登入流程",
      "step_id": "1.1",
      "step_desc": "開啟網站首頁",
      "expected": "看到登入頁面",
      "status": "pass",
      "bug_notes": ""
    },
    {
      "section": "諮詢師登入流程",
      "step_id": "1.2",
      "step_desc": "輸入測試帳號密碼",
      "expected": "可正常輸入",
      "status": "pass",
      "bug_notes": ""
    },
    {
      "section": "諮詢師登入流程",
      "step_id": "1.3",
      "step_desc": "點擊「登入」按鈕",
      "expected": "成功進入 Dashboard",
      "status": "fail",
      "bug_notes": "按鈕沒有反應，console 顯示 CORS 錯誤"
    }
  ],
  "general_comments": "登入流程有問題，其他功能正常"
}
```

#### Response
```json
{
  "success": true,
  "message": "已提交 45 個檢核點（38 Pass / 2 Fail / 5 Skip）",
  "summary": {
    "tester": "小明",
    "date": "2026-02-04 13:00:00",
    "pass": 38,
    "fail": 2,
    "skip": 5
  }
}
```

---

### QA HTML 互動設計

#### 提交流程 UX
1. 用戶填寫基本資訊（姓名、環境、瀏覽器、OS）
2. 用戶逐項點擊 Pass/Fail/Skip
3. 若選擇 Fail，展開 Bug 描述欄位
4. 點擊「提交」按鈕
5. 顯示 Loading 狀態
6. 成功：顯示綠色提示 + 統計摘要
7. 失敗：顯示紅色錯誤訊息

#### 資料收集
```javascript
// 從 HTML 收集每個 test-item 的資料
document.querySelectorAll('.test-item').forEach(item => {
  const section = item.closest('.section');
  items.push({
    section: section.querySelector('h3').textContent,
    step_id: item.dataset.id,
    step_desc: item.querySelector('.desc').textContent,
    expected: item.querySelector('.expected').textContent,
    status: item.dataset.status || 'skip',
    bug_notes: item.nextElementSibling?.querySelector('textarea')?.value || ''
  });
});
```

---

## TODO

### Phase 1: API 更新
- [ ] 更新 `QAFeedbackItem` model 加入新欄位
- [ ] 更新 `submit_qa_feedback` 寫入兩個 Sheet
- [ ] 在 Sheet 建立 `明細` 和 `摘要` 兩個頁籤

### Phase 2: HTML 更新
- [ ] 更新 `submitToSheet()` 收集完整資料
- [ ] 加入 Loading 狀態和成功/失敗提示
- [ ] 優化行動裝置體驗

### Phase 3: 測試與部署
- [ ] 本地測試 API
- [ ] 部署到 staging
- [ ] 用 QA HTML 實際測試

---

## 相關檔案

| 檔案 | 用途 |
|------|------|
| `backend/app/api/qa_feedback.py` | API 端點 |
| `docs/qa-checklist.html` | QA 檢核表 HTML |
| `.github/workflows/deploy-backend.yaml` | CI/CD (含 secrets) |

## 環境變數

| 變數 | 說明 |
|------|------|
| `QA_SHEET_ID` | Google Sheet ID |
| `GOOGLE_SHEETS_CREDENTIALS_B64` | Service Account Key (base64) |

## Sheet URL
https://docs.google.com/spreadsheets/d/1RGVzaVwT-mb41hl0tFKQoPqrDSr2NO3u-pGs78eMehw/edit
