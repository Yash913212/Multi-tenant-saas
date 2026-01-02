import { Router } from 'express';
import { listTenantsHandler, getTenantHandler, updateTenantHandler } from '../controllers/tenantController.js';
import { authenticate } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => {
    if (req.user.role !== ROLES.SUPER_ADMIN) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
}, listTenantsHandler);

router.get('/:tenantId', getTenantHandler);
router.put('/:tenantId', updateTenantHandler);

export default router;