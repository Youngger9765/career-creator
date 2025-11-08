# CLAUDE.md - Project Guidelines

---

## 🚨 AT THE START OF EVERY SESSION (CRITICAL)

**WHEN YOU START A NEW CONVERSATION, YOU MUST:**

1. **Read this CLAUDE.md file**

2. **Print the following rules to remind yourself**:

   ```text
   📋 SESSION RULES CHECKLIST:

   ✅ BEFORE ANY COMMIT:
      - User must test the feature first
      - NEVER auto-commit without user approval
      - Ask: "Have you tested this? Ready to commit?"

   ✅ AFTER EVERY `git push`:
      - DO NOT STOP and wait for user
      - IMMEDIATELY run: gh run list --branch <branch> --limit 1
      - IMMEDIATELY run: gh run watch <run-id>
      - Get fresh URL from logs (URLs change!)
      - If fails: read logs, auto-fix if possible, push again
      - If succeeds: report deployment URL to user
      - NEVER say "pushed successfully" and move on

   ❌ NEVER:
      - Push without user testing
      - Push and forget
      - Use cached/old URLs
      - Auto-run tests without context (user decides what tests to run)
   ```

3. **Then proceed with the user's request**

---

## ⚠️ CI/CD Deployment Protocol (CRITICAL)

**AFTER EVERY `git push`, YOU MUST:**

1. **Monitor deployment immediately**:

   ```bash
   gh run list --branch <branch> --limit 1
   gh run watch <run-id>
   ```

2. **Get fresh deployment URL**:

   ```bash
   gh run view <run-id> --log | grep "Service URL:"
   ```

3. **If deployment fails**:
   - Read the error logs: `gh run view <run-id> --log`
   - Auto-fix ONLY safe errors: linting, formatting, missing imports
   - For complex errors (logic, tests, build config): report to user
   - Push fix immediately (only for auto-fixable errors)
   - After 2 auto-fix attempts: stop and report to user

4. **If deployment succeeds**:
   - Report the fresh URL to user
   - Let user decide what testing is needed

**DO NOT:**

- ❌ Push and forget
- ❌ Use old/cached URLs
- ❌ Auto-run tests without understanding context
- ❌ Auto-fix complex errors (logic, build config, tests)
- ❌ Use hacky fixes (@ts-ignore, commenting out code, etc.)

**REMEMBER:**

- Staging URL changes with each service redeployment
- Always get fresh URL from deployment logs
- Only auto-fix safe, obvious errors (linting, formatting, imports)

---

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
6. **⚠️ NO AUTO COMMIT**: NEVER commit new features without user testing
   first. Always wait for user to test and approve before committing.
7. **⚠️ NEVER USE --no-verify**: Always fix TypeScript and linting errors
   properly. Pre-commit hooks exist to maintain code quality. Fix the errors,
   don't bypass them!

## TDD with AI Development (Kent Beck's Principles)

### Canon TDD Process

Following Kent Beck's canonical TDD workflow:

1. **List Expected Behaviors**: Before coding, list all expected variants in
   the new behavior
   - Basic case
   - Edge cases (timeouts, missing data, etc.)
   - Existing behavior that shouldn't break

2. **Red-Green-Refactor Cycle**:
   - **Red**: Write one failing test
   - **Green**: Make it pass (even with ugly code)
   - **Refactor**: Clean up when test is green

3. **One Test at a Time**: Focus on a single test, make it pass, then
   move to the next

### TDD as AI "Superpower"

According to Kent Beck, TDD is a "superpower" when working with AI agents:

1. **Tests as Prompts**: Writing tests first essentially "prompts" the AI
   with exact requirements
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

```text
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
- Implement all 3 game types (職能盤點卡、價值導航卡、職游旅人卡) with
  universal rules engine

## Game Architecture

For detailed game architecture and implementation, see [GAME_DESIGN.md](./GAME_DESIGN.md)

## E2E Testing with Playwright

**NO EXCUSES. 遇到問題直接解決，不要找藉口。**

### 心法

1. **先讀組件** - 猜測選擇器 = 浪費時間
2. **測完整流程** - 不要只測頁面能不能開
3. **部署後必測** - CI/CD 過了不代表功能對

### 標準步驟

```bash
# 1. 找到組件，看真實的選擇器
cat frontend/src/app/login/page.tsx

# 2. 寫測試 (用組件裡的 ID/class)
# frontend/e2e/feature.spec.ts

# 3. 監控部署
gh run watch <run-id>

# 4. 跑測試驗證
npx playwright test --project=webkit
```

### 遇到問題怎麼辦

**❌ 錯誤做法**:

- "可能沒有這個帳號" → 簡化測試
- "選擇器可能不對" → 只測基礎功能
- "環境可能有問題" → 跳過驗證

**✅ 正確做法**:

1. 讀登入頁面組件 → 找到 `input#email`, `input#password`
2. 看測試帳號列表 → 用 `demo.counselor@example.com`
3. 寫完整測試 → 登入 → 進房間 → 驗證功能
4. 測試失敗 → 看截圖 → 修正選擇器 → 重跑

**核心**: 你有所有工具和資訊，直接解決問題。

### Backend Testing (pytest)

```bash
cd backend
pytest                          # Run all tests
pytest -v                       # Verbose output
pytest --cov                    # With coverage
alembic upgrade head             # Run migrations
```

### Frontend Commands

```bash
cd frontend
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run lint     # Lint check
npx playwright test              # Run E2E tests
npx playwright test --ui         # Run with UI mode
npx playwright codegen <url>     # Generate test code
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

### GCloud Configuration

Project uses dedicated gcloud configuration:

```bash
# Switch to career-creator configuration
gcloud config configurations activate career-creator

# Verify configuration
gcloud config list
```

**Expected configuration:**

- **Active configuration**: `career-creator`
- **Project**: `career-creator-card`
- **Region**: `asia-east1`

### Cloud Run Services

**⚠️ WARNING: URLs may change after service redeployment.**
**Always get fresh URL from deployment logs.**

To get current staging URL:

```bash
gh run list --branch staging --limit 1
gh run view <run-id> --log | grep "Service URL:"
```

Latest known URLs (verify before use):

- **Staging**: `https://career-creator-frontend-staging-849078733818.asia-east1.run.app`
- **Production**: `https://career-creator-frontend-production-990202338378.asia-east1.run.app`

### GitHub Actions Deployment

Auto-deployment configured:

- `staging` branch → staging environment
- `main` branch → production environment

Service Account configured for automated deployment.

---

## Last Updated

2025-10-22
