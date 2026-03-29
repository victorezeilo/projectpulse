import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Calendar, User } from 'lucide-react';
import type { Task } from '../../types/index';
import clsx from 'clsx';

interface Props {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', label: 'P0' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'P1' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'P2' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'P3' },
};

export default function TaskCard({ task, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow',
        {
          'opacity-50': isSortableDragging,
          'shadow-lg rotate-2 scale-105': isDragging,
        }
      )}
    >
      {/* Task key and priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">{task.taskKey}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: story points, comments, assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-gray-400">
          {task.storyPoints !== null && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-medium">
              {task.storyPoints} pts
            </span>
          )}
          {task._count?.comments ? (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare size={12} />
              {task._count.comments}
            </span>
          ) : null}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs">
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
            title={task.assignee.name}
          >
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}