import { Router } from 'express';
import { SprintController } from './sprint.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

// POST /api/v1/sprints
router.post('/', SprintController.create);

// GET /api/v1/sprints/project/:projectId
router.get('/project/:projectId', SprintController.getByProject);

// GET /api/v1/sprints/:sprintId
router.get('/:sprintId', SprintController.getById);

// PATCH /api/v1/sprints/:sprintId
router.patch('/:sprintId', SprintController.update);

// PATCH /api/v1/sprints/:sprintId/start
router.patch('/:sprintId/start', SprintController.start);

// PATCH /api/v1/sprints/:sprintId/complete
router.patch('/:sprintId/complete', SprintController.complete);

// DELETE /api/v1/sprints/:sprintId
router.delete('/:sprintId', SprintController.delete);

export default router;