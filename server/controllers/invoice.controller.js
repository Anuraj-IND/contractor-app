const Invoice = require('../models/Invoice.model');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');
const PDFDocument = require('pdfkit');
const path = require('path');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin)
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, customerId, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('projectId', 'title')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Admin)
exports.createInvoice = async (req, res, next) => {
  try {
    const { projectId, customerId, lineItems, tax, dueDate, notes } = req.body;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      projectId,
      customerId,
      lineItems,
      tax: tax || 0,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('projectId', 'title')
      .populate('customerId', 'name phone email address');

    res.status(201).json({ success: true, invoice: populatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private (Admin)
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('projectId', 'title siteAddress')
      .populate('customerId', 'name phone email address');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private (Admin)
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'Draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only update draft invoices' 
      });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'title').populate('customerId', 'name phone');

    res.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'Draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only delete draft invoices' 
      });
    }

    await invoice.deleteOne();
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log payment for invoice
// @route   POST /api/invoices/:id/payments
// @access  Private (Admin)
exports.logPayment = async (req, res, next) => {
  try {
    const { amount, date, method, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.paymentHistory.push({
      amount,
      date: date || new Date(),
      method: method || 'Cash',
      note
    });

    invoice.amountPaid += amount;
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('projectId', 'title')
      .populate('customerId', 'name phone');

    res.json({ success: true, invoice: populatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private (Admin)
exports.generatePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('projectId', 'title')
      .populate('customerId', 'name phone email address');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('FIELDBOOK', { align: 'center' });
    doc.fontSize(12).text('Contractor Business Management', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Invoice details
    doc.fontSize(16).text(`INVOICE: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });
    }
    doc.moveDown(2);

    // Bill to
    doc.fontSize(14).text('BILL TO:', { underline: true });
    doc.fontSize(12).text(invoice.customerId.name);
    if (invoice.customerId.address) doc.text(invoice.customerId.address);
    if (invoice.customerId.phone) doc.text(`Phone: ${invoice.customerId.phone}`);
    doc.moveDown(2);

    // Project
    doc.fontSize(12).text(`Project: ${invoice.projectId.title}`, { bold: true });
    doc.moveDown();

    // Line items table
    const tableTop = doc.y;
    doc.fontSize(10).text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
    doc.text('Unit Price', 360, tableTop, { width: 80, align: 'right' });
    doc.text('Total', 460, tableTop, { width: 80, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let position = tableTop + 25;
    invoice.lineItems.forEach(item => {
      doc.text(item.description || 'N/A', 50, position, { width: 240 });
      doc.text(item.quantity?.toString() || '1', 300, position, { width: 50, align: 'right' });
      doc.text(`₹${(item.unitPrice || 0).toLocaleString()}`, 360, position, { width: 80, align: 'right' });
      doc.text(`₹${(item.total || 0).toLocaleString()}`, 460, position, { width: 80, align: 'right' });
      position += 20;
    });

    doc.moveTo(50, position).lineTo(550, position).stroke();
    position += 10;

    // Totals
    doc.text('Subtotal:', 360, position, { width: 80, align: 'right' });
    doc.text(`₹${(invoice.subtotal || 0).toLocaleString()}`, 460, position, { width: 80, align: 'right' });
    position += 20;

    if (invoice.tax > 0) {
      doc.text(`Tax (${invoice.tax}%):`, 360, position, { width: 80, align: 'right' });
      doc.text(`₹${((invoice.subtotal || 0) * (invoice.tax / 100)).toLocaleString()}`, 460, position, { width: 80, align: 'right' });
      position += 20;
    }

    doc.fontSize(12).text('Total:', 360, position, { width: 80, align: 'right', bold: true });
    doc.text(`₹${(invoice.totalAmount || 0).toLocaleString()}`, 460, position, { width: 80, align: 'right', bold: true });
    position += 30;

    // Payment summary
    doc.text(`Amount Paid: ₹${(invoice.amountPaid || 0).toLocaleString()}`, 360, position, { width: 80, align: 'right' });
    position += 20;
    doc.fontSize(14).text(`Balance Due: ₹${(invoice.balance || 0).toLocaleString()}`, 360, position, { width: 80, align: 'right', bold: true });

    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with their combined financial summary for invoicing
// @route   GET /api/invoices/customers
// @access  Private (Admin)
exports.getCustomerInvoices = async (req, res, next) => {
  try {
    const Customer = require('../models/Customer.model');
    const Project = require('../models/Project.model');
    
    const customers = await Customer.find().sort({ name: 1 });
    
    const summary = await Promise.all(customers.map(async (customer) => {
      const projects = await Project.find({ customerId: customer._id });
      
      let totalBilled = 0;
      let totalPaid = 0;

      projects.forEach(p => {
        totalBilled += (p.totalCost || 0);
        const initialPaid = p.paidTillNow !== undefined ? p.paidTillNow : (p.advancePaid || 0);
        const historyPayments = p.paymentHistory?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
        totalPaid += (initialPaid + historyPayments);
      });

      return {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        totalProjects: projects.length,
        totalBilled,
        totalPaid,
        amountReceivable: totalBilled - totalPaid
      };
    }));

    // Filter to show only customers who have projects AND an outstanding balance
    const filteredSummary = summary.filter(s => s.totalProjects > 0 && s.amountReceivable > 0);

    res.json({ success: true, customers: filteredSummary });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate customer-wise summary PDF
// @route   GET /api/invoices/customer/:id/pdf
// @access  Private (Admin)
exports.generateCustomerInvoicePDF = async (req, res, next) => {
  try {
    const Customer = require('../models/Customer.model');
    const Project = require('../models/Project.model');
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const projects = await Project.find({ customerId: customer._id });
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${customer.name.replace(/\s+/g, '_')}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('FIELDBOOK', { align: 'center' });
    doc.fontSize(12).text('Contractor Business Management', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Invoice Info
    doc.fontSize(16).text('OUTSTANDING STATEMENT', { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Bill to
    doc.fontSize(14).text('BILL TO:', { underline: true });
    doc.fontSize(12).text(customer.name);
    if (customer.address) doc.text(customer.address);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    doc.moveDown(2);

    // Projects Table Header
    doc.fontSize(12).text('Summary of Projects', { bold: true });
    doc.moveDown();
    
    const tableTop = doc.y;
    doc.fontSize(10).text('Project Title', 50, tableTop);
    doc.text('Total Cost', 250, tableTop, { width: 100, align: 'right' });
    doc.text('Paid', 350, tableTop, { width: 100, align: 'right' });
    doc.text('Balance', 450, tableTop, { width: 100, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let position = tableTop + 25;
    let grandTotalBilled = 0;
    let grandTotalPaid = 0;

    projects.forEach(p => {
      const initialPaid = p.paidTillNow !== undefined ? p.paidTillNow : (p.advancePaid || 0);
      const historyPayments = p.paymentHistory?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
      const totalPaid = initialPaid + historyPayments;
      const balance = (p.totalCost || 0) - totalPaid;

      grandTotalBilled += (p.totalCost || 0);
      grandTotalPaid += totalPaid;

      doc.text(p.title, 50, position, { width: 190 });
      doc.text(`₹${(p.totalCost || 0).toLocaleString()}`, 250, position, { width: 100, align: 'right' });
      doc.text(`₹${totalPaid.toLocaleString()}`, 350, position, { width: 100, align: 'right' });
      doc.text(`₹${balance.toLocaleString()}`, 450, position, { width: 100, align: 'right' });
      
      position += 20;
      
      // Add new page if needed
      if (position > 700) {
        doc.addPage();
        position = 50;
      }
    });

    doc.moveTo(50, position).lineTo(550, position).stroke();
    position += 10;

    // Grand Totals
    doc.fontSize(12).text('Grand Total:', 50, position, { bold: true });
    doc.text(`₹${grandTotalBilled.toLocaleString()}`, 250, position, { width: 100, align: 'right', bold: true });
    doc.text(`₹${grandTotalPaid.toLocaleString()}`, 350, position, { width: 100, align: 'right', bold: true });
    
    doc.fontSize(14);
    const finalReceivable = grandTotalBilled - grandTotalPaid;
    doc.text(`Total Receivable: ₹${finalReceivable.toLocaleString()}`, 350, position + 30, { width: 200, align: 'right', bold: true, color: '#E53E3E' });

    // Footer
    doc.fontSize(10).text('Please clear the outstanding balance at your earliest convenience.', 50, 700, { align: 'center', color: 'gray' });
    doc.text('Thank you for your business!', 50, 715, { align: 'center', color: 'gray' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
