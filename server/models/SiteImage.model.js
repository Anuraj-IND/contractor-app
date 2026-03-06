const mongoose = require('mongoose');

const SiteImageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  thumbnail: { type: String },
  caption: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  deleteAfter: { type: Date },
  deletionWarningShown: { type: Boolean, default: false },
  markedForDeletion: { type: Boolean, default: false }
}, { timestamps: true });

// Set deleteAfter date on save based on retention period
SiteImageSchema.pre('save', function() {
  const retentionDays = parseInt(process.env.IMAGE_RETENTION_DAYS) || 90;
  if (!this.deleteAfter) {
    this.deleteAfter = new Date(this.uploadedAt.getTime() + retentionDays * 86400000);
  }
});

module.exports = mongoose.model('SiteImage', SiteImageSchema);
