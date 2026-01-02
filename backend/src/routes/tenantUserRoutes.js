import { Router } from 'express';
import { createUserHandler, listUsersHandler } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', (req, res, next) => {
    if (![ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
}, createUserHandler);

router.get('/', listUsersHandler);

export default router;