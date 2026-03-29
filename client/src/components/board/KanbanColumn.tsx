import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/index';
import TaskCard from './TaskCard';

interface Props {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

export default function KanbanColumn({ id, title, color, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-gray-100/50'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}