const Material = require('../models/Material.model');
const Supplier = require('../models/Supplier.model');

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private (Admin)
exports.getMaterials = async (req, res, next) => {
  try {
    const { supplierId } = req.query;
    let query = {};

    if (supplierId) {
      query.supplierId = supplierId;
    }

    const materials = await Material.find(query).populate('supplierId', 'companyName').sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
};

// @desc    Create material
// @route   POST /api/materials
// @access  Private (Admin)
exports.createMaterial = async (req, res, next) => {
  try {
    const { supplierId, name, unit, quantityPurchased, pricePerUnit, purchaseDate } = req.body;

    const material = await Material.create({
      supplierId,
      name,
      unit,
      quantityPurchased,
      quantityAvailable: quantityPurchased,
      pricePerUnit,
      purchaseDate: purchaseDate || new Date()
    });

    // Update supplier's totalPurchased
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: { totalPurchased: material.totalCost }
    });

    res.status(201).json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

// @desc    Get material by ID
// @route   GET /api/materials/:id
// @access  Private (Admin)
exports.getMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('supplierId');
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    res.json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private (Admin)
exports.updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    res.json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private (Admin)
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Reverse the supplier's totalPurchased
    await Supplier.findByIdAndUpdate(material.supplierId, {
      $inc: { totalPurchased: -material.totalCost }
    });

    await material.deleteOne();
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log payment for material
// @route   POST /api/materials/:id/pay
// @access  Private (Admin)
exports.logPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    material.amountPaid += amount;
    await material.save();

    res.json({ success: true, material });
  } catch (error) {
    next(error);
  }
};
