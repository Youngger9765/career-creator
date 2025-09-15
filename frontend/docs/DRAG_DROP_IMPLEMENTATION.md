# Drag & Drop Implementation Guide

## Overview

This document explains the working drag-and-drop implementation using
@dnd-kit/core that successfully allows cards to be dragged between zones.

## Key Components

### 1. DraggableCard

- Uses `useDraggable` hook from @dnd-kit/core
- Requires unique `id` for each draggable item
- Applies transform styles for smooth dragging

```typescript
const { attributes, listeners, setNodeRef, transform } = useDraggable({
  id: id,
});
```

### 2. DroppableZone

- Uses `useDroppable` hook from @dnd-kit/core
- Each zone has unique `id` for drop targeting
- Visual feedback with `isOver` state

```typescript
const { isOver, setNodeRef } = useDroppable({
  id: id,
});
```

### 3. DndContext

- Wraps entire drag-drop area
- Handles drag events (onDragStart, onDragEnd)
- Uses `closestCenter` collision detection

### 4. DragOverlay

- Shows preview of dragged item
- Maintains visual consistency during drag

## Core Logic

### State Management

```typescript
const [items, setItems] = useState({
  free: [...initialCards],
  advantage: [],
  disadvantage: [],
});
```

### handleDragEnd

1. Find source container of dragged item
2. Check if dropping on valid zone
3. Remove from source container
4. Add to target container
5. Update state atomically

## Key Success Factors

1. **Simple ID matching**: Direct string IDs without complex prefixes
2. **Clean refs**: Proper useDroppable refs on drop zones
3. **State atomicity**: Single setState call for moves
4. **Visual feedback**: Clear hover states for zones

## Testing with Playwright

```typescript
// Drag card from free zone to advantage zone
const card = page.locator('text=溝通協調').first();
const advantageZone = page.locator('text=優勢區域').locator('..');
await card.dragTo(advantageZone);
```

## Integration Notes

When integrating into larger components:

1. Keep draggable IDs consistent
2. Ensure droppable zones have proper refs
3. Handle state updates atomically
4. Provide clear visual feedback
