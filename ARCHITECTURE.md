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

#### Engine Layer (引擎層)

- **Core Logic**: State management, action execution, rule validation
- **Rule Agnostic**: Handles common logic across all game types
- **Concurrent Safe**: Supports multi-user operations

```typescript
interface GameEngine {
  executeAction(action: GameAction): ActionResult;
  validateAction(action: GameAction, state: GameState): boolean;
  getState(roomId: string): GameState;
  publishEvent(event: GameEvent): void;
}
```

#### Configuration Layer (配置層)

- **Rule Definition**: Game rules and constraints
- **Content Management**: Card decks and layouts
- **UI Configuration**: Interface layouts

```typescript
interface GameRuleConfig {
  id: string;
  layout: LayoutConfig;        // 布局配置
  constraints: ConstraintConfig; // 規則約束
  validators: GameValidator[];   // 驗證器
  uiConfig: UIConfig;           // UI配置
}
```

#### Application Layer (應用層)

- **Business Logic**: Room management, user interactions
- **Security**: Permission control, session management
- **API Endpoints**: RESTful interfaces

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
