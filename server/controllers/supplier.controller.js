const Supplier = require('../models/Supplier.model');
const Material = require('../models/Material.model');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private (Admin)
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });

    // Calculate dynamic totals for each supplier
    const suppliersWithTotals = await Promise.all(
      suppliers.map(async (supplier) => {
        const materials = await Material.find({ supplierId: supplier._id });
        const calcTotalPurchased = materials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);
        
        // Ensure balance is totalPurchased - totalPaid
        const balance = calcTotalPurchased - (supplier.totalPaid || 0);

        return {
          ...supplier.toObject(),
          totalPurchased: calcTotalPurchased,
          balance: balance
        };
      })
    );

    res.json({ success: true, suppliers: suppliersWithTotals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin)
exports.createSupplier = async (req, res, next) => {
  try {
    const { phone, companyName } = req.body;
    let merged = false;
    let oldSupplierNames = [];

    // Create the new supplier first
    const supplier = await Supplier.create(req.body);

    if (phone) {
      // Check for existing suppliers with same phone (excluding the one we just created)
      const existingSuppliers = await Supplier.find({ 
        phone, 
        _id: { $ne: supplier._id } 
      });

      if (existingSuppliers.length > 0) {
        merged = true;
        let totalPaidFromOld = 0;
        let totalPurchasedFromOld = 0;
        let combinedPaymentHistory = [];

        for (const oldSupplier of existingSuppliers) {
          oldSupplierNames.push(oldSupplier.companyName);
          
          // Collect data
          totalPaidFromOld += (oldSupplier.totalPaid || 0);
          totalPurchasedFromOld += (oldSupplier.totalPurchased || 0);
          
          // Add a note to old payment history entries
          const historyWithNotes = oldSupplier.paymentHistory.map(h => ({
            ...h.toObject(),
            note: h.note ? `${h.note} (From ${oldSupplier.companyName})` : `From merged supplier: ${oldSupplier.companyName}`
          }));
          combinedPaymentHistory = [...combinedPaymentHistory, ...historyWithNotes];

          // Reassign materials to the new supplier ID
          await Material.updateMany(
            { supplierId: oldSupplier._id },
            { supplierId: supplier._id }
          );

          // Delete old supplier
          await oldSupplier.deleteOne();
        }

        // Update new supplier with merged data
        supplier.totalPaid += totalPaidFromOld;
        // totalPurchased will be recalculated from materials in getSuppliers, 
        // but let's update it here for immediate response
        const currentMaterials = await Material.find({ supplierId: supplier._id });
        supplier.totalPurchased = currentMaterials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);
        
        supplier.paymentHistory = [...supplier.paymentHistory, ...combinedPaymentHistory];
        supplier.balance = supplier.totalPurchased - supplier.totalPaid;
        
        await supplier.save();
      }
    }

    res.status(201).json({ 
      success: true, 
      supplier,
      merged,
      message: merged 
        ? `New supplier created and merged with existing records for phone ${phone} (${oldSupplierNames.join(', ')})` 
        : 'Supplier created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private (Admin)
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Get materials from this supplier
    const materials = await Material.find({ supplierId: req.params.id }).sort({ createdAt: -1 });

    // Calculate dynamic totals
    const calcTotalPurchased = materials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);
    const balance = calcTotalPurchased - (supplier.totalPaid || 0);

    res.json({ 
      success: true, 
      supplier: {
        ...supplier.toObject(),
        totalPurchased: calcTotalPurchased,
        balance: balance
      }, 
      materials 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin)
exports.updateSupplier = async (req, res, next) => {
  try {
    const { totalPurchased, totalPaid, ...updateData } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Get all materials to calculate grand total purchased
    const materials = await Material.find({ supplierId: req.params.id });
    const calcTotalPurchased = materials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);

    // Update fields
    Object.assign(supplier, updateData);
    
    // totalPurchased is derived from materials, but we store the calculated value
    supplier.totalPurchased = calcTotalPurchased;
    
    // manual update of totalPaid
    if (totalPaid !== undefined) {
      supplier.totalPaid = totalPaid;
    }
    
    // Recalculate balance: Grand Total Purchased - Manual Total Paid
    supplier.balance = supplier.totalPurchased - (supplier.totalPaid || 0);
    
    await supplier.save();

    res.json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (supplier.balance > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete supplier with outstanding balance' 
      });
    }

    await supplier.deleteOne();
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log payment to supplier
// @route   POST /api/suppliers/:id/payments
// @access  Private (Admin)
exports.logPayment = async (req, res, next) => {
  try {
    const { amount, date, note, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Add payment to history
    supplier.paymentHistory.push({
      amount,
      date: date || new Date(),
      note,
      method: method || 'Cash'
    });

    // Update totals
    supplier.totalPaid += amount;
    supplier.balance = supplier.totalPurchased - supplier.totalPaid;

    await supplier.save();

    res.json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};
