const Project = require('../models/Project.model');
const Supplier = require('../models/Supplier.model');
const Invoice = require('../models/Invoice.model');
const Attendance = require('../models/Attendance.model');
const SiteImage = require('../models/SiteImage.model');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
exports.getStats = async (req, res, next) => {
  try {
    const User = require('../models/User.model');

    // Active projects count
    const activeProjects = await Project.countDocuments({ 
      status: { $in: ['In Progress', 'Not Started', 'On Hold'] } 
    });

    // Total supplier due - recalculate based on our new logic
    const suppliers = await Supplier.find();
    const totalSupplierDue = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

    // Customer pending - recalculate based on projects normalization logic
    const allProjects = await Project.find();
    let totalCustomerPending = 0;
    let totalRevenueCollected = 0;

    allProjects.forEach(p => {
      const initialPaid = p.paidTillNow !== undefined ? p.paidTillNow : (p.advancePaid || 0);
      const historyPayments = p.paymentHistory?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
      const totalPaid = initialPaid + historyPayments;
      
      totalCustomerPending += (p.totalCost - totalPaid);
      totalRevenueCollected += totalPaid;
    });

    // Labor pending - from User model manual overrides or calculated attendance
    const laborers = await User.find({ role: 'laborer' });
    let totalLaborPending = 0;

    for (const laborer of laborers) {
      if (laborer.manualLeftToPay !== null) {
        totalLaborPending += laborer.manualLeftToPay;
      } else {
        const attendanceRecords = await Attendance.find({ laborerId: laborer._id, present: true });
        const calcTotalEarned = attendanceRecords.reduce((sum, record) => sum + (record.wageForDay || 0), 0);
        const calcTotalPaid = attendanceRecords.reduce((sum, record) => sum + (record.advancePaidToday || 0), 0);
        totalLaborPending += (calcTotalEarned - calcTotalPaid);
      }
    }

    res.json({
      success: true,
      stats: {
        activeProjects,
        totalSupplierDue,
        totalCustomerPending,
        totalLaborPending,
        totalRevenueCollected
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard alerts
// @route   GET /api/dashboard/alerts
// @access  Private (Admin)
exports.getAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const warningDays = parseInt(process.env.IMAGE_WARNING_DAYS) || 7;
    const warnCutoff = new Date(now.getTime() + warningDays * 86400000);

    // Image deletion warnings
    const imageDeletionWarnings = await SiteImage.find({
      deleteAfter: { $lte: warnCutoff },
      markedForDeletion: true
    })
      .populate('projectId', 'title')
      .populate('uploadedBy', 'name')
      .limit(10);

    // Overdue invoices
    const overdueInvoices = await Invoice.find({
      status: { $nin: ['Paid', 'Draft'] },
      dueDate: { $lt: now },
      balance: { $gt: 0 }
    })
      .populate('customerId', 'name')
      .populate('projectId', 'title')
      .sort({ dueDate: 1 })
      .limit(10);

    res.json({
      success: true,
      alerts: {
        imageDeletionWarnings,
        overdueInvoices
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent data for dashboard
// @route   GET /api/dashboard/recent
// @access  Private (Admin)
exports.getRecent = async (req, res, next) => {
  try {
    // Recent projects
    const recentProjects = await Project.find()
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('projectId', 'title')
      .populate('laborerId', 'name');

    res.json({
      success: true,
      recent: {
        recentProjects,
        todayAttendance
      }
    });
  } catch (error) {
    next(error);
  }
};
