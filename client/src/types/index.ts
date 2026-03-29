export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  owner: User;
  createdAt: string;
  _count: {
    projects: number;
    members: number;
  };
}

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[];
  projects: ProjectSummary[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: User;
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  key: string;
  createdAt: string;
  sprints: SprintSummary[];
  labels: Label[];
  _count: {
    tasks: number;
    sprints: number;
  };
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface SprintSummary {
  id: string;
  name: string;
  goal: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
  _count: {
    tasks: number;
  };
}

export interface Sprint extends SprintSummary {
  totalPoints: number;
  completedPoints: number;
}

export interface Task {
  id: string;
  projectId: string;
  sprintId: string | null;
  assigneeId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number | null;
  position: number;
  taskNumber: number;
  taskKey: string;
  dueDate: string | null;
  createdAt: string;
  assignee: User | null;
  creator?: User;
  labels: { label: Label }[];
  sprint?: { id: string; name: string; status: string } | null;
  _count?: {
    comments: number;
    timeEntries?: number;
  };
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface BoardColumns {
  BACKLOG: Task[];
  TODO: Task[];
  IN_PROGRESS: Task[];
  IN_REVIEW: Task[];
  DONE: Task[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}