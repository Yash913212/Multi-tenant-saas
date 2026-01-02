import { Router } from 'express';
import {
    listUsersHandler,
    getUserHandler,
    updateUserHandler,
    deleteUserHandler
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', listUsersHandler);
router.get('/:id', getUserHandler);
router.put('/:id', updateUserHandler);
router.delete('/:id', (req, res, next) => {
    if (![ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
}, deleteUserHandler);

export default router;