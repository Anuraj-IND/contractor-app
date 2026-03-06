const Customer = require('../models/Customer.model');
const Project = require('../models/Project.model');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin)
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    
    // Calculate project totals for each customer
    const customersWithTotals = await Promise.all(
      customers.map(async (customer) => {
        const projects = await Project.find({ customerId: customer._id });
        const totalProjects = projects.length;
        
        let totalProjectValue = 0;
        let totalPaid = 0;

        projects.forEach(p => {
          totalProjectValue += (p.totalCost || 0);
          // Match the logic in project controller: initial paid (paidTillNow or advancePaid) + paymentHistory
          const initialPaid = p.paidTillNow !== undefined ? p.paidTillNow : (p.advancePaid || 0);
          const historyPayments = p.paymentHistory?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
          totalPaid += (initialPaid + historyPayments);
        });

        const totalDue = totalProjectValue - totalPaid;
        
        return {
          ...customer.toObject(),
          totalProjects,
          totalProjectValue,
          totalPaid,
          totalDue
        };
      })
    );

    res.json({ success: true, customers: customersWithTotals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (Admin)
exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private (Admin)
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get projects for this customer
    const projects = await Project.find({ customerId: req.params.id }).sort({ createdAt: -1 });

    const normalizedProjects = projects.map(p => {
      const projObj = p.toObject();
      const initialPaid = projObj.paidTillNow !== undefined ? projObj.paidTillNow : (projObj.advancePaid || 0);
      const historyPayments = projObj.paymentHistory?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
      const totalPaid = initialPaid + historyPayments;
      const amountReceivable = projObj.totalCost - totalPaid;

      return {
        ...projObj,
        paidTillNow: initialPaid,
        amountReceivable
      };
    });

    res.json({ success: true, customer, projects: normalizedProjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin)
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get all projects for this customer to check balance and status
    const projects = await Project.find({ customerId: req.params.id });
    
    // Check for outstanding balance
    const totalProjectValue = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const totalPaid = projects.reduce((sum, p) => {
      const paymentsTotal = p.paymentHistory?.reduce((s, ph) => s + (ph.amount || 0), 0) || 0;
      return sum + (p.advancePaid || 0) + paymentsTotal;
    }, 0);
    const totalDue = totalProjectValue - totalPaid;

    if (totalDue > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete customer with an outstanding balance of ${totalDue}. Please clear all payments first.` 
      });
    }

    // Check if customer has active projects
    const activeProjects = projects.filter(p => 
      ['Not Started', 'In Progress', 'On Hold'].includes(p.status)
    ).length;

    if (activeProjects > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete customer with active projects' 
      });
    }

    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
