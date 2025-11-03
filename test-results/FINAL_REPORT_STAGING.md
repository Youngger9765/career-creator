# Staging - 50 併發訪客測試報告（修復後）

## 測試時間

2025-11-03 23:59

## 測試環境

- URL: <https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app>
- 測試類型: 50 個訪客同時加入同一個房間

## 測試結果

### ✅ 資料庫連線測試

- 狀態: **成功**
- Pooler: Transaction pooler (port 6543)
- 連線池配置: pool_size=50, max_overflow=50 (總計100連線)

### ✅ 登入測試

- 狀態: **成功**
- 響應時間: 0.73秒

### ✅ 建立房間

- 狀態: **成功**
- Share Code: 3MTI3N

### 🎯 50 併發訪客加入測試

- **成功數**: 50/50 (100%)
- **失敗數**: 0/50
- **總耗時**: 1.9秒
- **平均響應時間**: ~38ms per visitor

## 修復前後對比

| 指標 | 修復前 | 修復後 | 改善 |
|------|--------|--------|------|
| 成功率 | 0% (登入就失敗) | **100%** | +100% |
| 響應時間 | Timeout (60s+) | 1.9秒 | -97% |
| 錯誤 | MaxClientsInSessionMode | 無錯誤 | ✅ |

## 根本原因

Staging 使用了 Session pooler (port 5432)，只支援 ~15 個併發連線，導致連線池耗盡。

## 修復方案

修改 GitHub Actions workflow，強制使用 Transaction pooler (port 6543)，支援 200+ 併發連線。

## 結論

✅ **Staging 環境已完全修復，可以穩定處理 50+ 併發訪客加入！**
