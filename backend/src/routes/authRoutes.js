// const router = require('express').Router();
// const auth = require('../middleware/authMiddleware');
// const { 
//   registerTenant, 
//   login, 
//   getCurrentUser, 
//   logout 
// } = require('../controllers/authController');

// // Public Routes
// router.post('/register-tenant', registerTenant); // <-- The new one
// router.post('/login', login);

// // Protected Routes
// router.get('/me', auth, getCurrentUser);
// router.post('/logout', auth, logout);

// module.exports = router;



const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  registerTenant, // Import the new function
  login, 
  getCurrentUser, 
  logout 
} = require('../controllers/authController');

// Public Routes
router.post('/register-tenant', registerTenant); // <--- This now points to real logic
router.post('/login', login);

// Protected Routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logout);

module.exports = router;