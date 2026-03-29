import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sprintId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(TaskStatus).optional().default('BACKLOG'),
  priority: z.nativeEnum(TaskPriority).optional().default('MEDIUM'),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const moveTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  position: z.number().int().min(0),
});

export const taskQuerySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sprintId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;