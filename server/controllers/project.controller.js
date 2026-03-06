const Project = require('../models/Project.model');
const Customer = require('../models/Customer.model');
const Material = require('../models/Material.model');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { status, customerId, search, laborerId } = req.query;
    let query = {};

    // If user is a laborer, they should only see their assigned projects
    if (req.user.role === 'laborer') {
      query.assignedLaborers = req.user._id;
    } else if (laborerId) {
      // If admin is filtering by laborer
      query.assignedLaborers = laborerId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (search) {
      const customers = await Customer.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const customerIds = customers.map(c => c._id);

      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { customerId: { $in: customerIds } }
      ];
    }

    const projects = await Project.find(query)
      .populate('customerId', 'name phone city')
      .populate('assignedLaborers', 'name phone defaultDailyWage')
      .sort({ createdAt: -1 });

    // Normalize financial fields for both old and new records
    const normalizedProjects = projects.map(project => {
      const projObj = project.toObject();
      
      // Fallback for old records and calculation of total paid
      const initialPaid = projObj.paidTillNow !== undefined ? projObj.paidTillNow : (projObj.advancePaid || 0);
      const historyPayments = projObj.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalPaid = initialPaid + historyPayments;
      
      // Always recalculate receivable to ensure accuracy
      const amountReceivable = projObj.totalCost - totalPaid;

      return {
        ...projObj,
        paidTillNow: initialPaid,
        amountReceivable
      };
    });

    res.json({ success: true, projects: normalizedProjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin)
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    
    const populatedProject = await Project.findById(project._id)
      .populate('customerId', 'name phone city');
    
    res.status(201).json({ success: true, project: populatedProject });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private (Admin)
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('customerId', 'name phone email address city')
      .populate('assignedLaborers', 'name phone defaultDailyWage')
      .populate('materials.materialId', 'name supplierId unit');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const projObj = project.toObject();
    const initialPaid = projObj.paidTillNow !== undefined ? projObj.paidTillNow : (projObj.advancePaid || 0);
    const historyPayments = projObj.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPaid = initialPaid + historyPayments;
    const amountReceivable = projObj.totalCost - totalPaid;

    res.json({ 
      success: true, 
      project: {
        ...projObj,
        paidTillNow: initialPaid,
        amountReceivable
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'name phone city');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const projObj = project.toObject();
    const initialPaid = projObj.paidTillNow !== undefined ? projObj.paidTillNow : (projObj.advancePaid || 0);
    const historyPayments = projObj.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPaid = initialPaid + historyPayments;
    const amountReceivable = projObj.totalCost - totalPaid;

    res.json({ 
      success: true, 
      project: {
        ...projObj,
        paidTillNow: initialPaid,
        amountReceivable
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check for outstanding balance before deletion
    const initialPaid = project.paidTillNow !== undefined ? project.paidTillNow : (project.advancePaid || 0);
    const historyPayments = project.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPaid = initialPaid + historyPayments;
    const amountReceivable = project.totalCost - totalPaid;

    if (amountReceivable > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete project with an outstanding balance of ₹${amountReceivable.toLocaleString()}. Please clear all payments first.` 
      });
    }

    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log customer payment for project
// @route   POST /api/projects/:id/payments
// @access  Private (Admin)
exports.logPayment = async (req, res, next) => {
  try {
    const { amount, date, note, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Add payment to history
    project.paymentHistory.push({
      amount,
      date: date || new Date(),
      note,
      method: method || 'Cash'
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('customerId', 'name phone city');

    res.json({ success: true, project: populatedProject });
  } catch (error) {
    next(error);
  }
};

// @desc    Add material to project
// @route   POST /api/projects/:id/materials
// @access  Private (Admin)
exports.addMaterial = async (req, res, next) => {
  try {
    const { materialId, quantityUsed, note } = req.body;

    if (!materialId || !quantityUsed) {
      return res.status(400).json({ success: false, message: 'Material ID and quantity are required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Add material to project
    project.materials.push({ materialId, quantityUsed, note });
    await project.save();

    // Reduce material's quantityAvailable
    await Material.findByIdAndUpdate(materialId, {
      $inc: { quantityAvailable: -quantityUsed }
    });

    const populatedProject = await Project.findById(project._id)
      .populate('materials.materialId', 'name supplierId unit');

    res.json({ success: true, project: populatedProject });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove material from project
// @route   DELETE /api/projects/:id/materials/:mid
// @access  Private (Admin)
exports.removeMaterial = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const materialEntry = project.materials.id(req.params.mid);
    if (!materialEntry) {
      return res.status(404).json({ success: false, message: 'Material not found in project' });
    }

    // Restore material's quantityAvailable
    await Material.findByIdAndUpdate(materialEntry.materialId, {
      $inc: { quantityAvailable: materialEntry.quantityUsed }
    });

    project.materials.pull(req.params.mid);
    await project.save();

    res.json({ success: true, message: 'Material removed from project' });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign laborer to project
// @route   POST /api/projects/:id/laborers
// @access  Private (Admin)
exports.assignLaborer = async (req, res, next) => {
  try {
    const { laborerId } = req.body;

    if (!laborerId) {
      return res.status(400).json({ success: false, message: 'Laborer ID is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.assignedLaborers.includes(laborerId)) {
      return res.status(400).json({ success: false, message: 'Laborer already assigned to this project' });
    }

    project.assignedLaborers.push(laborerId);
    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove laborer from project
// @route   DELETE /api/projects/:id/laborers/:lid
// @access  Private (Admin)
exports.removeLaborer = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.assignedLaborers.pull(req.params.lid);
    await project.save();

    res.json({ success: true, message: 'Laborer removed from project' });
  } catch (error) {
    next(error);
  }
};
