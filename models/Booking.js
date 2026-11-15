const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date'],
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please add a check-out date'],
  },
  numOfNights: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  promoCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'qr_code'],
    },
    paidAt: {
      type: Date,
    },
    transactionId: {
      type: String,
    },
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Validate and apply a promotion to this booking, updating promoCode, discount, and totalPrice.
 */
BookingSchema.methods.applyPromotion = function (promotion) {
  if (!promotion || !promotion.isActive) {
    throw new Error('Invalid or inactive promotion code');
  }

  if (promotion.validUntil && promotion.validUntil <= new Date()) {
    throw new Error('Promotion code has expired');
  }

  if (
    !['percentage', 'fixed'].includes(promotion.discountType) ||
    !Number.isFinite(promotion.discountValue) ||
    promotion.discountValue < 0 ||
    (promotion.discountType === 'percentage' && promotion.discountValue > 100)
  ) {
    throw new Error('Promotion discount is invalid');
  }

  const rawDiscount =
    promotion.discountType === 'percentage'
      ? (this.subTotal * promotion.discountValue) / 100
      : promotion.discountValue;

  const discount = Math.min(this.subTotal, Math.round(rawDiscount * 100) / 100);

  this.promoCode = promotion.code ? String(promotion.code).trim().toUpperCase() : undefined;
  this.discount = discount;
  this.totalPrice = Math.round((this.subTotal - discount) * 100) / 100;

  return this.totalPrice;
};

module.exports = mongoose.model('Booking', BookingSchema);
