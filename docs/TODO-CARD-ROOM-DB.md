# Card Room DB - Implementation Status

## ✅ ALREADY IMPLEMENTED!

經檢查，整個 Gameplay State 持久化系統已經完整實作：

| 層級 | 檔案 | 狀態 |
|------|------|------|
| DB Migration | `backend/alembic/versions/..._add_gameplay_states_table.py` | ✅ |
| Backend Model | `backend/app/models/gameplay_state.py` | ✅ |
| Backend API | `backend/app/api/gameplay_states.py` | ✅ |
| Frontend API | `frontend/src/lib/api/gameplay-states.ts` | ✅ |
| Persistence Hook | `frontend/src/hooks/use-gameplay-state-persistence.ts` | ✅ |
| Tests | `backend/tests/test_gameplay_states.py` | ✅ |

## Current Behavior

```
Room Owner (isRoomOwner=true):
  - 存到 PostgreSQL
  - 30 秒自動存檔 (if dirty)
  - 離開頁面時存檔
  - 頁面載入時從 DB 讀取

Visitor (isRoomOwner=false):
  - 存到 localStorage
  - 主要靠 Realtime sync 從 Owner 取得狀態
```

## API Endpoints

```
GET  /api/rooms/{room_id}/gameplay-states           # 取得房間所有玩法狀態
GET  /api/rooms/{room_id}/gameplay-states/{gameplay_id}  # 取得特定玩法狀態
PUT  /api/rooms/{room_id}/gameplay-states/{gameplay_id}  # 新增/更新狀態
DELETE /api/rooms/{room_id}/gameplay-states/{gameplay_id}  # 刪除狀態
```

## Potential Improvements

### 1. Reduce Save Latency
目前是 30 秒自動存，可以改成：
- [ ] 每次卡片移動後 debounce 2-3 秒存一次
- [ ] 或保留 30 秒但加一個「手動存檔」按鈕

### 2. Sync Status UI
- [ ] 顯示「已儲存」「儲存中...」狀態給用戶
- [ ] Hook 已有 `lastSavedAt` 和 `isLoading` 可用

### 3. Conflict Handling
- [ ] 如果用戶在多個 tab 打開同一房間，可能會有 race condition
- [ ] 需要考慮 `updated_at` 衝突解決

### 4. Historical Records
- [ ] 目前是 upsert（覆蓋），如果需要歷史記錄要加版本控制

---
Created: 2026-02-04
Status: ✅ IMPLEMENTED (with room for improvements)
