const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, logout } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
