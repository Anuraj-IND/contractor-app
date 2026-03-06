const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  laborerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  present: { type: Boolean, default: false },
  wageForDay: { type: Number },
  advancePaidToday: { type: Number, default: 0 },
  note: { type: String }
}, { timestamps: true });

// Compound index to prevent duplicate entries for same project+laborer+date
AttendanceSchema.index({ projectId: 1, laborerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
