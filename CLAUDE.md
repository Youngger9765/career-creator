# CLAUDE.md - Project Guidelines

## Project Overview

Building an online card consultation system for career counselors and their visitors.

## Commit Message Convention

- **Language**: Always use English for commit messages
- **Format**: Use conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `style:` for formatting changes
  - `refactor:` for code restructuring
  - `test:` for tests
  - `chore:` for maintenance tasks

## Code Standards

### Frontend

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Drag and Drop**: @dnd-kit
- **API Client**: Axios + React Query

### Backend

- **Framework**: FastAPI with Python 3.11+
- **ORM**: SQLModel (unified SQLAlchemy + Pydantic)
- **Database Migrations**: Alembic
- **Testing**: pytest
- **Async**: asyncio

### Database & Infrastructure

- **Database**: PostgreSQL (Supabase)
- **Deployment**: GCP Cloud Run
- **Storage**: GCP Cloud Storage

## Development Guidelines

1. **Mobile First**: Always prioritize mobile experience
2. **Type Safety**: Use TypeScript for all code
3. **Component Structure**: Keep components small and focused
4. **Testing**: Write tests for critical functionality
5. **Documentation**: Comment complex logic

## TDD with AI Development (Kent Beck's Principles)

### Canon TDD Process

Following Kent Beck's canonical TDD workflow:

1. **List Expected Behaviors**: Before coding, list all expected variants in the new behavior
   - Basic case
   - Edge cases (timeouts, missing data, etc.)
   - Existing behavior that shouldn't break

2. **Red-Green-Refactor Cycle**:
   - **Red**: Write one failing test
   - **Green**: Make it pass (even with ugly code)
   - **Refactor**: Clean up when test is green

3. **One Test at a Time**: Focus on a single test, make it pass, then move to the next

### TDD as AI "Superpower"

According to Kent Beck, TDD is a "superpower" when working with AI agents:

1. **Tests as Prompts**: Writing tests first essentially "prompts" the AI with exact requirements
2. **Guard Rails**: Tests prevent AI from introducing regressions
3. **Small Context Window**: Keep tests focused to maintain high code quality
4. **Immediate Feedback**: Tests catch when AI strays off course

### Common Mistakes to Avoid

- Don't write tests without assertions just for coverage
- Don't convert all test items to concrete tests at once
- Don't mix refactoring with making tests pass
- Watch for AI trying to delete/disable tests to "pass"

### AI-Assisted TDD Workflow

1. Write a failing test that describes the desired behavior
2. Use AI to generate code that passes the test
3. Feed test results back to AI for iterations
4. Refactor with confidence knowing tests protect you
5. Repeat for next behavior

### Key Benefits

- **Better Context**: Tests provide crucial context to AI assistants
- **Higher Quality**: Edge cases in tests lead to more robust generated code
- **Faster Iteration**: Clear requirements reduce back-and-forth
- **Confidence**: Tests catch AI-introduced bugs immediately

## File Structure (Monorepo)

```
/frontend
  /src
    /app          # Next.js app router pages
    /components   # Reusable components
    /lib          # Utilities and helpers
    /hooks        # Custom React hooks
    /types        # TypeScript type definitions
    /styles       # Global styles

/backend
  /app
    /api          # API endpoints (FastAPI routers)
    /models       # SQLModel models (unified ORM + schemas)
    /core         # Core configs, database, roles
    /services     # Business logic (future)
  /tests          # pytest tests (TDD approach)
  /alembic        # Database migrations
```

## Key Decisions

- Use polling for MVP (no WebSocket initially)
- Visitors don't need registration
- Room expires after 7 days by default
- ~~Start with single card deck (職能盤點卡)~~ **CHANGED**: Implement all 3 game types with universal rules engine

## Game Rules Engine Architecture

### Strategic Decision: Why Universal Framework?

**Business Reality:**
1. **持續演進需求**: 職涯諮詢工具會持續演進，市場會出現新的測評工具和方法
2. **競爭優勢**: 新規則上線不能花費數週開發時間
3. **用戶多樣化**: 不同諮詢師可能偏好不同工具

**技術本質發現:**
牌卡遊戲的**核心抽象是固定的**，變化的只是**配置參數**

**Industry Best Practices:**
現代iGaming平台（如EveryMatrix、NuxGame）都採用相同架構：
- 統一遊戲引擎 + 可配置規則 + 多遊戲內容 = 快速擴展能力
- 上新遊戲週期：1-2週（vs 傳統數月）

Following iGaming industry best practices, we implement a **Three-Layer Universal Framework**:

1. **Engine Layer**: Rule-agnostic core logic
2. **Configuration Layer**: Game rules and content management
3. **Application Layer**: Business logic and user interactions

### Three Game Types (MVP全做)

```
1. 職能盤點卡 - 優劣勢分析 (2 zones, max 5 each)
2. 價值導航卡 - 價值觀排序 (3x3 grid, unique ranking)
3. 職游旅人卡 - 六大性格 (3 columns, like/neutral/dislike)
```

### Technical Benefits

- **Rapid Expansion**: New rules in days, not weeks
- **Configuration Driven**: No code changes for new game types
- **Future Proof**: Supports user-defined cards later  
- **Consistent UX**: Unified interaction patterns

### Architecture Advantages

**1. 可擴展性**
- 新規則只需實現 GameRules 接口
- 新牌組只需配置數據
- UI可通過配置自動生成

**2. 可維護性**
- 核心邏輯集中在引擎
- 規則和內容分離
- 清晰的抽象邊界

**3. 可測試性**
- 規則邏輯可獨立測試
- 狀態變化可預測
- 動作可重放和調試

**4. 性能優化**
- 規則配置可緩存
- 狀態更新可批量處理
- 可實現增量同步

這個架構設計可以支撐未來5-10年的業務發展，新的牌卡規則上線只需要數天而不是數週。

### Implementation Strategy

1. **Phase 1**: Core engine + 3 official rule sets
2. **Phase 2**: User-defined card content
3. **Phase 3**: Advanced game analytics

### TDD for Game Engine

Apply TDD principles specifically for rules engine:

```typescript
// Example test-first approach
describe('GameEngine', () => {
  it('should validate card placement within zone limits', () => {
    const state = createGameState('skill_assessment');
    const action = createPlaceCardAction('advantage', 6); // Over limit

    expect(engine.validateAction(action, state)).toBe(false);
  });

  it('should execute valid card arrangement', () => {
    const action = createArrangeAction('skill_001', 'advantage');
    const result = engine.executeAction(action);

    expect(result.isSuccess).toBe(true);
    expect(result.newState.zones.get('advantage').cards).toContain('skill_001');
  });
});
```

## Testing Commands

### Frontend

```bash
cd frontend
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run lint     # Lint check
npm run test     # Run tests
```

### Backend

```bash
cd backend
uvicorn app.main:app --reload  # Dev server (port 8000)
pytest                          # Run all tests
pytest -v                       # Verbose output
pytest --cov                    # With coverage
alembic upgrade head             # Run migrations
```

### Full Stack

```bash
docker-compose up               # Run both frontend and backend
```

## Deployment

- Platform: GCP Cloud Run
- Database: Supabase PostgreSQL
- Storage: GCP Cloud Storage
- Environment: Production branch = main

---
*Last updated: 2025-09-13*
