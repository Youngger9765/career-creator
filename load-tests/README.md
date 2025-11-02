# Load Testing for Career Creator

使用 Locust 進行負載測試，模擬 50 位諮詢師同時上線的場景。

## 安裝

```bash
cd load-tests
pip install -r requirements.txt
```

## 前置準備

### 1. 建立測試帳號（50 個）

在管理員後台使用 CSV 批量匯入：

```csv
email,password,role
test.user1@example.com,TestPassword123!,counselor
test.user2@example.com,TestPassword123!,counselor
...
test.user50@example.com,TestPassword123!,counselor
```

或使用以下腳本生成：

```bash
cd load-tests
python generate_test_users.py > test_users.csv
```

### 2. 匯入測試帳號

1. 登入 Staging 環境管理員後台
2. 進入「用戶管理」
3. 使用 CSV 批量匯入功能
4. 上傳 `test_users.csv`

## 測試場景

### 場景 1：基礎負載測試

測試 50 位諮詢師同時：

- 登入系統
- 建立房間
- 新增客戶
- 儲存遊戲狀態

```bash
locust -f locustfile.py \
  --host=https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app \
  --headless \
  -u 50 \
  -r 10 \
  -t 5m
```

參數說明：

- `-u 50`: 50 個並發用戶
- `-r 10`: 每秒增加 10 個用戶（5 秒內達到 50 人）
- `-t 5m`: 執行 5 分鐘

### 場景 2：Web UI 互動測試

啟動 Web UI，手動調整用戶數量：

```bash
locust -f locustfile.py \
  --host=https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app \
  --web-host=0.0.0.0
```

然後開啟 <http://localhost:8089>，手動設定：

- Number of users: 50
- Spawn rate: 10
- Host: (已設定)

### 場景 3：壓力測試（找出極限）

逐步增加到 100 人，找出系統極限：

```bash
locust -f locustfile.py \
  --host=https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app \
  --headless \
  -u 100 \
  -r 5 \
  -t 10m
```

## 監控指標

### 1. Locust 報告

測試結束後會顯示：

- **Request per second (RPS)**: 每秒請求數
- **Response time (avg/min/max)**: 回應時間
- **Failure rate**: 失敗率（應 < 1%）

### 2. GCP Cloud Run 監控

在測試期間觀察：

```bash
# 開啟 Cloud Run 監控
open "https://console.cloud.google.com/run/detail/asia-east1/career-creator-backend-staging/metrics?project=career-creator-card"
```

關注指標：

- **Request count**: 請求數量
- **Request latency**: 延遲時間（應 < 500ms）
- **Container instance count**: 實例數量（自動擴展）
- **CPU utilization**: CPU 使用率
- **Memory utilization**: 記憶體使用率

### 3. Supabase Database 監控

在 Supabase Dashboard 觀察：

- **Active connections**: 連線數（應 < pooler limit）
- **Query performance**: 查詢效能
- **Database size**: 資料庫大小

## 成功標準

✅ **測試通過條件**：

1. **回應時間**: 95% 請求 < 500ms
2. **失敗率**: < 1%
3. **WebSocket 連線**: 50 個同時連線穩定
4. **資料庫**: 無 connection pool exhausted 錯誤
5. **Cloud Run**: 自動擴展正常運作
6. **記憶體**: 無 OOM (Out of Memory) 錯誤

⚠️ **需要優化的情況**：

- 回應時間 > 1s
- 失敗率 > 5%
- CPU 使用率持續 > 80%
- Database connection pool 耗盡

## 測試任務清單

使用 `@task(weight)` 定義任務權重：

| 任務 | 權重 | 說明 |
|-----|------|------|
| `create_room` | 5 | 建立房間 |
| `list_rooms` | 3 | 列出房間 |
| `create_client` | 4 | 建立客戶 |
| `list_clients` | 3 | 列出客戶 |
| `save_gameplay_state` | 6 | 儲存遊戲狀態（最頻繁） |
| `load_gameplay_state` | 4 | 載入遊戲狀態 |
| `create_note` | 2 | 建立筆記 |
| `health_check` | 1 | 健康檢查 |

權重越高 = 執行頻率越高

## WebSocket 測試

目前版本專注於 HTTP API 測試。WebSocket 連線測試需要額外設定：

```bash
# 安裝 WebSocket 支援
pip install websocket-client

# 執行 WebSocket 測試
python websocket_test.py
```

## 疑難排解

### 問題 1: 測試帳號未建立

**錯誤**: `401 Unauthorized - Login failed`

**解決**:

1. 確認測試帳號已在後台建立
2. 檢查帳號密碼正確性
3. 確認帳號未被停用

### 問題 2: Rate Limiting

**錯誤**: `429 Too Many Requests`

**解決**:

1. 降低 spawn rate (`-r` 參數)
2. 增加 `wait_time` 間隔
3. 檢查 Cloud Run 配額設定

### 問題 3: Database Connection Pool Exhausted

**錯誤**: `500 Internal Server Error - connection pool exhausted`

**解決**:

1. 增加 Supabase connection pool size
2. 優化查詢效率
3. 檢查是否有連線洩漏（connection leak）

## 進階用法

### 分散式測試（多台機器）

Master 節點：

```bash
locust -f locustfile.py --master
```

Worker 節點：

```bash
locust -f locustfile.py --worker --master-host=<master-ip>
```

### 匯出報告

```bash
locust -f locustfile.py \
  --host=https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app \
  --headless \
  -u 50 -r 10 -t 5m \
  --html=report.html \
  --csv=results
```

## 參考資源

- [Locust 官方文件](https://docs.locust.io/)
- [Cloud Run 效能調校](https://cloud.google.com/run/docs/tips/general)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
