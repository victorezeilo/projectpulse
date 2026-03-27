import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// POST /api/v1/projects
router.post('/', ProjectController.create);

// GET /api/v1/projects/:projectId
router.get('/:projectId', ProjectController.getById);

// GET /api/v1/projects/workspace/:workspaceId
router.get('/workspace/:workspaceId', ProjectController.getByWorkspace);

// PATCH /api/v1/projects/:projectId
router.patch('/:projectId', ProjectController.update);

// DELETE /api/v1/projects/:projectId
router.delete('/:projectId', ProjectController.delete);

export default router;