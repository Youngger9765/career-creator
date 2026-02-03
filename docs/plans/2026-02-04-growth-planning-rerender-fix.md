# GrowthPlanningGame Re-render Loop Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the infinite re-render loop in GrowthPlanningGame that causes 50+ repeated console logs when cards change.

**Architecture:** Use React refs to store mutable function references, preventing useEffect dependency array from triggering on function recreation. This pattern is already proven in the same file for `gameSyncRef` and `debouncedSaveGameState`.

**Tech Stack:** React hooks (useRef, useCallback, useMemo, useEffect), TypeScript

---

## Root Cause Analysis

### Current Problem (lines 224-264)

```typescript
// 當卡片改變時，自動更新前綴
useEffect(() => {
  if (!isRoomOwner) return;
  const prefix = getCardPrefix();  // ← 每次都 log
  if (!prefix) return;
  // ... 更新 planText
}, [
  skillCardsInUse,
  actionCardsInUse,
  isRoomOwner,
  getCardPrefix,        // ← 問題1: Function，每次 render 重建
  handlePlanTextChange, // ← 問題2: Function，每次 render 重建
  planText,             // ← 問題3: 被 handlePlanTextChange 更新，造成循環
]);
```

### Feedback Loop

```
Cards change → useEffect runs → handlePlanTextChange(newText) →
setPlanText(text) → planText change → useEffect runs again → ...
```

### Solution

1. Store functions in refs (already done for gameSyncRef pattern)
2. Store planText in ref to avoid triggering effect
3. Remove functions and planText from dependency array
4. Only depend on actual data changes: `skillCardsInUse`, `actionCardsInUse`, `isRoomOwner`

---

## Task 1: Write Failing Test

**Files:**
- Create: `frontend/src/components/games/__tests__/GrowthPlanningGame.test.tsx`

**Step 1.1: Create test file with re-render counting test**

```typescript
/**
 * Tests for GrowthPlanningGame component
 * Focus: Verify no infinite re-render loops
 */
import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/game-modes/services/card-loader.service', () => ({
  CardLoaderService: {
    getDeck: vi.fn(() => Promise.resolve({
      name: 'Test Deck',
      cards: [
        { id: 'mindset-1', title: 'Mindset Card 1', category: 'mindset' },
        { id: 'mindset-2', title: 'Mindset Card 2', category: 'mindset' },
        { id: 'action-1', title: 'Action Card 1', category: 'action' },
        { id: 'action-2', title: 'Action Card 2', category: 'action' },
      ],
    })),
  },
}));

vi.mock('@/hooks/use-unified-card-sync', () => ({
  useUnifiedCardSync: vi.fn(() => ({
    state: {
      cardPlacements: {
        skillsCards: [],
        actionsCards: [],
      },
    },
    draggedByOthers: new Set(),
    handleCardMove: vi.fn(),
    cardSync: {
      startDrag: vi.fn(),
      endDrag: vi.fn(),
    },
    updateCards: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-card-sync', () => ({
  useCardSync: vi.fn(() => ({
    isConnected: true,
    loadGameState: vi.fn(() => null),
    saveGameState: vi.fn(),
  })),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user', name: 'Test User' },
  })),
}));

vi.mock('@/lib/supabase-client', () => ({
  supabase: null,
  isSupabaseConfigured: vi.fn(() => false),
}));

// Import after mocks
import GrowthPlanningGame from '../GrowthPlanningGame';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';

describe('GrowthPlanningGame', () => {
  let renderCount: number;
  let originalLog: typeof console.log;

  beforeEach(() => {
    vi.clearAllMocks();
    renderCount = 0;
    originalLog = console.log;

    // Count renders by intercepting specific log
    console.log = vi.fn((...args) => {
      if (args[0]?.includes?.('[GrowthPlanning]')) {
        renderCount++;
      }
      // originalLog(...args); // Uncomment to debug
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('Re-render Loop Prevention', () => {
    it('should not cause infinite re-renders when cards are selected', async () => {
      // Initial render
      const { rerender } = render(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait for initial render and deck loading
      await waitFor(() => {
        expect(renderCount).toBeLessThan(10);
      });

      const initialRenderCount = renderCount;

      // Simulate card selection by updating mock
      (useUnifiedCardSync as any).mockReturnValue({
        state: {
          cardPlacements: {
            skillsCards: ['mindset-1'],
            actionsCards: [],
          },
        },
        draggedByOthers: new Set(),
        handleCardMove: vi.fn(),
        cardSync: {
          startDrag: vi.fn(),
          endDrag: vi.fn(),
        },
        updateCards: vi.fn(),
      });

      // Trigger re-render
      rerender(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait and verify no infinite loop
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Should have very few additional renders (< 5), not 50+
      const additionalRenders = renderCount - initialRenderCount;
      expect(additionalRenders).toBeLessThan(10);
    });

    it('should not re-render excessively when both cards are selected', async () => {
      // Start with one card
      (useUnifiedCardSync as any).mockReturnValue({
        state: {
          cardPlacements: {
            skillsCards: ['mindset-1'],
            actionsCards: ['action-1'],
          },
        },
        draggedByOthers: new Set(),
        handleCardMove: vi.fn(),
        cardSync: {
          startDrag: vi.fn(),
          endDrag: vi.fn(),
        },
        updateCards: vi.fn(),
      });

      render(
        <GrowthPlanningGame
          roomId="test-room"
          isRoomOwner={true}
        />
      );

      // Wait for stabilization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Should stabilize under 20 renders total (not 50+)
      expect(renderCount).toBeLessThan(20);
    });
  });
});
```

**Step 1.2: Run test to verify it fails**

```bash
cd frontend && npm run test -- src/components/games/__tests__/GrowthPlanningGame.test.tsx --reporter=verbose
```

**Expected:** FAIL - Test will detect 50+ renders due to current loop

---

## Task 2: Remove Debug Console.log

**Files:**
- Modify: `frontend/src/components/games/GrowthPlanningGame.tsx:167-184`

**Step 2.1: Remove debug log from getCardPrefix**

Before:
```typescript
const getCardPrefix = useCallback(() => {
  console.log('[GrowthPlanning] Card prefix debug:', {
    skillCardsInUse: skillCardsInUse[0],
    actionCardsInUse: actionCardsInUse[0],
  });
  // 如果都沒有選擇卡片，不顯示前綴
  // ...
```

After:
```typescript
const getCardPrefix = useCallback(() => {
  // 如果都沒有選擇卡片，不顯示前綴
  if (!skillCardsInUse[0] && !actionCardsInUse[0]) return '';
  // ...
```

**Step 2.2: Run test to verify still fails (loop still exists)**

```bash
cd frontend && npm run test -- src/components/games/__tests__/GrowthPlanningGame.test.tsx --reporter=verbose
```

**Expected:** FAIL - Log removed but loop still exists

---

## Task 3: Add Function Refs

**Files:**
- Modify: `frontend/src/components/games/GrowthPlanningGame.tsx:224-237`

**Step 3.1: Add refs for getCardPrefix and handlePlanTextChange**

Insert after line 223 (after the debouncedSaveGameState cleanup useEffect):

```typescript
// Keep refs for functions to avoid useEffect dependency issues
const getCardPrefixRef = useRef(getCardPrefix);
const handlePlanTextChangeRef = useRef(handlePlanTextChange);
useEffect(() => {
  getCardPrefixRef.current = getCardPrefix;
  handlePlanTextChangeRef.current = handlePlanTextChange;
}, [getCardPrefix, handlePlanTextChange]);

// Keep planText in ref to avoid it triggering the effect
const planTextRef = useRef(planText);
useEffect(() => {
  planTextRef.current = planText;
}, [planText]);
```

---

## Task 4: Refactor useEffect to Use Refs

**Files:**
- Modify: `frontend/src/components/games/GrowthPlanningGame.tsx:238-264`

**Step 4.1: Update the card prefix useEffect**

Before:
```typescript
// 當卡片改變時，自動更新前綴
useEffect(() => {
  if (!isRoomOwner) return;

  const prefix = getCardPrefix();
  if (!prefix) return;

  // 如果已有內容，更新前綴
  if (planText) {
    const oldPrefixMatch = planText.match(/^【職能卡:.*?】\n----------\n/);
    let userContent = planText;
    if (oldPrefixMatch) {
      userContent = planText.substring(oldPrefixMatch[0].length);
    }
    const newText = prefix + userContent;
    if (newText !== planText) {
      handlePlanTextChange(newText);
    }
  } else if (skillCardsInUse.length > 0 || actionCardsInUse.length > 0) {
    // 如果沒有內容但有卡片，初始化前綴
    handlePlanTextChange(prefix);
  }
}, [skillCardsInUse, actionCardsInUse, isRoomOwner, getCardPrefix, handlePlanTextChange, planText]);
```

After:
```typescript
// 當卡片改變時，自動更新前綴
// Only trigger when cards actually change, not when functions/planText change
useEffect(() => {
  if (!isRoomOwner) return;

  const prefix = getCardPrefixRef.current();
  if (!prefix) return;

  const currentPlanText = planTextRef.current;

  // 如果已有內容，更新前綴
  if (currentPlanText) {
    const oldPrefixMatch = currentPlanText.match(/^【職能卡:.*?】\n----------\n/);
    let userContent = currentPlanText;
    if (oldPrefixMatch) {
      userContent = currentPlanText.substring(oldPrefixMatch[0].length);
    }
    const newText = prefix + userContent;
    if (newText !== currentPlanText) {
      handlePlanTextChangeRef.current(newText);
    }
  } else if (skillCardsInUse.length > 0 || actionCardsInUse.length > 0) {
    // 如果沒有內容但有卡片，初始化前綴
    handlePlanTextChangeRef.current(prefix);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [skillCardsInUse, actionCardsInUse, isRoomOwner]); // Only depend on actual data changes
```

**Step 4.2: Run test to verify it passes**

```bash
cd frontend && npm run test -- src/components/games/__tests__/GrowthPlanningGame.test.tsx --reporter=verbose
```

**Expected:** PASS - Loop eliminated, renders < 20

---

## Task 5: Run Full Test Suite

**Step 5.1: Run all hook tests**

```bash
cd frontend && npm run test -- src/hooks/__tests__/ --reporter=verbose
```

**Expected:** All tests pass

**Step 5.2: Run full frontend test suite**

```bash
cd frontend && npm run test
```

**Expected:** All tests pass

---

## Task 6: Manual Verification

**Step 6.1: Start dev server**

```bash
cd frontend && npm run dev
```

**Step 6.2: Open browser and test**

1. Navigate to a room with Growth Planning game
2. Open browser console
3. Select a mindset card
4. Select an action card
5. Verify:
   - Console logs appear only 2-3 times per card selection (not 50+)
   - Text prefix updates correctly
   - Text sync works between owner and visitor

---

## Task 7: Commit

**Step 7.1: Stage and commit**

```bash
git add frontend/src/components/games/GrowthPlanningGame.tsx
git add frontend/src/components/games/__tests__/GrowthPlanningGame.test.tsx

git commit -m "$(cat <<'EOF'
fix(GrowthPlanningGame): eliminate re-render loop with useRef pattern

Problem:
- useEffect for card prefix update had functions and planText in dependency array
- Functions recreate on every render, triggering effect
- Effect updates planText, which triggers effect again
- Result: 50+ repeated renders per card selection

Solution:
- Store getCardPrefix and handlePlanTextChange in refs
- Store planText in ref for reading without triggering effect
- Only depend on actual data: skillCardsInUse, actionCardsInUse, isRoomOwner
- Pattern already proven in same file (gameSyncRef, debouncedSaveGameState)

Generated with Claude Code
via Happy

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
EOF
)"
```

---

## Summary

| Task | Description | Risk |
|------|-------------|------|
| 1 | Write failing test | None |
| 2 | Remove debug log | None |
| 3 | Add function refs | Low - additive only |
| 4 | Refactor useEffect | Medium - behavior change |
| 5 | Run test suite | None |
| 6 | Manual verification | None |
| 7 | Commit | None |

**Total estimated changes:** ~30 lines modified, ~100 lines test added

**Rollback plan:** Revert commit if issues found
