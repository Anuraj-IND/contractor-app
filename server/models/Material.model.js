const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  name: { type: String, required: true },
  unit: { type: String },
  quantityPurchased: { type: Number, required: true },
  quantityAvailable: { type: Number },
  purchaseDate: { type: Date, required: true },
  pricePerUnit: { type: Number, required: true },
  totalCost: { type: Number },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number },
  paidCompletely: { type: Boolean, default: false },
  paidCompletelyDate: { type: Date }
}, { timestamps: true });

// Auto-calculate totalCost and balance before save
MaterialSchema.pre('save', function() {
  if (this.pricePerUnit && this.quantityPurchased) {
    this.totalCost = this.pricePerUnit * this.quantityPurchased;
  }
  if (this.totalCost !== undefined) {
    this.balance = this.totalCost - this.amountPaid;
  }
  if (this.balance === 0 && this.totalCost > 0) {
    this.paidCompletely = true;
    if (!this.paidCompletelyDate) {
      this.paidCompletelyDate = new Date();
    }
  }
});

module.exports = mongoose.model('Material', MaterialSchema);
