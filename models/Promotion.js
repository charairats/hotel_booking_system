const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a promotion code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Please add discount value'],
    min: [0, 'Discount value must be at least 0'],
  },
  validUntil: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Promotion', PromotionSchema);
