import { Router } from 'express';
import {
    createTaskHandler,
    listTasksHandler,
    updateTaskHandler,
    deleteTaskHandler
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.post('/', createTaskHandler);
router.get('/', listTasksHandler);
router.put('/:id', updateTaskHandler);
router.patch('/:id', updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export default router;