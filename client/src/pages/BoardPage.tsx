import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import api from '../lib/api';
import type { Project, BoardColumns, Task, ApiResponse, Sprint } from '../types/index';
import KanbanBoard from '../components/board/KanbanBoard';
import CreateTaskModal from '../components/board/CreateTaskModal';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<BoardColumns | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchSprints();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchBoard();
    }
  }, [projectId, selectedSprint]);

  const fetchProject = async () => {
    try {
      const res = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
      setProject(res.data.data || null);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      const res = await api.get<ApiResponse<Sprint[]>>(`/sprints/project/${projectId}`);
      const data = res.data.data || [];
      setSprints(data);

      // Auto-select active sprint
      const active = data.find((s) => s.status === 'ACTIVE');
      if (active) {
        setSelectedSprint(active.id);
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    }
  };

  const fetchBoard = async () => {
    try {
      const url = selectedSprint
        ? `/tasks/board/${projectId}?sprintId=${selectedSprint}`
        : `/tasks/board/${projectId}`;
      const res = await api.get<ApiResponse<BoardColumns>>(url);
      setColumns(res.data.data || null);
    } catch (error) {
      console.error('Failed to fetch board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskMoved = async (taskId: string, newStatus: string, newPosition: number) => {
    // Optimistic update
    if (!columns) return;

    const updatedColumns = { ...columns };
    let movedTask: Task | undefined;

    // Remove from old column
    for (const status of Object.keys(updatedColumns) as (keyof BoardColumns)[]) {
      const idx = updatedColumns[status].findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        movedTask = updatedColumns[status][idx];
        updatedColumns[status] = updatedColumns[status].filter((t) => t.id !== taskId);
        break;
      }
    }

    if (!movedTask) return;

    // Add to new column
    const targetColumn = updatedColumns[newStatus as keyof BoardColumns];
    const updatedTask = { ...movedTask, status: newStatus as Task['status'] };
    targetColumn.splice(newPosition, 0, updatedTask);

    setColumns(updatedColumns);

    // API call
    try {
      await api.patch(`/tasks/${taskId}/move`, {
        status: newStatus,
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to move task:', error);
      fetchBoard(); // Revert on error
    }
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    fetchBoard();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-16 text-gray-500">Project not found</div>;
  }

  const activeSprint = sprints.find((s) => s.id === selectedSprint);

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/workspace/${project.workspaceId}`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.key} Board</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sprint selector */}
          <select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All tasks</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} {sprint.status === 'ACTIVE' ? '(Active)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} />
            Create Task
          </button>
        </div>
      </div>

      {/* Sprint info bar */}
      {activeSprint && (
        <div className="mx-2 mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-sm">
          <span className="text-blue-800">
            <strong>{activeSprint.name}</strong>
            {activeSprint.goal && ` — ${activeSprint.goal}`}
          </span>
          <span className="text-blue-600">
            {activeSprint.completedPoints}/{activeSprint.totalPoints} points
          </span>
        </div>
      )}

      {/* Kanban Board */}
      {columns && (
        <KanbanBoard columns={columns} onTaskMoved={handleTaskMoved} />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={project.id}
          sprints={sprints}
          labels={project.labels}
          onClose={() => setShowCreateTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}