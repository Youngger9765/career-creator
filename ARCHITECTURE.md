# System Architecture

## Overview

A monorepo architecture with separated frontend (Next.js) and backend
(FastAPI) that communicate via REST API.

> **Note**: For game-specific architecture and design, see [GAME_DESIGN.md](./GAME_DESIGN.md)

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

**Last updated: 2025-09-29**
