# Backend 並發處理問題報告

## 執行日期

2025-11-02

---

## 問題描述

**嚴重性**: 🔴 **Critical Blocker**

Backend 無法處理 50 個並發請求，所有 API 在負載測試時完全無回應。

---

## 測試結果

### Test 3: Gameplay States 並發保存

```text
狀態: ❌ 失敗
並發數: 50
結果: 所有請求超時 (>120s)
```

### Test 4: 訪客加入壓力測試

```text
狀態: ❌ 失敗
並發數: 50
結果: Owner 登入成功，但後續 50 個訪客請求全部 HTTP 422 或超時
```

### Health Check

```bash
curl https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app/health
# ✅ 正常響應 (98ms)
```

**結論**: Health endpoint 正常，但業務 API 在並發負載下失效。

---

## 根本原因分析

### 1. Database Connection Pool 不足

**當前配置** (`backend/app/core/database.py`):

```python
pool_size=15
max_overflow=10
# 最多 25 個並發連接
```

**問題**:

- 50 個並發請求 = 至少需要 50 個 DB 連接
- Connection pool 只有 25 個 → 25 個請求阻塞等待

**解決方案**:

```python
# 調整為
pool_size=50
max_overflow=25
# 最多 75 個並發連接
```

---

### 2. BCrypt 密碼驗證太慢

**當前配置**:

```python
bcrypt_rounds = 10  # 已優化過
```

**性能**:

- 單次 BCrypt hash: ~100ms
- 50 個並發登入: 50 × 100ms = 5000ms CPU 時間
- Cloud Run 單實例 CPU 限制: 1 vCPU

**問題**:

- 即使 10 rounds，50 個並發仍然導致 CPU 飽和
- 請求排隊等待 CPU 資源

**解決方案**:

1. **短期**: 降低到 8 rounds (不建議，安全性下降)
2. **中期**: 實作 API rate limiting
3. **長期**: 改用 JWT refresh token 機制，減少登入頻率

---

### 3. Cloud Run 配置不足

**當前配置** (需確認):

```yaml
# .github/workflows/deploy-backend-staging.yml
--concurrency: ? (預設 80)
--max-instances: ? (預設 100)
--min-instances: ? (預設 0)
--memory: ? (預設 512Mi)
--cpu: ? (預設 1)
```

**問題**:

- 冷啟動延遲 (如果 min-instances=0)
- 單實例並發限制過低
- 記憶體/CPU 不足處理高負載

**解決方案**:

```yaml
--concurrency: 100  # 單實例最多 100 並發請求
--max-instances: 10 # 最多啟動 10 個實例
--min-instances: 1  # 始終保持 1 個暖實例
--memory: 1Gi       # 增加記憶體
--cpu: 2            # 增加 CPU (如果可用)
```

---

### 4. 缺少 Rate Limiting

**問題**:

- 沒有 API rate limiting 保護
- 50 個並發請求直接打到 Backend
- 沒有 request throttling/queueing 機制

**解決方案**:

1. **FastAPI Middleware**: 實作 `slowapi` rate limiting

   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address

   limiter = Limiter(key_func=get_remote_address)

   @app.post("/api/auth/login")
   @limiter.limit("10/minute")  # 限制每分鐘 10 次登入
   async def login(...):
       ...
   ```

2. **Cloud Run Load Balancer**: 配置 request throttling

---

## 修復建議

### 優先級 P0 (立即修復)

1. **調整 Database Connection Pool**

   ```python
   # backend/app/core/database.py
   pool_size=50,
   max_overflow=25,
   pool_pre_ping=True,
   pool_recycle=3600
   ```

2. **增加 Cloud Run 資源**

   ```yaml
   # .github/workflows/deploy-backend-staging.yml
   --concurrency=100
   --max-instances=10
   --min-instances=1
   --memory=1Gi
   --cpu=2  # 如果 staging 環境支援
   ```

3. **部署並重新測試**

   ```bash
   git add backend/app/core/database.py .github/workflows/
   git commit -m "perf: increase connection pool and Cloud Run resources for 50 concurrent users"
   git push origin staging
   # 等待部署完成後重新運行 Test 3 & 4
   ```

---

### 優先級 P1 (本週完成)

4. **實作 Rate Limiting**

   ```python
   # backend/app/main.py
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.errors import RateLimitExceeded

   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

   # 在 auth.py
   @router.post("/login")
   @limiter.limit("20/minute")  # 每分鐘最多 20 次登入
   async def login(...):
       ...
   ```

5. **監控與日誌**

   ```python
   # 加入 structured logging
   import structlog

   logger = structlog.get_logger()
   logger.info("login_attempt", email=email, duration_ms=duration)
   ```

---

### 優先級 P2 (長期優化)

6. **改進認證機制**

   - JWT Refresh Token
   - Session management
   - 減少登入頻率

7. **Database Query 優化**

   - 加入 index
   - 減少 N+1 queries
   - 使用 database connection pooling monitoring

8. **Load Testing CI/CD**
   - 自動化負載測試
   - 每次部署前運行基礎壓力測試

---

## 驗證計畫

修復後需重新驗證:

1. **Test 3**: Gameplay States 並發保存

   ```bash
   python3 test_gameplay_states.py
   # 預期: >95% success rate, <1s P95 latency
   ```

2. **Test 4**: 訪客加入壓力測試

   ```bash
   python3 test_visitor_join.py
   # 預期: 50/50 visitors joined, <500ms P95 latency
   ```

3. **漸進式負載測試**

   ```bash
   # 10 → 25 → 50 users
   # 驗證系統在不同負載下的表現
   ```

---

## 影響評估

### 無法支援的場景

1. ❌ 50 個諮詢師同時登入
2. ❌ 單場諮詢有 >25 個訪客
3. ❌ Beta Testing 同時開放 >25 個房間

### 可支援的場景

1. ✅ 單個諮詢師 + 1-5 個訪客 (正常使用)
2. ✅ Health check 和基礎 API
3. ✅ Realtime Broadcast (50 connections 已驗證)

---

## 結論

**當前系統無法支援 50 人並發使用**，需要立即修復:

1. 調整 Database connection pool (5 分鐘)
2. 增加 Cloud Run 資源配置 (10 分鐘)
3. 部署並重新測試 (15 分鐘)

**預估修復時間**: 30 分鐘

**如果修復失敗**: 需要重新評估系統架構，可能需要:

- 引入 Redis/Celery 處理異步任務
- 使用 Nginx/Load Balancer 做 request throttling
- 改用更強大的 hosting 方案 (非 serverless)

---

**報告產生時間**: 2025-11-02 18:30
**負責人**: Claude Code + Happy
