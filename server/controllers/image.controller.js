const SiteImage = require('../models/SiteImage.model');
const cloudinary = require('../config/cloudinary');

// @desc    Upload site image
// @route   POST /api/images/upload
// @access  Private (Admin & Laborer)
exports.uploadImage = async (req, res, next) => {
  try {
    const { projectId, caption } = req.body;

    if (!projectId || !req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and image file are required' 
      });
    }

    const image = await SiteImage.create({
      projectId,
      uploadedBy: req.user._id,
      url: req.file.path,
      publicId: req.file.filename,
      thumbnail: req.file.path,
      caption
    });

    res.status(201).json({ success: true, image });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all images
// @route   GET /api/images
// @access  Private (Admin & Laborer)
exports.getImages = async (req, res, next) => {
  try {
    const { projectId, uploadedBy, markedForDeletion } = req.query;
    let query = {};

    if (projectId) query.projectId = projectId;
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (markedForDeletion !== undefined) {
      query.markedForDeletion = markedForDeletion === 'true';
    }

    const images = await SiteImage.find(query)
      .populate('projectId', 'title customerId')
      .populate('uploadedBy', 'name role')
      .sort({ uploadedAt: -1 });

    res.json({ success: true, images });
  } catch (error) {
    next(error);
  }
};

// @desc    Get images with deletion warnings
// @route   GET /api/images/warnings
// @access  Private (Admin)
exports.getWarningImages = async (req, res, next) => {
  try {
    const now = new Date();
    const warningDays = parseInt(process.env.IMAGE_WARNING_DAYS) || 7;
    const warnCutoff = new Date(now.getTime() + warningDays * 86400000);

    const images = await SiteImage.find({
      deleteAfter: { $lte: warnCutoff },
      markedForDeletion: true
    })
      .populate('projectId', 'title customerId')
      .populate('uploadedBy', 'name')
      .sort({ deleteAfter: 1 });

    res.json({ success: true, images });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Private (Admin)
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await SiteImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    // Delete from database
    await image.deleteOne();

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};
