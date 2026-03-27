import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspaceRole } from '../../middleware/authorize';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// POST /api/v1/workspaces
router.post('/', WorkspaceController.create);

// GET /api/v1/workspaces
router.get('/', WorkspaceController.getAll);

// GET /api/v1/workspaces/:workspaceId
router.get('/:workspaceId', WorkspaceController.getById);

// POST /api/v1/workspaces/:workspaceId/invite (admin only)
router.post(
  '/:workspaceId/invite',
  requireWorkspaceRole('ADMIN'),
  WorkspaceController.inviteMember
);

// PATCH /api/v1/workspaces/:workspaceId/members/:userId (admin only)
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('ADMIN'),
  WorkspaceController.updateMemberRole
);

// DELETE /api/v1/workspaces/:workspaceId/members/:userId (admin only)
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('ADMIN'),
  WorkspaceController.removeMember
);

export default router;