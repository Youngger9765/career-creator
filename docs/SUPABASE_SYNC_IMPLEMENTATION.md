# Supabase Realtime 同步實作指南

## 📋 總覽

使用 Supabase Realtime 實現三階段同步功能：

1. **Phase 1**: Header 在線狀態顯示（Presence）
2. **Phase 2**: 遊戲模式同步（Broadcast + Database）
3. **Phase 3**: 牌卡移動同步（Broadcast + Event Sourcing）

---

## 🏗️ 基礎架構

### Supabase Realtime 三大功能

```javascript
// 1. Presence（記憶體）- 不寫 DB
channel.track({ user_id, name })  // 追蹤在線狀態

// 2. Broadcast（記憶體）- 不寫 DB
channel.send({ type: 'broadcast', event: 'cursor', payload })  // 廣播訊息

// 3. Postgres Changes（資料庫）- 需要 DB
channel.on('postgres_changes', { event: 'UPDATE', table: 'rooms' }, callback)  // 監聽 DB 變化
```

### Channel 架構設計

```javascript
// 一個房間 = 一個 channel = 一個連線
const channel = supabase.channel(`room:${roomId}`)
  .on('presence', ...)     // 在線狀態
  .on('broadcast', ...)    // 即時訊息
  .on('postgres_changes', ...)  // DB 變更
  .subscribe()
```

---

## ✅ Phase 1: Header 在線狀態（已完成 2025-09-29）

### 目標

顯示房間內所有在線用戶，包含諮詢師和訪客

### 技術方案

**純 Presence，不碰 DB**

### 實作架構

```typescript
// 資料流
用戶進入房間
  → 加入 Presence channel
  → 自動廣播給其他人
  → Header 即時更新
  → 離開時自動清除

// 資料結構
interface PresenceUser {
  id: string          // user_id 或 visitor_session
  name: string        // 顯示名稱
  role: 'owner' | 'visitor'
  avatar?: string
  joinedAt: string
}
```

### 核心程式碼

```javascript
// hooks/usePresence.ts
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const channel = useRef<RealtimeChannel>()

  useEffect(() => {
    // 建立 channel
    channel.current = supabase.channel(`room:${roomId}`)

    // 監聽 Presence 同步
    channel.current
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // 有人加入
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // 有人離開
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 發送自己的狀態
          await channel.current.track({
            id: getUserId(),
            name: getUserName(),
            role: getUserRole(),
            joinedAt: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.current?.unsubscribe()
    }
  }, [roomId])

  return { onlineUsers }
}
```

### UI 整合

```jsx
// components/RoomHeader.tsx
function RoomHeader({ roomId }) {
  const { onlineUsers } = usePresence(roomId)

  return (
    <div className="room-header">
      <div className="online-users">
        <span>在線 ({onlineUsers.length})</span>
        {onlineUsers.map(user => (
          <div key={user.id} className="user-badge">
            <span className="status-dot online" />
            <span>{user.name}</span>
            {user.role === 'owner' && <span>👑</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 注意事項

- 不需要建立任何資料表
- 資料只在記憶體，重啟會消失
- 自動處理斷線清理
- 一個用戶 = 一個連線

---

## ✅ Phase 2: 遊戲模式同步（已完成 2025-09-29）

### 目標

Room owner 切換遊戲模式時，所有人畫面同步切換

### 實際實作方案

**純 Broadcast + localStorage（不使用 Database）**

#### 為什麼改變方案？

- 簡化實作，不需要後端 API
- 降低成本，Broadcast 不計費
- Owner 的 localStorage 作為真相來源
- 足夠應付 MVP 需求

### 實作架構

```typescript
// 資料流
Owner 切換遊戲
  → 更新 localStorage
  → Broadcast 事件給所有人
  → 所有人收到立即切換
  → 新加入者發送 request_state
  → Owner 從 localStorage 回傳當前狀態

// 資料結構
interface GameModeState {
  deck: string          // 牌組名稱
  gameRule: string      // 玩法名稱
  gameMode: string      // 遊戲模式ID
}
```

### 命名統一問題與解決

#### 問題：Root Cause

- UI 組件使用 `personality_analysis`
- 同步系統使用 `personality_assessment`
- 兩套命名不一致導致「玩法尚未實作」錯誤

#### 解決方案

```typescript
// 建立統一常數定義
// /frontend/src/constants/game-modes.ts
export const GAMEPLAY_IDS = {
  PERSONALITY_ASSESSMENT: 'personality_assessment',
  ADVANTAGE_ANALYSIS: 'advantage_analysis',
  // ...
}

// 所有地方使用同一套常數
```

### 核心程式碼

```typescript
// hooks/useGameModeSync.ts
export function useGameModeSync(options: UseGameModeSyncOptions) {
  const { roomId, isOwner, initialState, onStateChange } = options

  const [syncedState, setSyncedState] = useState<GameModeState>(initialState)
  const [ownerOnline, setOwnerOnline] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Owner: 從 localStorage 載入狀態
  useEffect(() => {
    if (isOwner && typeof window !== 'undefined') {
      const storageKey = `career_creator_game_mode_${roomId}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSyncedState(parsed)
      }
    }
  }, [isOwner, roomId])

  // 切換遊戲模式 (Owner only)
  const changeGameMode = useCallback((deck, gameRule, gameMode) => {
    if (!isOwner || !channel) return

    const newState = { deck, gameRule, gameMode }

    // 更新本地狀態
    setSyncedState(newState)
    persistState(newState)  // 存 localStorage

    // Broadcast 給其他人
    channel.send({
      type: 'broadcast',
      event: 'mode_changed',
      payload: newState
    })
  }, [isOwner, channel])

  // 監聽事件
  useEffect(() => {
    const gameChannel = supabase.channel(`room:${roomId}:gamemode`)

    // 監聽模式變更
    gameChannel.on('broadcast', { event: 'mode_changed' }, ({ payload }) => {
      setSyncedState(payload)
      onStateChange?.(payload)
    })

    // 新用戶請求狀態
    gameChannel.on('broadcast', { event: 'request_state' }, () => {
      if (isOwner) {
        gameChannel.send({
          type: 'broadcast',
          event: 'current_state',
          payload: syncedState
        })
      }
    })

    // Owner Presence 追蹤
    gameChannel.on('presence', { event: 'sync' }, () => {
      const state = gameChannel.presenceState()
      const users = Object.values(state).flat()
      const ownerExists = users.some(u => u.role === 'owner')
      setOwnerOnline(ownerExists)
    })

    gameChannel.subscribe()

    return () => gameChannel.unsubscribe()
  }, [roomId, isOwner])

  return { syncedState, ownerOnline, changeGameMode, canInteract }
}
```

### 關鍵功能

#### 1. 權限控制

```typescript
// Owner 離線時房間凍結
const canInteract = isOwner || ownerOnline

// 訪客無法切換模式
if (!canInteract) {
  console.warn('Cannot select game - owner is offline')
  return
}
```

#### 2. 視覺回饋

```typescript
// 同步狀態指示器
<div className="bg-white rounded-lg shadow-lg px-3 py-2">
  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
  <span>{isConnected ? '已同步' : '未連線'}</span>
</div>

// Owner 離線遮罩層
{!canInteract && (
  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm">
    <div className="text-center">
      <span className="text-6xl">⏸️</span>
      <h3>等待諮詢師回來</h3>
      <p>諮詢師離線時，房間暫時凍結</p>
    </div>
  </div>
)}
```

#### 3. 按鈕權限

```typescript
// 「切換遊戲模式」按鈕僅諮詢師可見
{isCounselor && currentGameplay && (
  <button onClick={() => setCurrentGameplay('')}>
    切換遊戲模式
  </button>
)}
```

### UI 整合

```jsx
// components/GameContainer.tsx
function GameContainer({ roomId, isOwner }) {
  const { currentGameType, changeGameMode } = useGameModeSync(roomId, isOwner)

  return (
    <>
      {isOwner && (
        <GameModeSelector
          current={currentGameType}
          onChange={changeGameMode}
        />
      )}

      {/* 根據 currentGameType 顯示對應遊戲 */}
      {currentGameType === 'life' && <LifeGame />}
      {currentGameType === 'value' && <ValueGame />}
      {currentGameType === 'traveler' && <TravelerGame />}
    </>
  )
}
```

### 實作成果

- ✅ 純 Broadcast 實現，不需要資料庫
- ✅ Owner 狀態持久化到 localStorage
- ✅ 新用戶加入自動獲取當前狀態
- ✅ Owner 離線時房間凍結
- ✅ 統一命名系統避免 bug
- ✅ 視覺化同步狀態顯示
- ✅ 訪客權限控制完善

---

## 🃏 Phase 3: 牌卡移動同步（3-4 天）

### 目標

所有人的牌卡移動即時同步，並保存操作歷史

### 技術方案

**Broadcast（即時） + Event Sourcing（持久化）**

### 實作架構

```typescript
// 資料流
用戶移動牌卡
  → 樂觀更新（本地立即顯示）
  → Broadcast 給其他人（即時同步）
  → 寫入 card_events 表（事件記錄）
  → 衝突時用 timestamp 判定

// 事件類型
type CardEvent = {
  id: string
  roomId: string
  gameType: string
  cardId: string
  action: 'move' | 'flip' | 'select'
  fromArea?: string
  toArea?: string
  position?: { x: number, y: number }
  performedBy: string
  timestamp: string
}
```

### 資料庫設計

```sql
-- 事件表（已存在）
CREATE TABLE IF NOT EXISTS card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50) NOT NULL,
  card_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  from_area VARCHAR(100),
  to_area VARCHAR(100),
  position JSONB,
  metadata JSONB,
  performed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲狀態快照（定期保存）
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  game_type VARCHAR(50) NOT NULL,
  state JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, game_type)
);
```

### 核心程式碼

```javascript
// hooks/useCardSync.ts
export function useCardSync(roomId: string, gameType: string) {
  const [cards, setCards] = useState<Card[]>([])
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map>()
  const channel = useRef<RealtimeChannel>()

  useEffect(() => {
    // 初始化：載入遊戲狀態
    loadGameState()

    // 建立 channel
    channel.current = supabase.channel(`room:${roomId}`)
      // 監聽牌卡移動
      .on('broadcast', { event: 'card-move' }, ({ payload }) => {
        handleRemoteCardMove(payload)
      })
      // 監聽批次更新
      .on('broadcast', { event: 'cards-batch-update' }, ({ payload }) => {
        handleBatchUpdate(payload)
      })
      .subscribe()

    return () => {
      channel.current?.unsubscribe()
    }
  }, [roomId, gameType])

  // 移動牌卡
  const moveCard = async (cardId: string, toArea: string, position?: Point) => {
    const optimisticId = generateId()

    // 1. 樂觀更新（立即顯示）
    setCards(prev => updateCardPosition(prev, cardId, toArea, position))
    setOptimisticUpdates(prev => prev.set(optimisticId, { cardId, toArea }))

    // 2. Broadcast 給其他人（即時）
    channel.current?.send({
      type: 'broadcast',
      event: 'card-move',
      payload: {
        cardId,
        toArea,
        position,
        performedBy: getUserId(),
        timestamp: Date.now(),
        optimisticId
      }
    })

    // 3. 寫入事件表（持久化）
    const { data, error } = await supabase
      .from('card_events')
      .insert({
        room_id: roomId,
        game_type: gameType,
        card_id: cardId,
        action: 'move',
        to_area: toArea,
        position,
        performed_by: getUserId()
      })
      .select()
      .single()

    if (error) {
      // 回滾樂觀更新
      rollbackOptimisticUpdate(optimisticId)
    } else {
      // 確認樂觀更新
      confirmOptimisticUpdate(optimisticId)
    }
  }

  // 處理遠端更新
  const handleRemoteCardMove = (payload: CardMoveEvent) => {
    // 檢查是否是自己的操作
    if (payload.performedBy === getUserId()) {
      return // 跳過自己的操作
    }

    // 應用更新
    setCards(prev => updateCardPosition(
      prev,
      payload.cardId,
      payload.toArea,
      payload.position
    ))
  }

  // 批次更新（用於複雜操作）
  const batchUpdate = async (updates: CardUpdate[]) => {
    // 1. 樂觀更新
    setCards(prev => applyBatchUpdates(prev, updates))

    // 2. Broadcast
    channel.current?.send({
      type: 'broadcast',
      event: 'cards-batch-update',
      payload: {
        updates,
        performedBy: getUserId(),
        timestamp: Date.now()
      }
    })

    // 3. 批次寫入
    await supabase
      .from('card_events')
      .insert(updates.map(u => ({
        room_id: roomId,
        game_type: gameType,
        ...u,
        performed_by: getUserId()
      })))
  }

  // 定期保存快照
  const saveSnapshot = async () => {
    await supabase
      .from('game_states')
      .upsert({
        room_id: roomId,
        game_type: gameType,
        state: { cards, areas: getAreas() },
        version: getNextVersion()
      })
  }

  return {
    cards,
    moveCard,
    batchUpdate,
    saveSnapshot
  }
}
```

### 衝突處理策略

```javascript
// strategies/conflictResolution.ts

// 策略 1: Last Write Wins (預設)
function lastWriteWins(local: CardState, remote: CardState): CardState {
  return local.timestamp > remote.timestamp ? local : remote
}

// 策略 2: 合併不衝突的操作
function mergeNonConflicting(local: CardState[], remote: CardState[]): CardState[] {
  const merged = new Map()

  // 不同牌卡的操作可以合併
  local.forEach(card => merged.set(card.id, card))
  remote.forEach(card => {
    const existing = merged.get(card.id)
    if (!existing || card.timestamp > existing.timestamp) {
      merged.set(card.id, card)
    }
  })

  return Array.from(merged.values())
}

// 策略 3: 操作佇列
class OperationQueue {
  private queue: CardOperation[] = []

  add(operation: CardOperation) {
    this.queue.push(operation)
    this.process()
  }

  async process() {
    while (this.queue.length > 0) {
      const op = this.queue.shift()
      await this.execute(op)
    }
  }
}
```

### 效能優化

```javascript
// 優化 1: 防抖批次更新
const debouncedBatchUpdate = debounce((updates) => {
  batchUpdate(updates)
}, 100)

// 優化 2: 差異更新
function diffUpdate(oldState: Card[], newState: Card[]): CardUpdate[] {
  return newState
    .filter(card => {
      const old = oldState.find(c => c.id === card.id)
      return !isEqual(old, card)
    })
    .map(card => ({
      cardId: card.id,
      changes: getChanges(oldState, card)
    }))
}

// 優化 3: 壓縮事件
function compressEvents(events: CardEvent[]): CardEvent[] {
  // 合併連續的小移動
  return events.reduce((compressed, event) => {
    const last = compressed[compressed.length - 1]
    if (canMerge(last, event)) {
      last.position = event.position
      return compressed
    }
    return [...compressed, event]
  }, [])
}
```

### 可選功能：游標同步

```javascript
// hooks/useCursorSync.ts (Optional)
export function useCursorSync(roomId: string) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>()

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setCursors(prev => {
          const next = new Map(prev)
          next.set(payload.userId, payload.position)
          return next
        })
      })
      .subscribe()

    // 發送自己的游標位置（節流）
    const sendCursor = throttle((x: number, y: number) => {
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: getUserId(),
          position: { x, y },
          color: getUserColor()
        }
      })
    }, 50) // 每 50ms 最多一次

    window.addEventListener('mousemove', (e) => {
      sendCursor(e.clientX, e.clientY)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return { cursors }
}
```

---

## 📊 整體架構總結

### Channel 使用策略

```javascript
// 所有功能共用一個 channel
const channel = supabase.channel(`room:${roomId}`)
  // Phase 1: 在線狀態
  .on('presence', { event: 'sync' }, handlePresenceSync)

  // Phase 2: 遊戲模式
  .on('broadcast', { event: 'game-mode-change' }, handleGameModeChange)

  // Phase 3: 牌卡同步
  .on('broadcast', { event: 'card-move' }, handleCardMove)
  .on('broadcast', { event: 'cards-batch-update' }, handleBatchUpdate)

  // Optional: 游標
  .on('broadcast', { event: 'cursor' }, handleCursorUpdate)

  .subscribe()
```

### 資料持久化策略

| 資料類型 | 儲存方式 | 原因 |
|---------|---------|------|
| 在線狀態 | 只在記憶體（Presence） | 臨時資料，不需持久化 |
| 遊戲模式 | rooms 表 | 需要持久化，新人要讀取 |
| 牌卡事件 | card_events 表 | 需要歷史記錄，可重播 |
| 遊戲快照 | game_states 表 | 加速載入，定期保存 |
| 游標位置 | 只在記憶體（Broadcast） | 高頻更新，不需持久化 |

### 成本控制

```javascript
// 連線優化
- 一個房間只用一個 channel
- 離開房間必須 unsubscribe
- 背景頁面自動斷線

// 資料優化
- Presence 和游標不寫 DB
- 事件表定期清理（>30天）
- 批次更新減少寫入次數

// 傳輸優化
- 使用差異更新
- 壓縮連續事件
- 節流高頻操作
```

### 實施時程

| Phase | 工作項目 | 時間 | 複雜度 | 狀態 |
|-------|---------|------|--------|------|
| **Phase 1** | Header 在線狀態 | 1-2 天 | ⭐⭐ | ✅ 完成 |
| **Phase 2** | 遊戲模式同步 | 2-3 天 | ⭐⭐⭐ | 待實作 |
| **Phase 3** | 牌卡移動同步 | 3-4 天 | ⭐⭐⭐⭐ | 待實作 |
| **Optional** | 游標同步 | 1 天 | ⭐⭐ | 待實作 |
| **總計** | | 7-10 天 | | |

### 監控指標

```javascript
// 需要監控的指標
1. Realtime 連線數（< 200 免費）
2. 每月 message 數量
3. card_events 表大小
4. 同步延遲（目標 < 500ms）
5. 衝突發生率

// 告警設定
- 連線數 > 180：準備升級
- 延遲 > 1秒：檢查網路
- 衝突率 > 5%：優化策略
```

---

## 🚀 開始實作

### 前置準備

1. **確認 Supabase 設定**

   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **安裝套件**

   ```bash
   npm install @supabase/supabase-js
   ```

3. **初始化 Client**

   ```javascript
   // lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'

   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   ```

4. **開始 Phase 1**
   - 實作 usePresence hook
   - 整合到 RoomHeader
   - 測試多用戶同步

### 測試檢查清單

- [x] Phase 1: 在線狀態即時更新 ✅
- [ ] Phase 2: 遊戲模式同步切換
- [ ] Phase 3: 牌卡移動不掉失
- [ ] 斷線重連正常運作
- [ ] 新加入者看到正確狀態
- [ ] 200 個連線壓力測試

---

*文件更新日期：2025-09-29*
*預計完成日期：2025-10-10*
