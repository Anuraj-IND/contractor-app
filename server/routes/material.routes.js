const express = require('express');
const router = express.Router();
const {
  getMaterials,
  createMaterial,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  logPayment
} = require('../controllers/material.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

router.use(verifyToken, authorizeRole('admin'));

router.get('/', getMaterials);
router.post('/', createMaterial);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.post('/:id/pay', logPayment);

module.exports = router;
