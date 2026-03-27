import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

const roleHierarchy: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
};

export const requireWorkspaceRole = (minRole: WorkspaceRole) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      if (!userId) {
        throw ApiError.unauthorized();
      }

      if (!workspaceId) {
        throw ApiError.badRequest('Workspace ID is required');
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      });

      if (!member) {
        throw ApiError.forbidden('You are not a member of this workspace');
      }

      if (roleHierarchy[member.role] < roleHierarchy[minRole]) {
        throw ApiError.forbidden(
          `This action requires ${minRole.toLowerCase()} access or higher`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};