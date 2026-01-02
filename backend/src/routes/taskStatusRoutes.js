import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { deleteTaskHandler, getTaskHandler, updateTaskHandler, updateTaskStatusHandler } from '../controllers/taskController.js';

const router = Router();
router.use(authenticate);

router.get('/:taskId', getTaskHandler);
router.patch('/:taskId/status', updateTaskStatusHandler);
router.put('/:taskId', updateTaskHandler);
router.delete('/:taskId', deleteTaskHandler);

export default router;