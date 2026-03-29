import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import type { BoardColumns, Task, TaskStatus } from '../../types/index';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

interface Props {
  columns: BoardColumns;
  onTaskMoved: (taskId: string, newStatus: string, newPosition: number) => void;
}

const COLUMN_CONFIG: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-400' },
  { id: 'TODO', title: 'To Do', color: 'bg-blue-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-400' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-400' },
  { id: 'DONE', title: 'Done', color: 'bg-green-400' },
];

export default function KanbanBoard({ columns, onTaskMoved }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;

    // Find the task across all columns
    for (const status of Object.keys(columns) as TaskStatus[]) {
      const task = columns[status].find((t) => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    let targetStatus: TaskStatus | null = null;
    let targetPosition = 0;

    // Dropped on a column
    if (COLUMN_CONFIG.some((c) => c.id === overId)) {
      targetStatus = overId as TaskStatus;
      targetPosition = columns[targetStatus].length;
    } else {
      // Dropped on another task — find which column it's in
      for (const status of Object.keys(columns) as TaskStatus[]) {
        const idx = columns[status].findIndex((t) => t.id === overId);
        if (idx !== -1) {
          targetStatus = status;
          targetPosition = idx;
          break;
        }
      }
    }

    if (!targetStatus) return;

    // Find current position
    let currentStatus: TaskStatus | null = null;
    for (const status of Object.keys(columns) as TaskStatus[]) {
      if (columns[status].some((t) => t.id === taskId)) {
        currentStatus = status;
        break;
      }
    }

    // Don't do anything if dropped in same position
    if (currentStatus === targetStatus) {
      const currentIdx = columns[currentStatus].findIndex((t) => t.id === taskId);
      if (currentIdx === targetPosition) return;
    }

    onTaskMoved(taskId, targetStatus, targetPosition);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-4 overflow-x-auto px-2 pb-4">
        {COLUMN_CONFIG.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            tasks={columns[col.id]}
          />
        ))}
      </div>

      {/* Drag overlay — shows a ghost of the card while dragging */}
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}