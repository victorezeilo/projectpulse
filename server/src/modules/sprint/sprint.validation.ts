import { z } from 'zod';
import { SprintStatus } from '@prisma/client';

export const createSprintSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z
    .string()
    .min(2, 'Sprint name must be at least 2 characters')
    .max(100, 'Sprint name must be at most 100 characters')
    .trim(),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const startSprintSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type StartSprintInput = z.infer<typeof startSprintSchema>;