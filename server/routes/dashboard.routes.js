const express = require('express');
const router = express.Router();
const {
  getStats,
  getAlerts,
  getRecent
} = require('../controllers/dashboard.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

router.use(verifyToken, authorizeRole('admin'));

router.get('/stats', getStats);
router.get('/alerts', getAlerts);
router.get('/recent', getRecent);

module.exports = router;
