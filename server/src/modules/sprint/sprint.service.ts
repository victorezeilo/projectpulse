import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateSprintInput, UpdateSprintInput, StartSprintInput } from './sprint.validation';

export class SprintService {
  static async create(input: CreateSprintInput, userId: string) {
    // Verify user has access to the project
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
      throw ApiError.forbidden('Viewers cannot create sprints');
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        goal: input.goal,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: project.workspaceId,
        userId,
        action: 'created_sprint',
        entityType: 'sprint',
        entityId: sprint.id,
        metadata: { sprintName: input.name },
      },
    });

    return sprint;
  }

  static async getByProject(projectId: string, userId: string) {
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

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            id: true,
            storyPoints: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add computed fields
    return sprints.map((sprint) => {
      const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedPoints = sprint.tasks
        .filter((t) => t.status === 'DONE')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const { tasks, ...sprintData } = sprint;
      return {
        ...sprintData,
        totalPoints,
        completedPoints,
      };
    });
  }

  static async getById(sprintId: string, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
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
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            labels: {
              include: { label: true },
            },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!sprint) {
      throw ApiError.notFound('Sprint not found');
    }

    if (sprint.project.workspace.members.length === 0) {
      throw ApiError.forbidden('You do not have access to this sprint');
    }

    const { project, ...sprintData } = sprint;
    return { ...sprintData, projectId: project.id };
  }

  static async update(sprintId: string, input: UpdateSprintInput, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
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

    if (!sprint) {
      throw ApiError.notFound('Sprint not found');
    }

    const member = sprint.project.workspace.members[0];
    if (!member) {
      throw ApiError.forbidden('You do not have access to this sprint');
    }

    if (member.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot update sprints');
    }

    const updated = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        name: input.name,
        goal: input.goal,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return updated;
  }

  static async start(sprintId: string, input: StartSprintInput, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
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

    if (!sprint) {
      throw ApiError.notFound('Sprint not found');
    }

    const member = sprint.project.workspace.members[0];
    if (!member || member.role === 'VIEWER') {
      throw ApiError.forbidden('You do not have permission to start sprints');
    }

    if (sprint.status !== 'PLANNED') {
      throw ApiError.badRequest('Only planned sprints can be started');
    }

    // Check no other sprint is active in this project
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: 'ACTIVE',
      },
    });

    if (activeSprint) {
      throw ApiError.conflict(
        `Sprint "${activeSprint.name}" is already active. Complete it before starting a new one.`
      );
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = input.endDate
      ? new Date(input.endDate)
      : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks

    const updated = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: 'ACTIVE',
        startDate,
        endDate,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: sprint.project.workspaceId,
        userId,
        action: 'started_sprint',
        entityType: 'sprint',
        entityId: sprint.id,
        metadata: { sprintName: sprint.name },
      },
    });

    return updated;
  }

  static async complete(sprintId: string, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
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
        tasks: {
          where: { status: { not: 'DONE' } },
          select: { id: true },
        },
      },
    });

    if (!sprint) {
      throw ApiError.notFound('Sprint not found');
    }

    const member = sprint.project.workspace.members[0];
    if (!member || member.role === 'VIEWER') {
      throw ApiError.forbidden('You do not have permission to complete sprints');
    }

    if (sprint.status !== 'ACTIVE') {
      throw ApiError.badRequest('Only active sprints can be completed');
    }

    // Move incomplete tasks back to backlog (remove from sprint)
    const incompleteTaskIds = sprint.tasks.map((t) => t.id);

    if (incompleteTaskIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: incompleteTaskIds } },
        data: { sprintId: null, status: 'BACKLOG' },
      });
    }

    const updated = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: 'COMPLETED' },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: sprint.project.workspaceId,
        userId,
        action: 'completed_sprint',
        entityType: 'sprint',
        entityId: sprint.id,
        metadata: {
          sprintName: sprint.name,
          incompleteTasksMoved: incompleteTaskIds.length,
        },
      },
    });

    return {
      sprint: updated,
      incompleteTasksMoved: incompleteTaskIds.length,
    };
  }

  static async delete(sprintId: string, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
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

    if (!sprint) {
      throw ApiError.notFound('Sprint not found');
    }

    const member = sprint.project.workspace.members[0];
    if (!member || member.role !== 'ADMIN') {
      throw ApiError.forbidden('Only admins can delete sprints');
    }

    if (sprint.status === 'ACTIVE') {
      throw ApiError.badRequest('Cannot delete an active sprint. Complete it first.');
    }

    // Move tasks back to backlog before deleting
    await prisma.task.updateMany({
      where: { sprintId },
      data: { sprintId: null, status: 'BACKLOG' },
    });

    await prisma.sprint.delete({
      where: { id: sprintId },
    });

    return { success: true };
  }
}