import { Router } from 'express';
import {
    createProjectHandler,
    listProjectsHandler,
    getProjectHandler,
    updateProjectHandler,
    deleteProjectHandler
} from '../controllers/projectController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.post('/', requireRole(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), createProjectHandler);
router.get('/', listProjectsHandler);
router.get('/:id', getProjectHandler);
router.patch('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), updateProjectHandler);
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), deleteProjectHandler);

export default router;