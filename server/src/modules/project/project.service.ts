import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateProjectInput, UpdateProjectInput } from './project.validation';

export class ProjectService {
  static async create(input: CreateProjectInput, userId: string) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this workspace');
    }

    if (membership.role === 'VIEWER') {
      throw ApiError.forbidden('Viewers cannot create projects');
    }

    const existingKey = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: input.workspaceId,
          key: input.key,
        },
      },
    });

    if (existingKey) {
      throw ApiError.conflict(`Project key "${input.key}" is already in use in this workspace`);
    }

    const project = await prisma.project.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
        key: input.key,
      },
      include: {
        _count: { select: { tasks: true, sprints: true } },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: input.workspaceId,
        userId,
        action: 'created_project',
        entityType: 'project',
        entityId: project.id,
        metadata: { projectName: input.name, key: input.key },
      },
    });

    return project;
  }

  static async getById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: { select: { userId: true } },
          },
        },
        sprints: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            goal: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: { select: { tasks: true } },
          },
        },
        labels: {
          orderBy: { name: 'asc' },
        },
        _count: { select: { tasks: true, sprints: true } },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const isMember = project.workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    const { workspace, ...projectData } = project;
    return { ...projectData, workspaceId: workspace.id };
  }

  static async getByWorkspace(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this workspace');
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { tasks: true, sprints: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  static async update(projectId: string, input: UpdateProjectInput, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
      throw ApiError.forbidden('Viewers cannot update projects');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: input,
      include: {
        _count: { select: { tasks: true, sprints: true } },
      },
    });

    return updated;
  }

  static async delete(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
    if (!member || member.role !== 'ADMIN') {
      throw ApiError.forbidden('Only admins can delete projects');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true };
  }
}