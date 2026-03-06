const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  paymentHistory: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] }
  }],
  totalPurchased: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Cleared', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Update status when balance changes
SupplierSchema.pre('save', function() {
  if (this.balance === 0 && this.totalPurchased > 0) {
    this.status = 'Cleared';
  } else if (this.balance > 0) {
    this.status = 'Active';
  }
});

module.exports = mongoose.model('Supplier', SupplierSchema);
