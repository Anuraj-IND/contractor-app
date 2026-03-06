const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  type: { type: String, enum: ['Residential', 'Commercial', 'Industrial'] },
  address: { type: String },
  city: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
