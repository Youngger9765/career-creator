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

## Security Guidelines

## Pre-commit Security Checks

本專案使用多層次的安全檢查來防止敏感資訊洩漏和程式碼安全漏洞。

### 🔒 Secrets Detection (雙層防護)

1. **Gitleaks** - 掃描 git history 和 staged files
   - 檢測 API keys, tokens, passwords
   - 檢測 AWS, GCP, Azure credentials
   - 檢測 Private keys (RSA, SSH, etc.)

2. **Detect-Secrets** (Yelp) - 額外的 secret 偵測層
   - AWS Access Keys
   - GitHub Tokens
   - Basic Authentication
   - High Entropy Strings (Base64, Hex)
   - 排除誤報: Alembic revision IDs

### 🐍 Python Security (Bandit)

**嚴格度**: Medium/High only (`-ll`)

檢測項目：

- **硬編碼密碼** (HIGH severity)
- **SQL Injection 風險** (MEDIUM severity)
- **Request without timeout** (MEDIUM severity)
- **使用不安全的函式** (pickle, eval, exec)
- **弱加密演算法** (MD5, SHA1)

配置檔: `.bandit`

### 📦 Dependency Vulnerabilities

1. **Python Safety** - 檢查 Python 套件已知漏洞
   - 掃描 `requirements.txt`
   - 來源: Safety DB

2. **npm audit** - 檢查 Node.js 套件已知漏洞
   - 等級: HIGH and above
   - 掃描 `package.json`

### 🔑 Private Key Detection

自動偵測並阻止 commit：

- RSA private keys
- SSH private keys
- PGP private keys

## Testing Security Checks

```bash
# 測試所有安全檢查
pre-commit run --all-files

# 只測試 secrets detection
pre-commit run gitleaks --all-files
pre-commit run detect-secrets --all-files

# 只測試 Python security
pre-commit run bandit --all-files

# 只測試依賴套件
pre-commit run python-safety-dependencies-check --all-files
pre-commit run npm-audit --all-files
```

## If Secret is Found

### ❌ Already Committed Secret

1. **Immediately replace** that secret/password/key
2. **Remove from git history**:

   ```bash
   # Use BFG Repo-Cleaner
   java -jar bfg.jar --delete-files YOUR_SECRET_FILE
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push** (Careful!)

   ```bash
   git push --force
   ```

### ✅ Uncommitted Secret (Pre-commit intercepted)

1. Remove secret from code
2. Move secret to environment variables or secrets manager
3. Re-commit

## False Positives

If confirmed not a secret, mark as allowlist:

```python
# Use pragma comment to mark false positive
some_value = "EXAMPLE-ONLY"  # pragma: allowlist secret
```

## Reporting Security Issues

If you discover a security vulnerability, please contact the project
maintainer privately. **Do not create a public issue.**

## Security Best Practices

1. ✅ **Always use environment variables** to store sensitive information
2. ✅ **Regularly update dependencies** (`pip-audit`, `npm audit`)
3. ✅ **Code Review** - Pay special attention to security issues
4. ✅ **Principle of least privilege** - Only grant necessary permissions
5. ❌ **Never commit** `.env`, `credentials.json`, private keys
6. ❌ **Never use `--no-verify`** to skip pre-commit hooks

---

## Technical Debt Tracking

## 🔴 High Priority (Critical Issues)

### 1. **ConsultationArea.tsx** (1512 lines)

**Actual Status**:

- **ConsultationArea component body**: 1262 lines (L250-1512) 🔴🔴🔴
  - Contains: 10+ useState, useMemo, useCallback
  - Contains: 300+ lines of mockCards data
  - Contains: Large amounts of drag/drop logic, card management, token management
  - Contains: Complex JSX (multiple game mode rendering)

**Refactoring Priority**: ⭐️⭐️⭐️⭐️⭐️ (Highest - Core game component)

**Impact Scope**: Core game logic, main consultation area component

**Suggested Refactoring**:

```typescript
// Split into multiple files
ConsultationArea/
├── index.tsx                    // Main component (< 100 lines)
├── hooks/
│   ├── useCardManagement.ts     // Card management logic
│   ├── useGameRules.ts          // Game rules logic
│   └── useDragAndDrop.ts        // Drag/drop logic
├── components/
│   ├── CardSelector.tsx         // Card selector
│   ├── GameArea.tsx             // Game area
│   └── AuxiliaryCards.tsx       // Auxiliary cards
└── utils/
    ├── cardFilters.ts           // Card filter functions
    └── validation.ts            // Validation logic
```

### 2. **ClientManagement.tsx** (978 lines)

**Actual Status**:

- Largest function only 35 lines (getRoomStatusBadge)
- All functions < 50 lines, code is healthy
- **Real issue**: Component itself too large (978 lines JSX + logic mixed)

**Refactoring Priority**: ⭐️⭐️⭐️ (Medium)

**Suggested Refactoring**:

```typescript
ClientManagement/
├── index.tsx                    // Main component (< 200 lines)
├── components/
│   ├── ClientTable.tsx          // Desktop table view
│   ├── ClientCard.tsx           // Mobile card view
│   ├── ClientRecords.tsx        // Consultation records expand
│   └── ClientModal.tsx          // View/edit modal
└── hooks/
    └── useClientData.ts         // Data fetching logic
```

### 3. **LifeTransformationGame.tsx** (944 lines)

**Problem Functions:**

- 🔴 **availableCards**: 195 lines (L470-664)
- 🔴 **getDeck**: 150 lines (L176-325)
- 🔴 **card render**: 138 lines (L741-878)

**Refactoring Priority**: ⭐️⭐️⭐️⭐️

**Suggestion**:

- Split card render logic into independent component `GameCard.tsx`
- Move deck logic to service or hook

### 4. **backend/app/core/seeds.py** (1147 lines)

**Problem Functions:**

- 🔴 **seed_crm_data**: 313 lines
- 🔴 **seed_career_cards**: 291 lines
- 🔴 **seed_value_cards**: 169 lines
- 🔴 **seed_skill_cards**: 169 lines

**Refactoring Priority**: ⭐️⭐️⭐️

**Suggested Refactoring**:

```python
backend/app/core/seeds/
├── __init__.py
├── users.py          # seed_demo_users, seed_test_users
├── cards/
│   ├── __init__.py
│   ├── career.py     # seed_career_cards
│   ├── value.py      # seed_value_cards
│   └── skill.py      # seed_skill_cards
└── crm.py            # seed_crm_data
```

## 🟡 Medium Priority

### 5. **backend/app/api/clients.py** (758 lines)

**Status**: Large file but functions are fine (< 50 lines)

**Suggestion**: Consider splitting into multiple router files

## 📊 Statistics Summary

| File | Total Lines | Largest Function | Status |
|------|-------------|------------------|--------|
| ConsultationArea.tsx | 1512 | 433 | 🔴 Critical |
| ClientManagement.tsx | 978 | 742 | 🔴 Critical |
| LifeTransformationGame.tsx | 944 | 195 | 🔴 Critical |
| seeds.py | 1147 | 313 | 🔴 Critical |
| clients.py | 758 | < 50 | 🟡 Acceptable |

## ✅ Refactoring Action Plan

### Phase 1: Immediate (This week)

- [ ] **ConsultationArea.tsx** - Highest priority
  - [x] ✅ Step 1: Extract mockCards data to separate file
    (Completed - reduced 296 lines)
    - Created `frontend/src/data/mockCards.ts`
    - ConsultationArea.tsx: 1512 lines → 1216 lines
  - [x] ✅ Step 2: Extract useCardManagement hook (Completed - reduced 115 lines)
    - Created `frontend/src/hooks/useCardManagement.ts`
    - Created 12 unit tests (100% passed)
    - ConsultationArea.tsx: 1216 lines → 1101 lines
  - [x] ✅ Step 3: Extract useTokenManagement hook (Completed - reduced 24 lines)
    - Created `frontend/src/hooks/useTokenManagement.ts`
    - Created 13 unit tests (100% passed)
    - ConsultationArea.tsx: 1101 lines → 1077 lines
  - [ ] Expected: Reduce main component from 1262 lines to ~400 lines
    (Currently reduced to 1077 lines, -435 lines, -28.8%)

### Phase 2: High Priority (This week)

- [ ] **ClientManagement.tsx**
  - [x] ✅ Step 1: Extract useClientManagement hook (Completed - reduced 101 lines)
    - Created `frontend/src/hooks/useClientManagement.ts`
    - Created 17 unit tests
    - ClientManagement.tsx: 978 lines → 877 lines
  - [x] ✅ Step 2: Split ClientTableRow component (Desktop view)
    (Completed - reduced 136 lines)
    - Created `frontend/src/components/clients/ClientTableRow.tsx`
    - Created 16 unit tests (100% passed)
    - ClientManagement.tsx: 877 lines → 741 lines
  - [x] ✅ Step 3: Split ClientMobileCard component (Mobile view)
    (Completed - reduced 92 lines)
    - Created `frontend/src/components/clients/ClientMobileCard.tsx`
    - Created 13 unit tests (100% passed)
    - ClientManagement.tsx: 741 lines → 649 lines
  - [ ] Expected: Reduce from 978 lines to ~300 lines
    (Currently reduced to 649 lines, -329 lines, -33.6%)

### Phase 3: Continuous Improvement (Within 2 weeks)

- [ ] **LifeTransformationGame.tsx**
  - [ ] Split card render logic
  - [ ] Refactor deck management

- [ ] **backend/app/core/seeds.py**
  - [ ] Split into multiple files
  - [ ] Each seed as independent module

## 📝 Refactoring Principles

1. **Single Responsibility Principle**
   - Each function does one thing
   - Function lines recommended < 50 lines

2. **Component Splitting Principle**
   - Main component < 100 lines
   - Complex logic moved to hooks
   - UI logic split into sub-components

3. **File Size Principle**
   - Component files < 300 lines
   - API files < 500 lines
   - Utils files < 200 lines

## ⚠️ Important Notes

**Before refactoring must**:

1. ✅ Ensure all existing tests pass
2. ✅ Add tests for parts to be refactored (TDD)
3. ✅ Refactor one file at a time
4. ✅ Run tests after each refactoring to confirm no broken functionality

**Do not**:

- ❌ Refactor multiple files at once
- ❌ Add new features during refactoring
- ❌ Refactor without tests

---

## Last Updated

2025-11-07
