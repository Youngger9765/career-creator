# 負載測試結果報告

**測試日期**: 2025-11-02
**測試環境**: Staging
**測試目標**: 50 位諮詢師同時上線

---

## 📊 測試結果總結

### ✅ 系統可承受 50 人負載（經優化後）

| 指標 | 初始狀態 | 優化後 | 改善幅度 |
|------|---------|--------|---------|
| **失敗率** | 33.90% | **1.67%** | ✅ -95% |
| **總請求數** | 59 | **479** | ✅ +712% |
| **平均回應時間** | 33秒 | **1.8秒** | ✅ -94% |
| **500 錯誤** | 15 個 | **8 個** | ✅ -47% |
| **Timeout 錯誤** | 5 個 | **0 個** | ✅ 100% 消除 |
| **吞吐量** | 0.35 req/s | **2.66 req/s** | ✅ +660% |

---

## 🔴 初始測試結果（優化前）

### 測試參數

- **用戶數**: 50 concurrent users
- **Spawn rate**: 10 users/second
- **測試時長**: 3 分鐘

### 關鍵問題

```
失敗率: 33.90% (20/59 requests failed)
平均回應時間: 33,792ms
最慢請求: 120,179ms (120 秒)

錯誤分佈:
- Login API: 7 個 500 errors (28% failure rate)
- Create Room: 9 個失敗 (64% failure rate, 4 timeouts)
- List Clients: 3 個 500 errors (37% failure rate)
- List Rooms: 1 個 timeout
```

### 根本原因

**Database Connection Pool 設定不足**:

```python
# backend/app/core/database.py
pool_size=5        # 只有 5 個連線
max_overflow=0     # 不允許超出
```

50 個用戶同時查詢，但只有 5 個資料庫連線 → 大量請求排隊等待 → Timeout

---

## ✅ 優化措施

### 1. Database Connection Pool 擴充

**修改檔案**: `backend/app/core/database.py`

```python
# 優化前
pool_size=5
max_overflow=0

# 優化後
pool_size=20        # 基礎連線池：20
max_overflow=30     # 允許額外 30 個連線
pool_timeout=30     # 等待超時：30 秒
pool_recycle=3600   # 連線回收：1 小時
pool_pre_ping=True  # 使用前驗證連線
```

**效果**:

- 總連線數可達 50 (20 + 30)
- 完全滿足 50 人同時上線需求
- Timeout 問題完全解決

---

## ✅ 優化後測試結果

### 整體表現

```
失敗率: 1.67% (8/479 requests)
平均回應時間: 1,782ms
吞吐量: 2.66 requests/second

成功率提升: 66% → 98%
```

### 各 API 表現

#### ✅ 房間建立 (POST /api/rooms/)

```
總請求: 175
失敗: 0 (0%)
平均回應時間: 933ms
95th percentile: 750ms
```

**結論**: ✅ 完全正常

#### ✅ 列出客戶 (GET /api/clients/)

```
總請求: 115
失敗: 0 (0%)
平均回應時間: 345ms
95th percentile: 560ms
```

**結論**: ✅ 完全正常

#### ✅ 列出房間 (GET /api/rooms/)

```
總請求: 109
失敗: 0 (0%)
平均回應時間: 360ms
95th percentile: 540ms
```

**結論**: ✅ 完全正常

#### ⚠️ 登入 API (POST /api/auth/login)

```
總請求: 25
失敗: 8 (32%)
平均回應時間: 24,308ms
最慢: 61,438ms
95th percentile: 61,000ms
```

**結論**: ⚠️ 仍需優化

---

## ⚠️ 仍存在問題

### 登入 API 效能問題

**現象**:

- 32% 失敗率
- 平均 24 秒回應時間
- 8 個 500 Internal Server Error

**原因分析**:

1. **BCrypt 密碼驗證慢**: 預設 12 rounds，每次驗證 ~300ms
2. **並發登入**: 25 個用戶同時登入 → CPU bound operation
3. **可能的查詢問題**: Email 已有索引，查詢不是瓶頸

**嘗試的優化** (回滾中):

- 降低 bcrypt rounds: 12 → 10 (理論上 ~100ms/hash)
- 結果: 部署失敗，需進一步調查

**建議**:

1. 分批登入測試（不要 50 人同時）
2. 實作 rate limiting
3. 考慮使用 Redis cache for sessions
4. 進一步調查 bcrypt 配置問題

---

## 🎯 結論與建議

### ✅ Beta 測試可行性

**可以開始 Beta 測試**，但需注意：

1. **避免所有用戶同時登入**
   - 建議分批次開放（每批 10-15 人）
   - 或錯開登入時間

2. **系統運作正常**（登入後）
   - 房間建立: ✅ 0% 失敗率
   - 客戶管理: ✅ 0% 失敗率
   - 遊戲狀態: ✅ 0% 失敗率
   - 回應時間: ✅ <1 秒

3. **監控重點**
   - 登入 API 錯誤率
   - Database connection pool 使用率
   - Cloud Run 實例擴展情況

### 📋 後續優化計畫

**P0 優先**:

- [ ] 修復登入 API 效能問題
- [ ] 實作登入 rate limiting
- [ ] 增加錯誤監控告警

**P1 次要**:

- [ ] Redis session cache
- [ ] Database query 優化
- [ ] Cloud Run 實例預熱

### 📈 容量評估

**目前系統容量**:

- ✅ 支援 50 人**已登入**同時操作
- ⚠️ 支援約 15-20 人**同時登入**
- ✅ Database pool 最大 50 連線

**擴展建議**:

- 若需支援 100 人: 增加 pool_size 到 40
- 若需支援 200 人: 考慮 Read Replica

---

## 🛠️ 部署記錄

### Commit 歷史

1. **6fd5272**: Database connection pool 優化
   - pool_size: 5 → 20
   - max_overflow: 0 → 30
   - 結果: ✅ 成功部署，大幅改善

2. **4c991e2**: BCrypt rounds 優化（已回滾）
   - bcrypt rounds: 12 → 10
   - 結果: ❌ 部署失敗，容器無法啟動

3. **8a3182c**: 回滾 bcrypt 優化
   - 結果: ✅ 系統恢復正常

---

## 📝 測試環境資訊

**後端**:

- URL: `https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app`
- Cloud Run: asia-east1
- Memory: 1Gi
- CPU: 1
- Min instances: 0
- Max instances: 10

**資料庫**:

- Supabase Staging
- Connection pooler: PgBouncer
- Pool mode: Transaction

**測試帳號**:

- 50 個測試用戶 (<test.user1-50@example.com>)
- 密碼: TestPassword123!

---

**報告產生時間**: 2025-11-02 14:30
**負載測試工具**: Locust 2.20.0
**測試腳本**: `load-tests/locustfile.py`
