const cron = require('node-cron');
const cloudinary = require('../config/cloudinary');
const SiteImage = require('../models/SiteImage.model');

const startImageCron = () => {
  // Runs every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running image lifecycle check...');

    const now = new Date();
    const warningDays = parseInt(process.env.IMAGE_WARNING_DAYS) || 7;
    const warnCutoff = new Date(now.getTime() + warningDays * 86400000);

    try {
      // Step 1: Flag images within warning window
      const warned = await SiteImage.updateMany(
        {
          deleteAfter: { $lte: warnCutoff, $gt: now },
          deletionWarningShown: false
        },
        { $set: { deletionWarningShown: true, markedForDeletion: true } }
      );
      console.log(`[CRON] Flagged ${warned.modifiedCount} images for deletion warning`);

      // Step 2: Hard delete images past deleteAfter date
      const toDelete = await SiteImage.find({ deleteAfter: { $lte: now } });
      let deleted = 0;
      for (const img of toDelete) {
        try {
          await cloudinary.uploader.destroy(img.publicId);
          await img.deleteOne();
          deleted++;
        } catch (err) {
          console.error(`[CRON] Error deleting image ${img._id}:`, err.message);
        }
      }
      console.log(`[CRON] Deleted ${deleted} expired images`);

    } catch (err) {
      console.error('[CRON] Image lifecycle error:', err.message);
    }
  });

  console.log('[CRON] Image lifecycle job scheduled');
};

module.exports = startImageCron;
