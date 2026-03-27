import { Request, Response } from 'express';
import { SprintService } from './sprint.service';
import {
  createSprintSchema,
  updateSprintSchema,
  startSprintSchema,
} from './sprint.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../types';

export class SprintController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const input = createSprintSchema.parse(req.body);
    const sprint = await SprintService.create(input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: sprint,
      message: 'Sprint created successfully',
    };

    res.status(201).json(response);
  });

  static getByProject = asyncHandler(async (req: Request, res: Response) => {
    const sprints = await SprintService.getByProject(
      req.params.projectId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: sprints,
    };

    res.status(200).json(response);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const sprint = await SprintService.getById(
      req.params.sprintId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: sprint,
    };

    res.status(200).json(response);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const input = updateSprintSchema.parse(req.body);
    const sprint = await SprintService.update(
      req.params.sprintId,
      input,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: sprint,
      message: 'Sprint updated successfully',
    };

    res.status(200).json(response);
  });

  static start = asyncHandler(async (req: Request, res: Response) => {
    const input = startSprintSchema.parse(req.body);
    const sprint = await SprintService.start(
      req.params.sprintId,
      input,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: sprint,
      message: 'Sprint started successfully',
    };

    res.status(200).json(response);
  });

  static complete = asyncHandler(async (req: Request, res: Response) => {
    const result = await SprintService.complete(
      req.params.sprintId,
      req.user!.id
    );

    const response: ApiResponse = {
      success: true,
      data: result,
      message: `Sprint completed. ${result.incompleteTasksMoved} incomplete task(s) moved to backlog.`,
    };

    res.status(200).json(response);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await SprintService.delete(req.params.sprintId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      message: 'Sprint deleted successfully',
    };

    res.status(200).json(response);
  });
}