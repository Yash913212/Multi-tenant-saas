const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');
const { listTenants, createTenant, getTenant, updateTenant, deleteTenant } = require('../controllers/tenantController'); // Import deleteTenant
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

// --- TENANT ROUTES ---
router.get('/', authMiddleware, allowRoles('super_admin'), listTenants);
router.post('/', authMiddleware, allowRoles('super_admin'), createTenant);
router.get('/:tenantId', authMiddleware, tenantGuard('tenantId'), getTenant);
router.put('/:tenantId', authMiddleware, allowRoles('super_admin', 'tenant_admin'), tenantGuard('tenantId'), updateTenant);
router.delete('/:tenantId', authMiddleware, allowRoles('super_admin'), deleteTenant);

// --- USER MANAGEMENT ROUTES ---

// 1. List Users
router.get('/:tenantId/users', authMiddleware, tenantGuard('tenantId'), listUsers);

// 2. Add User
router.post('/:tenantId/users', authMiddleware, allowRoles('super_admin', 'tenant_admin'), tenantGuard('tenantId'), createUser);

// 3. Update User (New)
// URL: /api/tenants/:tenantId/users/:userId
router.put('/:tenantId/users/:userId', authMiddleware, allowRoles('super_admin', 'tenant_admin'), tenantGuard('tenantId'), updateUser);

// 4. Delete User (New)
// URL: /api/tenants/:tenantId/users/:userId
router.delete('/:tenantId/users/:userId', authMiddleware, allowRoles('super_admin', 'tenant_admin'), tenantGuard('tenantId'), deleteUser);

module.exports = router;