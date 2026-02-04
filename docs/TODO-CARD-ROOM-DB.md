# TODO: Card Room Database Design

## Problem Statement

目前遊戲狀態（卡牌位置、設定等）只存在 localStorage：
- 換電腦/瀏覽器 → 資料消失
- 清除瀏覽器資料 → 資料消失
- 無法生成歷史報告

## Proposed Solution: Hybrid Architecture

### Database Schema

```sql
-- 遊戲狀態表
CREATE TABLE gameplay_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    gameplay_id VARCHAR(50) NOT NULL,  -- 'personality_assessment', 'value_ranking', etc.
    state JSONB NOT NULL,              -- { cards: {...}, settings: {...}, uploadedFile: {...} }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(room_id, gameplay_id)       -- 每個房間每種玩法只有一個狀態
);

-- 索引
CREATE INDEX idx_gameplay_states_room ON gameplay_states(room_id);
CREATE INDEX idx_gameplay_states_updated ON gameplay_states(updated_at);
```

### API Endpoints

```
GET  /api/rooms/{room_id}/gameplay/{gameplay_id}
POST /api/rooms/{room_id}/gameplay/{gameplay_id}
```

### Sync Strategy

1. **Load**: DB → localStorage → UI
2. **Save**: UI → localStorage (instant) → DB (debounced 2s)
3. **Conflict**: DB `updated_at` wins

### Frontend Hook Changes

```typescript
// useGameplayStatePersistence.ts
// 目前只存 localStorage
// 需要改成：
// - isRoomOwner: 存 DB + localStorage
// - isVisitor: 只用 localStorage (靠 realtime sync)
```

## Questions to Decide

- [ ] 訪客的操作要不要也存 DB？還是只存 owner 的最終狀態？
- [ ] 歷史版本需要嗎？還是只存最新狀態？
- [ ] 狀態過期策略？（room 過期時一起刪除？）
- [ ] 需要 API 權限控制嗎？（只有 owner 能寫？）

## Implementation Priority

1. Backend: 建表 + API
2. Frontend: 修改 `useGameplayStatePersistence` hook
3. Migration: 現有 localStorage 資料遷移到 DB

## Related Files

- `frontend/src/hooks/use-gameplay-state-persistence.ts`
- `frontend/src/hooks/use-unified-card-sync.ts`
- `frontend/src/hooks/use-card-sync.ts`
- `backend/app/models/` (new model needed)
- `backend/app/api/` (new endpoints needed)

---
Created: 2026-02-04
Status: Planning
