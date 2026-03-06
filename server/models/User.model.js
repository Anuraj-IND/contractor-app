const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'laborer'], default: 'laborer' },
  phone: { type: String },
  address: { type: String },
  defaultDailyWage: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  // Manual payment tracking overrides (for extra advances/loans)
  manualTotalPaid: { type: Number, default: null },
  manualLeftToPay: { type: Number, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
