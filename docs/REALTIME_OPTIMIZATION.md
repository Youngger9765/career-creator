# Realtime Bandwidth Optimization

## 問題背景

Supabase Free Plan 每月 5.5 GB 流量，但在 2025-11-03 負載測試後，
流量爆增至 11.86 GB (216%)，導致配額超標。

### 原因分析

1. **負載測試** (2025-11-03): 50 併發訪客 × 2 環境
   = 100 Realtime connections
2. **頻繁 Broadcast**: 每次拖曳卡片都立即廣播 3 個事件
   (drag_start, drag_end, card_moved)
3. **高頻輪詢**: 參與者列表每 10 秒刷新一次

## 優化方案

### 1. Card Sync Throttle/Debounce (預估節省 70%)

#### 實作

- `card_moved`: **throttle 300ms** - 限制最多 1 次 / 300ms
- `drag_end`: **debounce 500ms** - 延遲 500ms 再廣播
- `drag_start`: **不節流** - 保持即時性

#### 程式碼

```typescript
// frontend/src/hooks/use-card-sync.ts
import { throttle, debounce } from '@/lib/throttle-debounce';

const throttledBroadcastMove = useMemo(
  () => throttle((event: CardMoveEvent) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'card_moved',
      payload: event
    });
  }, 300),
  []
);

const debouncedBroadcastDragEnd = useMemo(
  () => debounce((cardId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'drag_end',
      payload: { cardId }
    });
  }, 500),
  []
);
```

### 2. 延長輪詢間隔 (預估節省 20%)

#### 修改

- `use-room-participants`: 10s → **30s**
- 理由: 已有 Presence tracking 提供即時狀態，輪詢只是備援

#### 實作程式碼

```typescript
// frontend/src/hooks/use-room-participants.ts
updateInterval = 30000, // 30 seconds (reduced from 10s)
```

### 3. 自動存檔間隔 (已是 30s，無需調整)

```typescript
// frontend/src/hooks/use-gameplay-state-persistence.ts
setInterval(() => { saveState(); }, 30000); // ✅ Already optimal
```

## 預估效果

| 項目 | 原始 | 優化後 | 節省 |
|------|------|--------|------|
| Card Sync | ~8 GB/月 | ~2.4 GB/月 | -5.6 GB |
| Polling | ~1.5 GB/月 | ~1 GB/月 | -0.5 GB |
| Presence | ~1.5 GB/月 | ~1.5 GB/月 | 0 |
| **總計** | **11 GB/月** | **~4.9 GB/月** | **-6.1 GB** ✅ |

**結果**: 低於 5.5 GB 配額 ✅

## 測試建議

1. **單元測試**: 驗證 throttle/debounce 邏輯
2. **手動測試**: 快速拖曳多張卡片，觀察 broadcast 次數
3. **監控**: 部署後觀察 Supabase Usage Dashboard

## 未來優化 (Optional)

1. **Lazy Connection**: 只在遊戲開始時建立 Realtime
2. **合併事件**: 將 drag_start/end/moved 合併為單一 card_action
3. **資料庫搬遷**: 搬到公司 Supabase（PRD TODO 第4項）

## 相關檔案

- `frontend/src/lib/throttle-debounce.ts` - Utilities
- `frontend/src/hooks/use-card-sync.ts` - Card sync optimization
- `frontend/src/hooks/use-room-participants.ts` - Polling update
- `frontend/src/lib/__tests__/throttle-debounce.test.ts` - Unit tests

## Changelog

- 2025-11-14: 初版實作 (throttle/debounce + polling interval)
