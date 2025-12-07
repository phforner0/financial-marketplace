// src/app/dashboard/watchlists/[id]/page.tsx (exemplo)
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useSWR, { mutate } from 'swr';
import styles from '../../Dashboard.module.css';

interface WatchlistItem {
  id: string;
  symbol: string;
  order: number;
  // ... other fields
}

function SortableItem({ item }: { item: WatchlistItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Seu conteúdo da row */}
      <div className={styles.watchlistRow}>
        <span className={styles.dragHandle}>⋮⋮</span>
        <span>{item.symbol}</span>
        {/* ... */}
      </div>
    </div>
  );
}

export default function WatchlistDetailPage({ params }: { params: { id: string } }) {
  const { data: watchlist } = useSWR(`/api/watchlists/${params.id}`);
  const [items, setItems] = useState<WatchlistItem[]>(watchlist?.items || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order in DB
        updateOrder(newItems);
        
        return newItems;
      });
    }
  }

  async function updateOrder(items: WatchlistItem[]) {
    await fetch(`/api/watchlists/${params.id}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item, index) => ({ id: item.id, order: index }))
      })
    });
    
    mutate(`/api/watchlists/${params.id}`);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map(item => (
          <SortableItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
}