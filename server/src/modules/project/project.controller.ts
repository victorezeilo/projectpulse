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
  static createLabel = asyncHandler(async (req: Request, res: Response) => {
    const { name, color } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Label name is required' });
      return;
    }

    const label = await ProjectService.createLabel(
      req.params.projectId,
      name,
      color || '#6B778C',
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: label,
      message: 'Label created successfully',
    };

    res.status(201).json(response);
  });

  static getLabels = asyncHandler(async (req: Request, res: Response) => {
    const labels = await ProjectService.getLabels(
      req.params.projectId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: labels,
    };

    res.status(200).json(response);
  });
}