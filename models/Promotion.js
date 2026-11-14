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
    validate: {
      validator: function (value) {
        return this.discountType !== 'percentage' || value <= 100;
      },
      message: 'Percentage discount cannot be more than 100',
    },
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
