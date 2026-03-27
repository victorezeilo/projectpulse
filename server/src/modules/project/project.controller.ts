import { Request, Response } from 'express';
import { ProjectService } from './project.service';
import { createProjectSchema, updateProjectSchema } from './project.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../types';

export class ProjectController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const input = createProjectSchema.parse(req.body);
    const project = await ProjectService.create(input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };

    res.status(201).json(response);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const project = await ProjectService.getById(req.params.projectId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: project,
    };

    res.status(200).json(response);
  });

  static getByWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const projects = await ProjectService.getByWorkspace(
      req.params.workspaceId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: projects,
    };

    res.status(200).json(response);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const input = updateProjectSchema.parse(req.body);
    const project = await ProjectService.update(
      req.params.projectId,
      input,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };

    res.status(200).json(response);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ProjectService.delete(req.params.projectId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully',
    };

    res.status(200).json(response);
  });
}