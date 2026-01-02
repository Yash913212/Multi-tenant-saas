// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/authMiddleware');
// const allow = require('../middleware/roleMiddleware');
// const tenantGuard = require('../middleware/tenantMiddleware');
// const { listUsers, createUser } = require('../controllers/userController');

// router.get('/', auth, allow('super_admin','tenant_admin'), listUsers);
// router.post('/', auth, allow('tenant_admin'), createUser);

// module.exports = router;



const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const allow = require('../middleware/roleMiddleware');
// const tenantGuard = require('../middleware/tenantMiddleware'); // Optional, depending on your setup
const { listUsers, createUser } = require('../controllers/userController');

// 1. List Users: Both Super Admin and Tenant Admin can see users
router.get('/', auth, allow('super_admin', 'tenant_admin'), listUsers);

// 2. Create User: Update this line to allow Super Admin too!
router.post('/', auth, allow('super_admin', 'tenant_admin'), createUser);

module.exports = router;