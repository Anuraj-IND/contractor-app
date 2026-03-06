const User = require('../models/User.model');
const Attendance = require('../models/Attendance.model');
const Project = require('../models/Project.model');

// @desc    Get all laborers
// @route   GET /api/laborers
// @access  Private (Admin)
exports.getLaborers = async (req, res, next) => {
  try {
    const laborers = await User.find({ role: 'laborer' }).sort({ createdAt: -1 });

    // Calculate totals for each laborer
    const laborersWithTotals = await Promise.all(
      laborers.map(async (laborer) => {
        const attendanceRecords = await Attendance.find({ laborerId: laborer._id, present: true });
        const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
        const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);
        
        // Use manual values if not null, otherwise use calculated values
        const totalPaid = laborer.manualTotalPaid !== null ? laborer.manualTotalPaid : calcTotalPaid;
        const leftToPay = laborer.manualLeftToPay !== null ? laborer.manualLeftToPay : (calcTotalEarned - calcTotalPaid);

        return {
          ...laborer.toObject(),
          totalEarned: calcTotalEarned,
          totalPaid,
          leftToPay
        };
      })
    );

    res.json({ success: true, laborers: laborersWithTotals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create laborer
// @route   POST /api/laborers
// @access  Private (Admin)
exports.createLaborer = async (req, res, next) => {
  try {
    const { name, email, password, phone, defaultDailyWage, address } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    const laborer = await User.create({
      name,
      email: email || undefined,
      password: password || 'fieldbook123', // Default password if none provided, though they won't have email to login
      role: 'laborer',
      phone,
      address,
      defaultDailyWage: defaultDailyWage || 0,
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      laborer: {
        id: laborer._id,
        name: laborer.name,
        email: laborer.email,
        phone: laborer.phone,
        defaultDailyWage: laborer.defaultDailyWage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get laborer by ID
// @route   GET /api/laborers/:id
// @access  Private (Admin & Laborer - own profile)
exports.getLaborer = async (req, res, next) => {
  try {
    // Laborers can only view their own profile
    const laborerId = req.user.role === 'laborer' ? req.user._id : req.params.id;
    
    const laborer = await User.findOne({ _id: laborerId, role: 'laborer' });

    if (!laborer) {
      return res.status(404).json({ success: false, message: 'Laborer not found' });
    }

    // Get attendance history
    const attendance = await Attendance.find({ laborerId })
      .populate('projectId', 'title customerId')
      .sort({ date: -1 })
      .limit(50);

    // Get project assignments
    const projects = await Project.find({ assignedLaborers: laborerId })
      .populate('customerId', 'name')
      .select('title status startDate completedDate');

    // Calculate totals
    const attendanceRecords = await Attendance.find({ laborerId, present: true });
    const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
    const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);

    // Use manual values if not null, otherwise use calculated values
    const totalPaid = laborer.manualTotalPaid !== null ? laborer.manualTotalPaid : calcTotalPaid;
    const leftToPay = laborer.manualLeftToPay !== null ? laborer.manualLeftToPay : (calcTotalEarned - calcTotalPaid);

    res.json({
      success: true,
      laborer: {
        ...laborer.toObject(),
        totalEarned: calcTotalEarned,
        totalPaid,
        leftToPay
      },
      attendance,
      projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update laborer
// @route   PUT /api/laborers/:id
// @access  Private (Admin)
exports.updateLaborer = async (req, res, next) => {
  try {
    const { password, totalPaid, leftToPay, ...updateData } = req.body;

    const laborer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'laborer' },
      {
        ...updateData,
        manualTotalPaid: totalPaid !== undefined ? totalPaid : undefined,
        manualLeftToPay: leftToPay !== undefined ? leftToPay : undefined
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!laborer) {
      return res.status(404).json({ success: false, message: 'Laborer not found' });
    }

    // Calculate totals from attendance records
    const attendanceRecords = await Attendance.find({ laborerId: req.params.id, present: true });
    const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
    const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);
    
    // Use manual values if provided, otherwise use calculated values
    const finalTotalPaid = totalPaid !== undefined ? totalPaid : calcTotalPaid;
    const finalLeftToPay = leftToPay !== undefined ? leftToPay : (calcTotalEarned - calcTotalPaid);

    res.json({ 
      success: true, 
      laborer: {
        ...laborer.toObject(),
        totalEarned: calcTotalEarned,
        totalPaid: finalTotalPaid,
        leftToPay: finalLeftToPay
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete laborer (hard delete)
// @route   DELETE /api/laborers/:id
// @access  Private (Admin)
exports.deleteLaborer = async (req, res, next) => {
  try {
    const laborer = await User.findById(req.params.id);

    if (!laborer) {
      return res.status(404).json({ success: false, message: 'Laborer not found' });
    }

    if (laborer.role !== 'laborer') {
      return res.status(400).json({ success: false, message: 'User is not a laborer' });
    }

    // Check balance before deletion
    let leftToPay = 0;
    if (laborer.manualLeftToPay !== null) {
      leftToPay = laborer.manualLeftToPay;
    } else {
      const attendanceRecords = await Attendance.find({ laborerId: laborer._id, present: true });
      const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
      const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);
      leftToPay = calcTotalEarned - calcTotalPaid;
    }

    if (leftToPay > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete laborer with an outstanding balance of ₹${leftToPay.toLocaleString()}. Please clear all payments first.` 
      });
    }

    // Hard delete the laborer
    await laborer.deleteOne();

    res.json({ success: true, message: 'Laborer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get laborer attendance history
// @route   GET /api/laborers/:id/attendance
// @access  Private (Admin)
exports.getAttendance = async (req, res, next) => {
  try {
    const { projectId, month, year } = req.query;
    let query = { laborerId: req.params.id };

    if (projectId) {
      query.projectId = projectId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('projectId', 'title customerId')
      .sort({ date: -1 });

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get laborer balance summary
// @route   GET /api/laborers/:id/balance
// @access  Private (Admin & Laborer - own balance)
exports.getBalance = async (req, res, next) => {
  try {
    const laborerId = req.user.role === 'laborer' ? req.user._id : req.params.id;
    const laborer = await User.findById(laborerId);

    if (!laborer) {
      return res.status(404).json({ success: false, message: 'Laborer not found' });
    }

    const attendanceRecords = await Attendance.find({ laborerId, present: true });
    
    const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
    const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);

    // Use manual values if not null, otherwise use calculated values
    const totalPaid = laborer.manualTotalPaid !== null ? laborer.manualTotalPaid : calcTotalPaid;
    const leftToPay = laborer.manualLeftToPay !== null ? laborer.manualLeftToPay : (calcTotalEarned - calcTotalPaid);

    res.json({ 
      success: true, 
      balance: {
        totalEarned: calcTotalEarned,
        totalPaid: totalPaid,
        balance: leftToPay
      }
    });
  } catch (error) {
    next(error);
  }
};
