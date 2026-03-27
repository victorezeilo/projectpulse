import { Request, Response } from 'express';
import { WorkspaceService } from './workspace.service';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './workspace.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../types';

export class WorkspaceController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const input = createWorkspaceSchema.parse(req.body);
    const workspace = await WorkspaceService.create(input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: workspace,
      message: 'Workspace created successfully',
    };

    res.status(201).json(response);
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const workspaces = await WorkspaceService.getAll(req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: workspaces,
    };

    res.status(200).json(response);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await WorkspaceService.getById(
      req.params.workspaceId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: workspace,
    };

    res.status(200).json(response);
  });

  static inviteMember = asyncHandler(async (req: Request, res: Response) => {
    const input = inviteMemberSchema.parse(req.body);
    const member = await WorkspaceService.inviteMember(
      req.params.workspaceId,
      input,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Member invited successfully',
    };

    res.status(201).json(response);
  });

  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const input = updateMemberRoleSchema.parse(req.body);
    const member = await WorkspaceService.updateMemberRole(
      req.params.workspaceId,
      req.params.userId,
      input
    );

    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Member role updated successfully',
    };

    res.status(200).json(response);
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    await WorkspaceService.removeMember(
      req.params.workspaceId,
      req.params.userId
    );

    const response: ApiResponse = {
      success: true,
      message: 'Member removed successfully',
    };

    res.status(200).json(response);
  });
}