const Promotion = require('../models/Promotion');

//@desc    Get active promotions
//@route   GET /api/v1/promotions
//@access  Public
exports.getPromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find({
      isActive: true,
      validUntil: { $gt: new Date() },
    });
    res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot find promotions' });
  }
};

//@desc    Get a valid promotion by code
//@route   GET /api/v1/promotions/:code
//@access  Public
exports.getPromotionByCode = async (req, res, next) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const promotion = await Promotion.findOne({ code, isActive: true });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: `No active promotion with code ${code}`,
      });
    }

    if (promotion.validUntil && promotion.validUntil <= new Date()) {
      return res.status(400).json({
        success: false,
        message: `Promotion code ${code} has expired`,
      });
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot find promotion' });
  }
};

//@desc    Create a promotion
//@route   POST /api/v1/promotions
//@access  Private/Admin
exports.createPromotion = async (req, res, next) => {
  try {
    const discountType = req.body.discountType || 'percentage';
    if (discountType === 'percentage' && req.body.discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot be more than 100',
      });
    }

    if (req.body.validUntil) {
      if (new Date(req.body.validUntil) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Promotion expiry must be in the future',
        });
      }
    } else {
      // Default expiry: 30 days from now
      req.body.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const promotion = await Promotion.create(req.body);
    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

//@desc    Update a promotion
//@route   PUT /api/v1/promotions/manage/:id
//@access  Private/Admin
exports.updatePromotion = async (req, res, next) => {
  try {
    const currentPromotion = await Promotion.findById(req.params.id);

    if (!currentPromotion) {
      return res.status(404).json({
        success: false,
        message: `No promotion with the id of ${req.params.id}`,
      });
    }

    const discountType = req.body.discountType || currentPromotion.discountType;
    const discountValue =
      req.body.discountValue !== undefined
        ? req.body.discountValue
        : currentPromotion.discountValue;

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot be more than 100',
      });
    }

    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: promotion });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

//@desc    Delete a promotion
//@route   DELETE /api/v1/promotions/manage/:id
//@access  Private/Admin
exports.deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: `No promotion with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Cannot delete promotion' });
  }
};
