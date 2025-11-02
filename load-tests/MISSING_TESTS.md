# 缺少的測試項目

根據專案架構，以下功能尚未進行壓力測試：

## 🎮 核心遊戲功能

### 1. Gameplay States 並發保存/讀取

- **API**: `PUT /api/gameplay-states/rooms/{room_id}`
- **API**: `GET /api/gameplay-states/rooms/{room_id}/{game_type}`
- **場景**: 50-100 個房間同時保存遊戲狀態
- **測試腳本**: ❌ 已刪除 `test_gameplay_states.py`
- **重要性**: 🔴 HIGH - 核心功能

### 2. 多遊戲類型切換

- **遊戲類型**:
  - personality_analysis
  - career_collector
  - advantage_analysis
  - growth_planning
  - position_breakdown
  - value_ranking
  - life_transformation
- **場景**: 用戶在不同遊戲間切換
- **測試腳本**: ❌ 未實作
- **重要性**: 🔴 HIGH

### 3. Card Events (卡片操作)

- **操作**: 拖曳、旋轉、放置 tokens
- **API**: 透過 gameplay state save/load
- **場景**: 高頻率卡片操作
- **測試腳本**: ❌ 未實作
- **重要性**: 🟡 MEDIUM

## 📡 Realtime 功能

### 4. Supabase Realtime Broadcast

- **Channel**: `room:{room_id}`
- **Events**: card_moved, card_rotated, token_placed, state_updated
- **場景**: 100 個房間同時 broadcast
- **測試腳本**: ✅ 存在但未執行 `realtime_test.py`
- **重要性**: 🔴 HIGH - Beta 必測

### 5. WebSocket 連線穩定性

- **場景**: 長時間保持 100 個 WebSocket 連線
- **持續時間**: 5-10 分鐘
- **測試腳本**: ✅ 存在 `realtime_websocket_test.py`
- **重要性**: 🔴 HIGH

## 💾 資料持久化

### 6. Database 大量寫入

- **操作**: Gameplay states 頻繁保存
- **頻率**: 每 30 秒自動保存
- **場景**: 100 個房間 × 5 分鐘 = ~1000 writes
- **測試腳本**: ❌ 未實作
- **重要性**: 🟡 MEDIUM

### 7. Counselor Notes 並發寫入

- **API**: `POST /api/notes/`
- **場景**: 50 個諮詢師同時記錄筆記
- **測試腳本**: ❌ 未實作
- **重要性**: 🟡 MEDIUM

## 📸 媒體處理

### 8. GCS 截圖上傳

- **API**: (需確認 endpoint)
- **場景**: 50 個用戶同時上傳截圖
- **檔案大小**: 1-5 MB per image
- **測試腳本**: ❌ 未實作
- **重要性**: 🟡 MEDIUM

## 🔄 房間管理

### 9. 房間列表查詢

- **API**: `GET /api/rooms/`
- **場景**: 100 個用戶同時查詢自己的房間列表
- **測試腳本**: ✅ 已包含在 locustfile.py
- **重要性**: 🟢 LOW - 已測試

### 10. 房間切換

- **場景**: 用戶在多個房間間切換
- **測試腳本**: ❌ 未實作
- **重要性**: 🟢 LOW

## 👥 訪客功能

### 11. 訪客並發加入 ✅

- **API**: `POST /api/visitors/join-room/{share_code}`
- **場景**: 100 個訪客同時加入房間
- **測試腳本**: ✅ 已測試（test_concurrent_rooms.py）
- **重要性**: ✅ DONE

### 12. 訪客斷線重連

- **場景**: 訪客斷線後重新加入
- **測試腳本**: ❌ 未實作
- **重要性**: 🟢 LOW

## 📊 建議測試優先順序

### 🔴 P0 - 必須在 Beta 前完成

1. **Gameplay States 並發保存/讀取** - 核心功能
2. **Realtime Broadcast** - 即時同步
3. **多遊戲類型切換** - 核心功能

### 🟡 P1 - Beta 期間監控

1. **WebSocket 連線穩定性** - 長時間測試
2. **Database 大量寫入** - 資料累積測試
3. **GCS 截圖上傳** - 媒體處理

### 🟢 P2 - 可後續補強

1. **Card Events 高頻操作**
2. **Counselor Notes 並發**
3. **房間切換**
4. **訪客斷線重連**

---

## 🎯 下一步行動

1. ✅ 恢復 `test_gameplay_states.py`
2. ✅ 執行 Realtime 測試
3. ✅ 撰寫 GCS 上傳測試
4. ✅ 更新 COMPLETE_LOAD_TEST_REPORT.md
5. ✅ 執行所有 P0 測試並記錄結果
