import { Request, Response } from 'express';
import { TaskService } from './task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskQuerySchema,
} from './task.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../types';
import { z } from 'zod';

export class TaskController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const input = createTaskSchema.parse(req.body);
    const task = await TaskService.create(input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: task,
      message: 'Task created successfully',
    };

    res.status(201).json(response);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const task = await TaskService.getById(req.params.taskId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    res.status(200).json(response);
  });

  static query = asyncHandler(async (req: Request, res: Response) => {
    const input = taskQuerySchema.parse(req.query);
    const result = await TaskService.query(input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: result.tasks,
      pagination: result.pagination,
    };

    res.status(200).json(response);
  });

  static board = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const sprintId = req.query.sprintId as string | undefined;

    const columns = await TaskService.getBoardTasks(projectId, sprintId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: columns,
    };

    res.status(200).json(response);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const input = updateTaskSchema.parse(req.body);
    const task = await TaskService.update(req.params.taskId, input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };

    res.status(200).json(response);
  });

  static move = asyncHandler(async (req: Request, res: Response) => {
    const input = moveTaskSchema.parse(req.body);
    const task = await TaskService.move(req.params.taskId, input, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: task,
      message: 'Task moved successfully',
    };

    res.status(200).json(response);
  });

  static updateLabels = asyncHandler(async (req: Request, res: Response) => {
    const { labelIds } = z.object({
      labelIds: z.array(z.string()),
    }).parse(req.body);

    const task = await TaskService.updateLabels(req.params.taskId, labelIds, req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: task,
      message: 'Labels updated successfully',
    };

    res.status(200).json(response);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await TaskService.delete(req.params.taskId, req.user!.id);

    const response: ApiResponse = {
      success: true,
      message: 'Task deleted successfully',
    };

    res.status(200).json(response);
  });
}