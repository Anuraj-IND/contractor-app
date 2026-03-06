const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  updateAttendance,
  getProjectSummary
} = require('../controllers/attendance.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

// Laborers can view and mark their own attendance
router.get('/', verifyToken, getAttendance);
router.post('/', verifyToken, markAttendance);

// Admin-only routes
router.use(verifyToken, authorizeRole('admin'));

router.put('/:id', updateAttendance);
router.get('/project/:projectId/summary', getProjectSummary);

module.exports = router;
