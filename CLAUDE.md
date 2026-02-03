# Career Creator

> 通用規則見 `~/.claude/CLAUDE.md`（Agent 路由、Git、Security、TDD）

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| Deploy | GCP Cloud Run |

## Project Overview

Building an online card consultation system for career counselors and visitors.

## Project-Specific Rules

1. **CI/CD Protocol** - After `git push`:

   ```bash
   gh run list --branch <branch> --limit 1
   gh run watch <run-id>
   gh run view <run-id> --log | grep "Service URL:"
   ```

2. **Fresh URL** - Staging URL changes each deployment
3. **Auto-fix** - Only safe errors (lint/format/imports)
4. **User Testing First** - Ask "Have you tested? Ready to commit?"

## Test Credentials

| Account | Email | Password |
|---------|-------|----------|
| Counselor | demo.counselor@example.com | demo123 |
| Counselor 2 | demo.counselor2@example.com | demo123 |
| Admin | demo.admin@example.com | demo123 |

## Commands

```bash
# Development
npm run dev

# Build & Test
npm run build
npm run test
npm run lint
```

## Environments

| Environment | Branch |
|-------------|--------|
| Production | main |
| Staging | staging |
| Feature | feature/* |

## Key Docs

- `PRD.md` - Product requirements
- `.claude/skills/` - Workflows
- `.claude/agents/` - Task agents
