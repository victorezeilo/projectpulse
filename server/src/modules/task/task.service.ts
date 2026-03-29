import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateTaskInput, UpdateTaskInput, MoveTaskInput, TaskQueryInput } from './task.validation';
import { Prisma } from '@prisma/client';

export class TaskService {
  static async create(input: CreateTaskInput, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const member = project.workspace.members[0];
    if (!member) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    if (member.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot create tasks');
    }

    // Validate sprint belongs to same project
    if (input.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: input.sprintId },
      });

      if (!sprint || sprint.projectId !== input.projectId) {
        throw ApiError.badRequest('Sprint does not belong to this project');
      }
    }

    // Validate assignee is a workspace member
    if (input.assigneeId) {
      const assigneeMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: input.assigneeId,
          },
        },
      });

      if (!assigneeMember) {
        throw ApiError.badRequest('Assignee is not a member of this workspace');
      }
    }

    // Get next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: input.projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    const taskNumber = (lastTask?.taskNumber || 0) + 1;

    // Get the highest position in the target status column
    const lastPosition = await prisma.task.findFirst({
      where: {
        projectId: input.projectId,
        status: input.status,
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (lastPosition?.position || 0) + 1;

    const task = await prisma.task.create({
      data: {
        projectId: input.projectId,
        sprintId: input.sprintId || null,
        assigneeId: input.assigneeId || null,
        creatorId: userId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        storyPoints: input.storyPoints,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        taskNumber,
        position,
        labels: {
          create: input.labelIds.map((labelId) => ({
            labelId,
          })),
        },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: project.workspaceId,
        userId,
        action: 'created_task',
        entityType: 'task',
        entityId: task.id,
        metadata: {
          taskTitle: input.title,
          taskKey: `${project.key}-${taskNumber}`,
        },
      },
    });

    return {
      ...task,
      taskKey: `${project.key}-${taskNumber}`,
    };
  }

  static async getById(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId }, select: { userId: true } },
              },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true, timeEntries: true } },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    if (task.project.workspace.members.length === 0) {
      throw ApiError.forbidden('You do not have access to this task');
    }

    const { project, ...taskData } = task;
    return {
      ...taskData,
      projectId: project.id,
      taskKey: `${project.key}-${task.taskNumber}`,
    };
  }

  static async query(input: TaskQueryInput, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId }, select: { userId: true } },
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.workspace.members.length === 0) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Build filter
    const where: Prisma.TaskWhereInput = {
      projectId: input.projectId,
    };

    if (input.sprintId) {
      where.sprintId = input.sprintId;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.priority) {
      where.priority = input.priority;
    }

    if (input.assigneeId) {
      where.assigneeId = input.assigneeId;
    }

    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const page = parseInt(input.page);
    const limit = parseInt(input.limit);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          labels: {
            include: { label: true },
          },
          sprint: {
            select: { id: true, name: true, status: true },
          },
          _count: { select: { comments: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks: tasks.map((task) => ({
        ...task,
        taskKey: `${project.key}-${task.taskNumber}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getBoardTasks(projectId: string, sprintId: string | undefined, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId }, select: { userId: true } },
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.workspace.members.length === 0) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    const where: Prisma.TaskWhereInput = { projectId };

    if (sprintId) {
      where.sprintId = sprintId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { position: 'asc' },
    });

    // Group tasks by status for the Kanban board
    const columns = {
      BACKLOG: [] as typeof tasks,
      TODO: [] as typeof tasks,
      IN_PROGRESS: [] as typeof tasks,
      IN_REVIEW: [] as typeof tasks,
      DONE: [] as typeof tasks,
    };

    tasks.forEach((task) => {
      const taskWithKey = {
        ...task,
        taskKey: `${project.key}-${task.taskNumber}`,
      };
      columns[task.status].push(taskWithKey as any);
    });

    return columns;
  }

  static async update(taskId: string, input: UpdateTaskInput, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId }, select: { role: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const member = task.project.workspace.members[0];
    if (!member) {
      throw ApiError.forbidden('You do not have access to this task');
    }

    if (member.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot update tasks');
    }

    // Validate assignee if changing
    if (input.assigneeId) {
      const assigneeMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: task.project.workspaceId,
            userId: input.assigneeId,
          },
        },
      });

      if (!assigneeMember) {
        throw ApiError.badRequest('Assignee is not a member of this workspace');
      }
    }

    // Validate sprint if changing
    if (input.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: input.sprintId },
      });

      if (!sprint || sprint.projectId !== task.projectId) {
        throw ApiError.badRequest('Sprint does not belong to this project');
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        storyPoints: input.storyPoints,
        assigneeId: input.assigneeId,
        sprintId: input.sprintId,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return {
      ...updated,
      taskKey: `${task.project.key}-${task.taskNumber}`,
    };
  }

  static async move(taskId: string, input: MoveTaskInput, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId }, select: { role: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const member = task.project.workspace.members[0];
    if (!member) {
      throw ApiError.forbidden('You do not have access to this task');
    }

    if (member.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot move tasks');
    }

    const oldStatus = task.status;

    // Reorder: shift tasks in the target column to make room
    await prisma.task.updateMany({
      where: {
        projectId: task.projectId,
        status: input.status,
        position: { gte: input.position },
        id: { not: taskId },
      },
      data: {
        position: { increment: 1 },
      },
    });

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: input.status,
        position: input.position,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    if (oldStatus !== input.status) {
      await prisma.activity.create({
        data: {
          workspaceId: task.project.workspaceId,
          userId,
          action: 'moved_task',
          entityType: 'task',
          entityId: task.id,
          metadata: {
            taskKey: `${task.project.key}-${task.taskNumber}`,
            from: oldStatus,
            to: input.status,
          },
        },
      });
    }

    return {
      ...updated,
      taskKey: `${task.project.key}-${task.taskNumber}`,
    };
  }

  static async updateLabels(taskId: string, labelIds: string[], userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId }, select: { role: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const member = task.project.workspace.members[0];
    if (!member || member.role === 'VIEWER') {
      throw ApiError.forbidden('You do not have permission to update labels');
    }

    // Remove all existing labels and add new ones
    await prisma.taskLabel.deleteMany({
      where: { taskId },
    });

    if (labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: labelIds.map((labelId) => ({
          taskId,
          labelId,
        })),
      });
    }

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    return updated;
  }

  static async delete(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId }, select: { role: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const member = task.project.workspace.members[0];
    if (!member) {
      throw ApiError.forbidden('You do not have access to this task');
    }

    if (member.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot delete tasks');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }
}