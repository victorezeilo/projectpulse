import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

// POST /api/v1/tasks
router.post('/', TaskController.create);

// GET /api/v1/tasks (with query filters)
router.get('/', TaskController.query);

// GET /api/v1/tasks/board/:projectId
router.get('/board/:projectId', TaskController.board);

// GET /api/v1/tasks/:taskId
router.get('/:taskId', TaskController.getById);

// PATCH /api/v1/tasks/:taskId
router.patch('/:taskId', TaskController.update);

// PATCH /api/v1/tasks/:taskId/move
router.patch('/:taskId/move', TaskController.move);

// PUT /api/v1/tasks/:taskId/labels
router.put('/:taskId/labels', TaskController.updateLabels);

// DELETE /api/v1/tasks/:taskId
router.delete('/:taskId', TaskController.delete);

export default router;