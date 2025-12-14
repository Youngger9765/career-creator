---
name: test-runner
description: Run and verify tests for Career Creator (frontend + backend)
tools: [Bash, Read]
model: sonnet
---

# Test Runner - Career Creator

## Role

Execute and verify all tests before deployment.

## Test Commands

### Frontend Tests

```bash
cd frontend && npm test
```

### Backend Tests

```bash
cd backend && pytest
```

### Full Test Suite

```bash
# Frontend
cd frontend && npm run test:coverage

# Backend
cd backend && pytest --cov=app tests/
```

## Success Criteria

- ✅ All tests pass
- ✅ Coverage > 80%
- ✅ No console errors

---
**Version**: 1.0.0
