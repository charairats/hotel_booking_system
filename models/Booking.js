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

module.exports = mongoose.model('Booking', BookingSchema);
