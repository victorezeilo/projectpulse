import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name must be at most 100 characters')
    .trim(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  role: z.nativeEnum(WorkspaceRole).optional().default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;