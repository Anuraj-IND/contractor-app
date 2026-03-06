const Attendance = require('../models/Attendance.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private (Admin & Laborer - own records, or all records for a specific date)
exports.getAttendance = async (req, res, next) => {
  try {
    const { projectId, laborerId, date, month, year } = req.query;
    let query = {};

    // If user is a laborer, they see only their own attendance UNLESS a specific date is requested
    if (req.user.role === 'laborer') {
      if (date) {
        // Laborers can see all attendance for a specific date in the calendar
        query.date = new Date(date);
      } else if (laborerId && laborerId.toString() === req.user._id.toString()) {
        query.laborerId = req.user._id;
      } else if (!laborerId) {
        query.laborerId = req.user._id;
      } else {
        return res.status(403).json({ success: false, message: 'You can only access your own attendance history.' });
      }
    } else if (laborerId) {
      // Admin can filter by laborerId
      query.laborerId = laborerId;
    }

    if (projectId) query.projectId = projectId;

    if (date) {
      query.date = new Date(date);
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('projectId', 'title customerId')
      .populate('laborerId', 'name defaultDailyWage')
      .sort({ date: -1 });

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark/update attendance (upsert)
// @route   POST /api/attendance
// @access  Private
exports.markAttendance = async (req, res, next) => {
  try {
    const { projectId, laborerId, date, present, wageForDay, advancePaidToday, note } = req.body;

    if (!projectId || !laborerId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID, Laborer ID, and Date are required' 
      });
    }

    // Security check: Laborer can only mark their own attendance
    if (req.user.role === 'laborer' && laborerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own attendance'
      });
    }

    // Get laborer's default wage if not provided
    const laborer = await User.findById(laborerId);
    if (!laborer) {
      return res.status(404).json({ success: false, message: 'Laborer not found' });
    }

    // Upsert attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { projectId, laborerId, date: new Date(date) },
      {
        projectId,
        laborerId,
        date: new Date(date),
        present: present !== undefined ? present : false,
        wageForDay: wageForDay !== undefined ? wageForDay : laborer.defaultDailyWage,
        advancePaidToday: advancePaidToday || 0,
        note
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Admin)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { present, wageForDay, advancePaidToday, note } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { present, wageForDay, advancePaidToday, note },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project attendance summary
// @route   GET /api/attendance/project/:projectId/summary
// @access  Private (Admin)
exports.getProjectSummary = async (req, res, next) => {
  try {
    const summary = await Attendance.aggregate([
      { 
        $match: { projectId: new (require('mongoose')).Types.ObjectId(req.params.projectId) } 
      },
      {
        $group: {
          _id: '$laborerId',
          totalDays: { $sum: { $cond: ['$present', 1, 0] } },
          totalEarned: { $sum: { $cond: ['$present', '$wageForDay', 0] } },
          totalPaid: { $sum: '$advancePaidToday' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'laborer'
        }
      },
      { $unwind: '$laborer' },
      {
        $project: {
          laborerId: '$_id',
          name: '$laborer.name',
          phone: '$laborer.phone',
          totalDays: 1,
          totalEarned: 1,
          totalPaid: 1,
          balance: { $subtract: ['$totalEarned', '$totalPaid'] }
        }
      }
    ]);

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
