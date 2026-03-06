const express = require('express');
const router = express.Router();
const {
  getLaborers,
  createLaborer,
  getLaborer,
  updateLaborer,
  deleteLaborer,
  getAttendance,
  getBalance
} = require('../controllers/laborer.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

// Laborer can access their own data
router.get('/:id', verifyToken, getLaborer);
router.get('/:id/attendance', verifyToken, getAttendance);
router.get('/:id/balance', verifyToken, getBalance);

// Public routes (admin only)
router.use(verifyToken, authorizeRole('admin'));

router.get('/', getLaborers);
router.post('/', createLaborer);
router.put('/:id', updateLaborer);
router.delete('/:id', deleteLaborer);

module.exports = router;
