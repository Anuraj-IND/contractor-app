const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  title: { type: String, required: true },
  siteAddress: { type: String, required: true },
  city: { type: String },
  serviceType: [{ type: String, enum: ['Waterproofing', 'Heatproofing'] }],
  areaSqFt: { type: Number, required: true },
  ratePerSqFt: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  paidTillNow: { type: Number, default: 0 },
  amountReceivable: { type: Number },
  paymentHistory: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] }
  }],
  materials: [{
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    quantityUsed: { type: Number },
    note: { type: String }
  }],
  assignedLaborers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started'
  },
  startDate: { type: Date },
  expectedEndDate: { type: Date },
  completedDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

// Auto-calculate amountReceivable and set completedDate
ProjectSchema.pre('save', function() {
  const totalPaid = (this.paidTillNow || 0) + (this.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0);
  this.amountReceivable = this.totalCost - totalPaid;

  if (this.status === 'Completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
