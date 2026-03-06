const Invoice = require('../models/Invoice.model');

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  const year = new Date().getFullYear();
  const nextNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[2]) + 1 : 1;
  return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
};

module.exports = generateInvoiceNumber;
