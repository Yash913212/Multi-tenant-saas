// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/authMiddleware');
// const { listTasks, createTask } = require('../controllers/taskController');

// router.get('/', auth, listTasks);
// router.post('/', auth, createTask);

// module.exports = router;


const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { listTasks, createTask, updateTaskStatus, updateTask, deleteTask } = require('../controllers/taskController');

// Standard Routes
router.get('/', auth, listTasks);
router.post('/', auth, createTask);

// New Modification Routes
router.patch('/:id/status', auth, updateTaskStatus); // API 18
router.put('/:id', auth, updateTask);                // API 19
router.delete('/:id', auth, deleteTask);             // Delete

module.exports = router;