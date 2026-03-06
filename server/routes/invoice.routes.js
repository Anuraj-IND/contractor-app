const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  logPayment,
  generatePDF,
  getCustomerInvoices,
  generateCustomerInvoicePDF
} = require('../controllers/invoice.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/authorizeRole');

router.use(verifyToken, authorizeRole('admin'));

router.get('/', getInvoices);
router.get('/customers', getCustomerInvoices);
router.get('/customer/:id/pdf', generateCustomerInvoicePDF);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/payments', logPayment);
router.get('/:id/pdf', generatePDF);

module.exports = router;
