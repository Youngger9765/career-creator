# System Architecture

## Overview

A monorepo architecture with separated frontend (Next.js) and backend (FastAPI) that communicate via REST API.

## Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Drag & Drop**: @dnd-kit
- **API Client**: Axios + React Query

### Backend

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Auth**: JWT (PyJWT)
- **Testing**: pytest + pytest-asyncio

### Infrastructure

- **Database**: PostgreSQL (Supabase)
- **Deployment**: GCP Cloud Run
- **Storage**: GCP Cloud Storage
- **Container**: Docker
- **CI/CD**: GitHub Actions

## System Architecture Diagram

```
┌─────────────────────────────────────────┐
│            Client Browser                │
│         (Next.js Frontend)               │
└─────────────────────────────────────────┘
                    │
                    │ HTTPS
                    ↓
┌─────────────────────────────────────────┐
│          GCP Cloud Run                   │
│         (Frontend Service)               │
└─────────────────────────────────────────┘
                    │
                    │ REST API
                    ↓
┌─────────────────────────────────────────┐
│          GCP Cloud Run                   │
│         (Backend Service)                │
│           (FastAPI)                      │
└─────────────────────────────────────────┘
          │                    │
          ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│    Supabase      │  │  GCP Storage     │
│   PostgreSQL     │  │   (Files)        │
└──────────────────┘  └──────────────────┘
```

## Monorepo Structure

```
career-creator/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities
│   │   │   └── api/        # API client functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   └── v1/         # API version 1
│   │   ├── core/           # Core settings
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app entry
│   ├── tests/              # Test files
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml       # Local development
├── .github/                # CI/CD workflows
└── docs/                   # Documentation
```

## API Design

### Base URL Structure

```
https://api.careercreator.tw/api/v1
```

### Core Endpoints

```
Authentication:
POST   /auth/register
POST   /auth/login
POST   /auth/refresh

Rooms:
GET    /rooms              # List user's rooms
POST   /rooms              # Create new room
GET    /rooms/{id}         # Get room details
DELETE /rooms/{id}         # Delete room

Cards:
GET    /rooms/{id}/events  # Get card events (polling)
POST   /rooms/{id}/events  # Create card event
```

## Data Flow

### Room Creation Flow

```
1. Counselor creates room (Frontend)
   ↓
2. POST /api/v1/rooms (Backend)
   ↓
3. Generate share_code
   ↓
4. Store in PostgreSQL
   ↓
5. Return room details with share link
```

### Card Operation Flow

```
1. User drags card (Frontend)
   ↓
2. Optimistic UI update
   ↓
3. POST /api/v1/rooms/{id}/events
   ↓
4. Store event in PostgreSQL
   ↓
5. Other users poll for updates
```

## Database Schema

### Core Tables

- `users`: Counselor accounts
- `rooms`: Consultation rooms
- `visitors`: Anonymous visitors
- `card_events`: Event sourcing for all card operations

### Event Sourcing Pattern

All card operations are stored as immutable events, allowing:

- Complete history replay
- Audit trail
- Future AI analysis

## Security Considerations

### Authentication

- JWT tokens with refresh mechanism
- Secure password hashing (bcrypt)
- Token expiry: 15 min (access), 7 days (refresh)

### Authorization

- Room owners have full control
- Visitors can only operate cards
- Share codes are random 6-character strings

### Data Protection

- HTTPS everywhere
- Environment variables for secrets
- SQL injection prevention via ORM
- Input validation via Pydantic

## Deployment Strategy

### Development

```bash
docker-compose up  # Runs both services locally
```

### Production

1. Build Docker images
2. Push to GCP Container Registry
3. Deploy to Cloud Run
4. Auto-scaling based on traffic

### Environment Variables

```
# Frontend
NEXT_PUBLIC_API_URL

# Backend
DATABASE_URL
JWT_SECRET
GCS_BUCKET_NAME
```

## Performance Optimizations

### Frontend

- Static generation where possible
- Image optimization with Next.js
- Code splitting
- Lazy loading components

### Backend

- Connection pooling
- Query optimization with indexes
- Async operations
- Redis caching (future)

### Database

- Proper indexing
- JSONB for flexible event data
- Partitioning for events table (future)

## Monitoring & Logging

- GCP Cloud Logging
- Error tracking with Sentry (future)
- Performance monitoring
- Uptime monitoring

## Game Rules Engine Architecture (NEW)

### Three-Layer Universal Framework

Based on iGaming industry best practices, we implement a flexible game rules engine:

```
┌─────────────────────────────────────┐
│      應用層 (Application Layer)      │  ← 用戶交互 + 業務流程
├─────────────────────────────────────┤
│      配置層 (Configuration Layer)    │  ← 規則 + 內容管理
├─────────────────────────────────────┤
│      引擎層 (Engine Layer)           │  ← 核心邏輯 + 狀態管理
└─────────────────────────────────────┘
```

#### Engine Layer (引擎層) - 核心邏輯

**職責：**
- **狀態管理**: 遊戲狀態的存儲、更新、查詢
- **動作執行**: 處理所有遊戲動作的執行邏輯
- **規則驗證**: 驗證動作是否符合當前規則
- **事件發布**: 觸發狀態變更事件

**核心組件：**
```typescript
// 遊戲引擎核心
interface GameEngine {
  // 狀態管理
  getState(roomId: string): GameState;
  updateState(roomId: string, newState: GameState): void;

  // 動作處理
  executeAction(action: GameAction): ActionResult;
  validateAction(action: GameAction, state: GameState): boolean;

  // 事件系統
  publishEvent(event: GameEvent): void;
  subscribeToEvents(callback: EventCallback): void;
}

// 遊戲狀態定義
interface GameState {
  roomId: string;
  ruleId: string;
  cards: Map<string, CardState>;      // 所有牌卡狀態
  zones: Map<string, ZoneState>;      // 所有區域狀態
  players: Map<string, PlayerState>;  // 玩家狀態
  metadata: GameMetadata;             // 額外資訊
  version: number;                    // 版本控制
}

// 動作定義
interface GameAction {
  type: ActionType;                   // FLIP, MOVE, ARRANGE, ANNOTATE
  playerId: string;
  cardId?: string;
  targetZone?: string;
  position?: Position;
  data?: any;
}
```

**實現特點：**
- **規則無關**: 不關心具體規則，只處理通用邏輯
- **狀態不可變**: 每次更新產生新狀態
- **事務安全**: 支持原子操作和回滾
- **並發安全**: 支持多用戶同時操作

#### Configuration Layer (配置層) - 規則與內容

**職責：**
- **規則定義**: 定義各種遊戲規則和限制
- **內容管理**: 管理牌卡內容和布局
- **驗證邏輯**: 實現具體的規則驗證
- **UI配置**: 定義用戶界面布局

**核心組件：**
```typescript
// 規則配置接口
interface GameRuleConfig {
  id: string;
  name: string;
  version: string;

  // 布局配置
  layout: LayoutConfig;

  // 規則配置
  constraints: ConstraintConfig;

  // 驗證器
  validators: GameValidator[];

  // UI配置
  uiConfig: UIConfig;
}

// 布局配置
interface LayoutConfig {
  deckArea: {
    position: Position;
    style: 'stack' | 'grid' | 'categorized';
    cardCount?: number;
  };

  dropZones: DropZoneConfig[];
}

// 遊戲驗證器
interface GameValidator {
  id: string;
  validate(action: GameAction, state: GameState, config: GameRuleConfig): ValidationResult;
}

// 牌組定義
interface CardDeck {
  id: string;
  ruleId: string;              // 屬於哪個規則
  name: string;
  version: string;
  isOfficial: boolean;
  cards: Card[];
}
```

#### Application Layer (應用層) - 業務流程

**職責：**
- **用戶交互**: 處理用戶請求和響應
- **會話管理**: 管理房間和用戶會話
- **權限控制**: 處理用戶權限和安全
- **業務流程**: 協調底層服務完成業務邏輯

**核心組件：**
```typescript
// 房間服務
interface RoomService {
  createRoom(request: CreateRoomRequest): Promise<Room>;
  joinRoom(roomId: string, visitor: VisitorInfo): Promise<JoinResult>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  closeRoom(roomId: string, counselorId: string): Promise<void>;
  getRoomStatus(roomId: string): Promise<RoomStatus>;
}

// 遊戲服務
interface GameService {
  initializeGame(roomId: string, ruleId: string, deckId: string): Promise<GameState>;
  executePlayerAction(roomId: string, action: PlayerAction): Promise<ActionResult>;
  getGameState(roomId: string): Promise<GameState>;
  getGameHistory(roomId: string): Promise<GameEvent[]>;
  saveGameSnapshot(roomId: string): Promise<void>;
}

// 用戶交互API
class GameController {
  // 房間管理
  async createRoom(req: Request): Promise<Response> {
    // 1. 驗證用戶權限
    // 2. 調用房間服務創建房間
    // 3. 初始化遊戲狀態
    // 4. 返回房間信息
  }

  // 遊戲操作
  async executeAction(req: Request): Promise<Response> {
    // 1. 解析用戶動作
    // 2. 獲取房間規則配置
    // 3. 調用引擎執行動作
    // 4. 廣播狀態變更
    // 5. 返回操作結果
  }
}
```

### Three Game Types Support

| Game Type | Zones | Constraints | Special Features |
|-----------|-------|-------------|------------------|
| **職能盤點卡** | 2 zones | 5 cards each | Counter display |
| **價值導航卡** | 3x3 grid | Unique ranking | Value tiers |
| **職游旅人卡** | 3 columns | 20 cards like/dislike | Dual deck layers |

### New Database Schema

```sql
-- Game rule templates
CREATE TABLE game_rule_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  layout_config JSONB NOT NULL,
  validation_rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Official card decks
CREATE TABLE card_decks (
  id UUID PRIMARY KEY,
  game_rule_id UUID REFERENCES game_rule_templates(id),
  name VARCHAR(100) NOT NULL,
  is_official BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false
);

-- Cards content
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES card_decks(id),
  card_key VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  metadata JSONB,
  UNIQUE(deck_id, card_key)
);

-- Extended rooms table
ALTER TABLE rooms
ADD COLUMN game_rule_id UUID REFERENCES game_rule_templates(id),
ADD COLUMN card_deck_id UUID REFERENCES card_decks(id);
```

### API Extensions

```
Game Rules:
GET    /api/game-rules              # Available game types
GET    /api/game-rules/{id}/decks   # Available card decks
GET    /api/game-rules/{id}/config  # Rule configuration

Room Creation:
POST   /api/rooms {
  name: string,
  gameRuleId: uuid,
  cardDeckId?: uuid  // Optional, uses default
}

Game Operations:
POST   /api/rooms/{id}/actions {
  type: "PLACE_CARD",
  cardKey: "skill_001",
  targetZone: "advantage",
  position: {x: 100, y: 200}
}
```

### Benefits

1. **Rapid Expansion**: New game rules in days, not weeks
2. **Configuration Driven**: No code changes for new rules
3. **Consistent UX**: Unified interaction patterns
4. **Future Proof**: Supports user-defined cards later

## Future Considerations

### Phase 2

- WebSocket for real-time sync
- Redis for caching and pub/sub
- User-defined card content

### Phase 3

- AI integration endpoints
- Advanced game analytics
- Microservices architecture

---

*Last updated: 2025-09-14*
