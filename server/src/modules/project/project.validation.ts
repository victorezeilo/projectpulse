import { z } from 'zod';

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters')
    .trim(),
  description: z.string().max(1000).optional(),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must be at most 10 characters')
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]*$/, 'Key must start with a letter and contain only letters and numbers'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(1000).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;