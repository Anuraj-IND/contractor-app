const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  lineItems: [{
    description: { type: String },
    quantity: { type: Number },
    unitPrice: { type: Number },
    total: { type: Number }
  }],
  subtotal: { type: Number },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number },
  paymentHistory: [{
    amount: { type: Number },
    date: { type: Date },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] },
    note: { type: String }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue'],
    default: 'Draft'
  },
  notes: { type: String }
}, { timestamps: true });

// Auto-calculate totals and update status
InvoiceSchema.pre('save', function() {
  // Calculate subtotal from line items
  if (this.lineItems && this.lineItems.length > 0) {
    this.subtotal = this.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  // Calculate total amount
  this.totalAmount = (this.subtotal || 0) + (this.tax || 0);

  // Calculate balance
  this.balance = (this.totalAmount || 0) - (this.amountPaid || 0);

  // Update status based on payment
  if (this.amountPaid === 0) {
    this.status = this.status === 'Sent' ? 'Sent' : 'Draft';
  } else if (this.balance === 0) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0 && this.balance > 0) {
    this.status = 'Partial';
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
