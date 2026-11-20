const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Promotion = require('../models/Promotion');

//@desc    Get all bookings
//@route   GET /api/v1/bookings
//@route   GET /api/v1/hotels/:hotelId/bookings
//@access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query;

    // If general user, can only view own bookings
    if (req.user.role !== 'admin') {
      query = Booking.find({ user: req.user.id }).populate({
        path: 'hotel',
        select: 'name address tel pricePerNight',
      });
    } else {
      // If admin, can view all or hotel-specific
      if (req.params.hotelId) {
        query = Booking.find({ hotel: req.params.hotelId }).populate({
          path: 'hotel',
          select: 'name address tel pricePerNight',
        });
      } else {
        query = Booking.find().populate({
          path: 'hotel',
          select: 'name address tel pricePerNight',
        });
      }
    }

    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot find Booking' });
  }
};

//@desc    Get single booking
//@route   GET /api/v1/bookings/:id
//@access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'hotel',
      select: 'name address tel pricePerNight',
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this booking`,
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot find Booking' });
  }
};

//@desc    Add booking
//@route   POST /api/v1/hotels/:hotelId/bookings
//@route   POST /api/v1/bookings
//@access  Private
exports.addBooking = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId || req.body.hotel;
    req.body.hotel = hotelId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${hotelId}`,
      });
    }
    const hotelPrice = hotel.pricePerNight || 1000;

    // Add user to req.body
    req.body.user = req.user.id;

    const { checkInDate, checkOutDate } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both checkInDate and checkOutDate',
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out date format',
      });
    }

    // Condition 1: checkOutDate must be after checkInDate
    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date',
      });
    }

    // Calculate number of nights
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const numOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Condition 2: Max 30 nights constraint
    if (numOfNights > 30) {
      return res.status(400).json({
        success: false,
        message: `Cannot book more than 30 nights. Requested: ${numOfNights} nights`,
      });
    }

    // Calculate price and apply promotion code if provided
    const subTotal = numOfNights * hotelPrice;
    let promoCode;
    let discount = 0;

    if (req.body.promoCode) {
      promoCode = req.body.promoCode.trim().toUpperCase();
      const promotion = await Promotion.findOne({ code: promoCode });

      if (!promotion || !promotion.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive promotion code',
        });
      }

      if (promotion.validUntil && promotion.validUntil <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Promotion code has expired',
        });
      }

      if (promotion.discountType === 'percentage') {
        discount = (subTotal * promotion.discountValue) / 100;
      } else {
        discount = promotion.discountValue;
      }

      // Discount cannot exceed subTotal
      if (discount > subTotal) {
        discount = subTotal;
      }
      discount = Math.round(discount * 100) / 100;
    }

    const totalPrice = Math.round((subTotal - discount) * 100) / 100;

    const booking = await Booking.create({
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numOfNights,
      user: req.user.id,
      hotel: hotelId,
      subTotal,
      promoCode,
      discount,
      totalPrice,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Cannot create Booking',
    });
  }
};

//@desc    Update booking
//@route   PUT /api/v1/bookings/:id
//@access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    // If dates changed, recalculate
    let checkIn = req.body.checkInDate ? new Date(req.body.checkInDate) : booking.checkInDate;
    let checkOut = req.body.checkOutDate ? new Date(req.body.checkOutDate) : booking.checkOutDate;

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date',
      });
    }

    const diffTime = checkOut.getTime() - checkIn.getTime();
    const numOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (numOfNights > 30) {
      return res.status(400).json({
        success: false,
        message: `Cannot book more than 30 nights. Requested: ${numOfNights} nights`,
      });
    }

    const hotel = await Hotel.findById(booking.hotel);
    const hotelPrice = hotel ? hotel.pricePerNight : 1000;

    const subTotal = Math.round(numOfNights * hotelPrice * 100) / 100;
    const discount = Math.min(subTotal, booking.discount || 0);

    req.body.numOfNights = numOfNights;
    req.body.subTotal = subTotal;
    req.body.promoCode = booking.promoCode;
    req.body.discount = discount;
    req.body.totalPrice = Math.round((subTotal - discount) * 100) / 100;

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot update Booking' });
  }
};

//@desc    Cancel booking
//@route   DELETE /api/v1/bookings/:id
//@access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cannot delete Booking' });
  }
};

//@desc    Pay for booking and earn loyalty points
//@route   POST /api/v1/bookings/:id/pay
//@access  Private
exports.payBooking = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const validMethods = ['credit_card', 'debit_card', 'qr_code'];

    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid paymentMethod (${validMethods.join(', ')})`,
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to pay for this booking`,
      });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid',
      });
    }

    // Calculate points: 1 point per 100 THB spent
    const pointsEarned = Math.floor(booking.totalPrice / 100);

    booking.status = 'paid';
    booking.payment = {
      method: paymentMethod,
      paidAt: new Date(),
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    booking.pointsEarned = pointsEarned;
    await booking.save();

    // Increment user points
    const user = await User.findByIdAndUpdate(
      booking.user,
      { $inc: { points: pointsEarned } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        bookingId: booking._id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        payment: booking.payment,
        pointsEarned,
        userAccumulatedPoints: user ? user.points : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Payment processing failed',
    });
  }
};
