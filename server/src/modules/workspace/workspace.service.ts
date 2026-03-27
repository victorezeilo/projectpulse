import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { generateUniqueSlug } from '../../utils/slug';
import { CreateWorkspaceInput, InviteMemberInput, UpdateMemberRoleInput } from './workspace.validation';
import { WorkspaceRole } from '@prisma/client';

export class WorkspaceService {
  static async create(input: CreateWorkspaceInput, userId: string) {
    const slug = generateUniqueSlug(input.name);

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WorkspaceRole.ADMIN,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { projects: true, members: true } },
      },
    });

    return workspace;
  }

  static async getAll(userId: string) {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { projects: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workspaces;
  }

  static async getById(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        projects: {
          select: { id: true, name: true, key: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { projects: true, members: true } },
      },
    });

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw ApiError.forbidden('You are not a member of this workspace');
    }

    return workspace;
  }

  static async inviteMember(
    workspaceId: string,
    input: InviteMemberInput,
    inviterId: string
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!userToInvite) {
      throw ApiError.notFound('No user found with this email. They need to register first.');
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      throw ApiError.conflict('This user is already a member of this workspace');
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: input.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId,
        userId: inviterId,
        action: 'invited_member',
        entityType: 'workspace_member',
        entityId: member.id,
        metadata: { invitedEmail: input.email, role: input.role },
      },
    });

    return member;
  }

  static async updateMemberRole(
    workspaceId: string,
    memberId: string,
    input: UpdateMemberRoleInput
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (memberId === workspace.ownerId) {
      throw ApiError.badRequest('Cannot change the workspace owner\'s role');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: memberId },
    });

    if (!member) {
      throw ApiError.notFound('Member not found in this workspace');
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: input.role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return updated;
  }

  static async removeMember(workspaceId: string, memberId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (memberId === workspace.ownerId) {
      throw ApiError.badRequest('Cannot remove the workspace owner');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: memberId },
    });

    if (!member) {
      throw ApiError.notFound('Member not found in this workspace');
    }

    await prisma.workspaceMember.delete({
      where: { id: member.id },
    });

    return { success: true };
  }
}