'use client';

import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Draggable Card
function DraggableCard({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-32 h-44 bg-white border-2 border-gray-300 rounded-lg shadow-md p-4 cursor-move hover:shadow-lg transition-shadow"
    >
      <div className="text-sm font-semibold">{content}</div>
    </div>
  );
}

// Droppable Zone
function DroppableZone({ id, title, cards }: { id: string; title: string; cards: any[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const bgColor = id === 'advantage' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = id === 'advantage' ? 'border-green-400' : 'border-red-400';

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-all
        ${bgColor} ${borderColor}
        ${isOver ? 'border-solid scale-105 shadow-lg' : ''}
      `}
    >
      <h3 className="font-bold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {cards.map((card) => (
          <DraggableCard key={card.id} id={card.id} content={card.content} />
        ))}
      </div>
    </div>
  );
}

export function WorkingDragDrop() {
  const [items, setItems] = useState({
    free: [
      { id: '1', content: '溝通協調' },
      { id: '2', content: '分析思考' },
      { id: '3', content: '領導管理' },
      { id: '4', content: '創新發想' },
      { id: '5', content: '時間管理' },
    ],
    advantage: [],
    disadvantage: [],
  });

  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which container the active item is in
    let sourceContainer = '';
    let activeItem = null;

    for (const [key, value] of Object.entries(items)) {
      const found = value.find((item: any) => item.id === activeId);
      if (found) {
        sourceContainer = key;
        activeItem = found;
        break;
      }
    }

    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // If dropping on a zone
    if (overId === 'advantage' || overId === 'disadvantage' || overId === 'free') {
      if (sourceContainer === overId) {
        // Same container, do nothing
        setActiveId(null);
        return;
      }

      // Move item to new container
      setItems((prev) => {
        const newItems = { ...prev };

        // Remove from source
        newItems[sourceContainer as keyof typeof items] = prev[
          sourceContainer as keyof typeof items
        ].filter((item: any) => item.id !== activeId) as any;

        // Add to target
        newItems[overId as keyof typeof items] = [
          ...prev[overId as keyof typeof items],
          activeItem,
        ] as any;

        return newItems;
      });
    }

    setActiveId(null);
  };

  const getActiveItem = () => {
    if (!activeId) return null;

    for (const value of Object.values(items)) {
      const found = value.find((item: any) => item.id === activeId);
      if (found) return found;
    }
    return null;
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-8">Working Drag & Drop Test</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <DroppableZone id="advantage" title="優勢區域" cards={items.advantage} />
          <DroppableZone id="disadvantage" title="劣勢區域" cards={items.disadvantage} />
        </div>

        <DroppableZone id="free" title="可用卡片" cards={items.free} />
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="w-32 h-44 bg-blue-100 border-2 border-blue-400 rounded-lg shadow-xl p-4 opacity-90">
            <div className="text-sm font-semibold">{getActiveItem()?.content}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
