const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  logPayment,
  addMaterial,
  removeMaterial,
  assignLaborer,
  removeLaborer
} = require('../controllers/project.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

// Laborers can view their assigned projects
router.get('/', verifyToken, getProjects);
router.get('/:id', verifyToken, getProject);

// Admin-only routes
router.use(verifyToken, authorizeRole('admin'));

router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/payments', logPayment);
router.post('/:id/materials', addMaterial);
router.delete('/:id/materials/:mid', removeMaterial);
router.post('/:id/laborers', assignLaborer);
router.delete('/:id/laborers/:lid', removeLaborer);

module.exports = router;
