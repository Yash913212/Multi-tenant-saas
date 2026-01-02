import { Router } from 'express';
import { registerTenantHandler, loginHandler, meHandler, logoutHandler } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register-tenant', registerTenantHandler);
router.post('/login', loginHandler);
router.get('/me', authenticate, meHandler);
router.post('/logout', authenticate, logoutHandler);

export default router;