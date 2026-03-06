const express = require('express');
const router = express.Router();
const {
  uploadImage,
  getImages,
  getWarningImages,
  deleteImage
} = require('../controllers/image.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');
const upload = require('../middleware/upload');

router.use(verifyToken);

router.get('/warnings', authorizeRole('admin'), getWarningImages);
router.post('/upload', authorizeRole('admin', 'laborer'), upload.single('image'), uploadImage);
router.get('/', getImages);
router.delete('/:id', authorizeRole('admin'), deleteImage);

module.exports = router;
