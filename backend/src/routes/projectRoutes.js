const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { listProjects, getProject, createProject, updateProject, deleteProject } = require('../controllers/projectController');

router.get('/', auth, listProjects);
router.get('/:id', auth, getProject);
router.post('/', auth, createProject);
router.patch('/:id', auth, updateProject);
router.put('/:id', auth, updateProject); // keep PUT for compatibility
router.delete('/:id', auth, deleteProject);

module.exports = router;