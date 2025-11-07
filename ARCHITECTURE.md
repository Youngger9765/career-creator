# System Architecture

## Overview

A monorepo architecture with separated frontend (Next.js) and backend
(FastAPI) that communicate via REST API.

## Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Drag & Drop**: @dnd-kit
- **API Client**: Axios + React Query
- **Real-time Sync**: Supabase Realtime (Broadcast)

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

```text
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

```text
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

```text
https://api.careercreator.tw/api/v1
```

### Core Endpoints

```text
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

```text
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

```text
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

---

# Game Architecture

## 🎮 Game System Overview

### Three Game Modes

```text
職涯牌卡諮詢系統
├── 職游旅人卡 (Career Cards)
│   ├── 六大性格分析
│   └── 職業收藏家
├── 職能盤點卡 (Skill Cards)
│   ├── 優劣勢分析
│   ├── 成長計畫
│   └── 職位拆解
└── 價值導航卡 (Value Cards)
    ├── 價值觀排序
    └── 生活改造王
```

### Technical Architecture

```text
GameModeIntegration (統一入口)
  ├── GameLayout (統一佈局)
  │   ├── GameInfoBar (遊戲資訊)
  │   ├── CardSidebar (側邊欄+牌卡)
  │   └── Canvas (遊戲畫布)
  └── 7個獨立遊戲組件
      ├── PersonalityAnalysisGame
      ├── CareerCollectorGame
      ├── AdvantageAnalysisGame
      ├── GrowthPlanningGame
      ├── PositionBreakdownGame
      ├── ValueRankingGame
      └── LifeTransformationGame
```

### Core Component Reusability

| Component | Purpose | Reuse Rate |
|-----------|---------|------------|
| GameLayout | Unified layout framework | 100% (7/7) |
| CardSidebar | Collapsible sidebar | 100% (7/7) |
| DropZone | Drop zones | 85% (6/7) |
| CardItem | Card display | 100% (7/7) |
| useGameState | State management | 100% (7/7) |

## ✅ Implementation Status

### Completed Features (2025-09-28)

#### 🎯 Core Features

- ✅ **7 game modes fully implemented**
- ✅ **Unified component architecture** - GameLayout unified layout
- ✅ **State persistence** - localStorage + Zustand
- ✅ **Drag & drop operations** - @dnd-kit fully integrated
- ✅ **Responsive design** - Support for mobile/tablet/desktop

#### 🌟 Special Features

- ✅ **CardTokenWidget** - Token allocation tool (Life Transformation exclusive)
- ✅ **Dynamic pie chart** - Real-time resource allocation visualization
- ✅ **PDF upload analysis** - Position breakdown feature
- ✅ **Collapsible sidebar** - Optimized space usage
- ✅ **Dark mode support** - Global theme switching

### Progress Statistics

| Aspect | Completion | Notes |
|--------|------------|-------|
| Game features | 100% | All 7 gameplays implemented |
| Component architecture | 95% | Highly modular, no code duplication |
| State management | 90% | localStorage complete, backend sync pending |
| UI/UX | 85% | Responsive complete, details need optimization |
| Multi-user collaboration | 0% | Not yet started |

## 🔧 Configuration Strategy

### Current Approach: Code-Based Configuration

```typescript
// Game configuration directly in code
const gameConfigs = {
  personality_analysis: {
    canvas: 'three_columns',
    cards: ['career_cards_100'],
    rules: { maxPerColumn: 20 }
  },
  life_transformation: {
    canvas: 'token_allocation',
    cards: ['value_cards_36'],
    rules: { totalTokens: 100 }
  }
};
```

### Selection Rationale

| Factor | Code-Based | Database-Based | Decision |
|--------|------------|----------------|----------|
| Development speed | ⚡Fast | 🐢Slow | ✅ Code |
| Version control | ✅ Git tracking | ❌ Extra handling | ✅ Code |
| Type safety | ✅ TypeScript | ❌ Runtime checks | ✅ Code |
| Flexible modification | ❌ Redeploy needed | ✅ Immediate effect | - |
| A/B testing | ❌ Difficult | ✅ Easy | - |

### Future Evolution Path

```text
Phase 1 (Current): Pure Code-Based
Phase 2 (3 months): Hybrid (Rules in code + Content in DB)
Phase 3 (6 months): Full Database-Based with Admin Panel
```

## 🌟 Special Feature Details

### 1. Life Transformation - CardTokenWidget

**Innovation**: Converts abstract values into concrete resource allocation

```typescript
interface TokenAllocation {
  area: string;      // Life area
  amount: number;    // Allocated tokens
  percentage: number; // Percentage
}
```

**Usage Flow**:

1. Drag value card to canvas
2. Auto-convert to token allocator
3. Adjust token allocation with slider
4. Pie chart updates in real-time

### 2. Position Breakdown - Dual Area Layout

**Design Feature**: 50/50 split screen

- Left: Skill card analysis area
- Right: PDF job description upload area

### 3. Personality Analysis - Three Column Classification

**Interaction Design**:

- Like / Neutral / Dislike columns
- Drag and drop for instant classification
- Maximum 20 cards per column

## 🚀 Future Roadmap

### Phase 1: Backend Integration (Within 1 month)

```typescript
// Game state API design
POST /api/rooms/{roomId}/game-state
{
  gameType: "life_transformation",
  state: {
    cardPlacements: {...},
    metadata: {...}
  }
}
```

### Phase 2: Multi-user Collaboration (2-3 months)

- [ ] WebSocket real-time sync
- [ ] Operation conflict resolution
- [ ] Collaborative cursor display
- [ ] Operation history tracking

### Phase 3: Advanced Features (3-6 months)

- [ ] Game result analysis reports
- [ ] Custom game rules
- [ ] AI-assisted suggestions
- [ ] Game recording and replay

### Phase 4: Commercialization (After 6 months)

- [ ] Paid card deck expansions
- [ ] Enterprise customization
- [ ] Data analytics dashboard
- [ ] Open API platform

## 📊 Technical Debt & Optimization

### Items to Optimize

| Priority | Item | Impact | Est. Hours |
|----------|------|--------|------------|
| 🔴 High | Backend game state sync | Multi-user foundation | 2 weeks |
| 🔴 High | TypeScript type completion | Dev efficiency | 1 week |
| 🟡 Medium | Component performance optimization | User experience | 1 week |
| 🟡 Medium | Unit test coverage | Code quality | 2 weeks |
| 🟢 Low | Animation enhancement | Visual experience | 1 week |

---

# Real-time Synchronization Architecture

## 📋 Overview

This document consolidates the complete synchronization architecture for the career consultation platform, including technical decisions, implementation details, API design, and synchronization strategies for each game mode.

---

## 🎯 Architecture Goals

### Core Requirements

1. **Header displays online users** - Real-time display of participants in room
2. **Card movement sync** - Real-time sync during multi-user collaboration
3. **Game mode change permissions and sync** - Permission control and state sync

### Design Principles

- **Zero disruption** - Existing features completely unaffected
- **Progressive** - Can be gradually enabled by game type
- **Degradable** - Auto-fallback to localStorage if backend fails
- **Pragmatic priority** - Pursue usability over perfection

---

## 🏗️ Technical Decisions

### 1. Sync Solution: Supabase Realtime

#### Decision Rationale

| Solution | Dev Time | Cost | Complexity | Maintainability | Choice |
|----------|----------|------|-----------|----------------|--------|
| **Supabase Realtime** | 3-4 days | $0-25/mo | ⭐⭐ | Simple | ✅ Adopted |
| WebSocket (self-hosted) | 8-10 days | $100+/mo | ⭐⭐⭐⭐ | Complex | ❌ |
| Polling (HTTP) | 2-3 days | $15-30/mo | ⭐ | Simple | 🔄 Backup |

#### Supabase Advantages

```javascript
// Three core features unified management
const channel = supabase.channel(`room:${roomId}`)
  .on('presence', handlePresence)     // Online status
  .on('broadcast', handleBroadcast)   // Real-time messages
  .on('postgres_changes', handleDB)   // Database changes
  .subscribe()
```

### 2. Architecture Pattern: Wrapping Existing System

#### Strategy Core

```typescript
// Keep existing interface unchanged
const { state, updateCards } = useGameState(roomId, 'life');

// Add sync logic at the bottom layer
const handleCardDrop = (cardId, area) => {
  updateCards({ /* existing logic */ });
  // ↑ This call will automatically trigger sync!
};
```

**Time Saved**: From 8 days to 4 days ⚡
**Risk Reduced**: From high risk to low risk 🛡️
**Feature Complete**: Three core features 100% implemented ✅

---

## 📡 Supabase Realtime Feature Architecture

### Channel Management Strategy

```javascript
// One room = one channel = unified management
const channel = supabase.channel(`room:${roomId}`)
```

### Three Feature Layers

| Feature | Technology | Data Storage | Latency | Purpose |
|---------|-----------|--------------|---------|---------|
| **Presence** | Memory | No DB write | <1s | Online status |
| **Broadcast** | Memory | No DB write | <1s | Real-time messages |
| **Postgres Changes** | Database | Write DB | <1s | Persistence |

---

## 🚀 Implementation Phase Plan

### Phase 1: Online Status Display ✅ Completed

#### Technical Implementation

```typescript
// hooks/usePresence.ts
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: getUserId(),
            name: getUserName(),
            role: getUserRole(),
            joinedAt: new Date().toISOString()
          })
        }
      })

    return () => channel.unsubscribe()
  }, [roomId])

  return { onlineUsers }
}
```

### Phase 2: Game Mode Sync ✅ Completed

#### Implementation Approach Change

**Original Plan**: Broadcast + Database
**Actually Adopted**: Pure Broadcast + localStorage

#### Change Rationale

1. **Simplified implementation** - No backend API needed
2. **Reduced cost** - Broadcast not billed
3. **Sufficient for MVP** - Owner localStorage as source of truth

#### Core Code

```typescript
// hooks/useGameModeSync.ts
export function useGameModeSync(options: UseGameModeSyncOptions) {
  const { roomId, isOwner, initialState, onStateChange } = options

  // Owner: Change game mode
  const changeGameMode = useCallback((deck, gameRule, gameMode) => {
    if (!isOwner || !channel) return

    const newState = { deck, gameRule, gameMode }

    // 1. Update local state
    setSyncedState(newState)
    persistState(newState)  // Save to localStorage

    // 2. Broadcast to others
    channel.send({
      type: 'broadcast',
      event: 'mode_changed',
      payload: newState
    })
  }, [isOwner, channel])

  return { syncedState, ownerOnline, changeGameMode, canInteract }
}
```

### Phase 3: Card Movement Sync (To be implemented)

#### Technical Approach

**Broadcast (Real-time) + Event Sourcing (Persistence)**

#### Data Flow Design

```typescript
// Sync flow
User moves card
  → Optimistic update (immediate local display)
  → Broadcast to others (real-time sync)
  → Write to card_events table (event log)
  → Resolve conflicts using timestamp
```

---

## 🗄️ Database Design

### 1. Event Table (Event Sourcing)

```sql
-- Event table (already exists)
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
```

### 2. Game State Snapshot (Performance optimization)

```sql
-- Game state snapshot (periodic save)
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

---

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

```bash
# Frontend
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Backend
DATABASE_URL
JWT_SECRET
GCS_BUCKET_NAME
```

## Performance Optimizations

### Frontend Optimizations

- Static generation where possible
- Image optimization with Next.js
- Code splitting
- Lazy loading components

### Backend Optimizations

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

## Last Updated

2025-11-07
