const Promotion = require('../models/Promotion');

//@desc    Get active promotions
//@route   GET /api/v1/promotions
//@access  Public
exports.getPromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find({
      isActive: true,
      $or: [{ validUntil: { $gt: new Date() } }, { validUntil: null }],
    });
    res.status(200).json({ success: true, count: promotions.length, data: promotions });
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
      return res.status(404).json({ success: false, message: `No active promotion with code ${code}` });
    }

    if (promotion.validUntil && promotion.validUntil <= new Date()) {
      return res.status(400).json({ success: false, message: `Promotion code ${code} has expired` });
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
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Please provide promotion details' });
    }

    if (req.body.validUntil !== undefined && new Date(req.body.validUntil) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Promotion expiry must be in the future' });
    }

    const promotion = await Promotion.create(req.body);
    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000 ? 400 : 500;
    res.status(statusCode).json({ success: false, message: statusCode === 400 ? err.message : 'Cannot create promotion' });
  }
};

//@desc    Update a promotion
//@route   PUT /api/v1/promotions/manage/:id
//@access  Private/Admin
exports.updatePromotion = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Please provide promotion details' });
    }

    const currentPromotion = await Promotion.findById(req.params.id);

    if (!currentPromotion) {
      return res.status(404).json({ success: false, message: `No promotion with the id of ${req.params.id}` });
    }

    const discountType = req.body.discountType ?? currentPromotion.discountType;
    const discountValue = req.body.discountValue ?? currentPromotion.discountValue;

    if (discountType === 'percentage' && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot be more than 100' });
    }

    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!promotion) {
      return res.status(404).json({ success: false, message: `No promotion with the id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' || err.name === 'ValidationError' || err.code === 11000 ? 400 : 500;
    res.status(statusCode).json({ success: false, message: statusCode === 400 ? err.message : 'Cannot update promotion' });
  }
};

//@desc    Delete a promotion
//@route   DELETE /api/v1/promotions/manage/:id
//@access  Private/Admin
exports.deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: `No promotion with the id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' ? 400 : 500;
    res.status(statusCode).json({ success: false, message: statusCode === 400 ? 'Invalid promotion ID' : 'Cannot delete promotion' });
  }
};
