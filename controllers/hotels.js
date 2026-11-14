const Hotel = require('../models/Hotel');

//@desc    Get all hotels
//@route   GET /api/v1/hotels
//@access  Public
exports.getHotels = async (req, res, next) => {
  try {
    // Copy req.query without options used for selecting, sorting and pagination
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Allow the same comparison operators as the reference hospital catalog
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/"(gt|gte|lt|lte|in)":/g, (match, operator) => `"$${operator}":`);
    const filter = JSON.parse(queryStr);

    Object.values(filter).forEach((value) => {
      if (value && typeof value === 'object' && typeof value.$in === 'string') {
        value.$in = value.$in.split(',').map((item) => item.trim());
      }
    });

    let query = Hotel.find(filter).populate('bookings');

    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 25 : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers',
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Hotel.countDocuments(filter);
    const hotels = await query.skip(startIndex).limit(limit);

    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0 && startIndex < total) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination,
      data: hotels,
    });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' ? 400 : 500;
    res.status(statusCode).json({ success: false, message: 'Cannot find hotels' });
  }
};

//@desc    Get single hotel
//@route   GET /api/v1/hotels/:id
//@access  Public
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('bookings');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' ? 400 : 500;
    res.status(statusCode).json({ success: false, message: 'Cannot find hotel' });
  }
};

//@desc    Create new hotel
//@route   POST /api/v1/hotels
//@access  Private/Admin
exports.createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'ValidationError' || err.code === 11000 ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Cannot create hotel' });
  }
};

//@desc    Update hotel
//@route   PUT /api/v1/hotels/:id
//@access  Private/Admin
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' || err.name === 'ValidationError' || err.code === 11000 ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Cannot update hotel' });
  }
};

//@desc    Delete hotel
//@route   DELETE /api/v1/hotels/:id
//@access  Private/Admin
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.id}`,
      });
    }

    // Document deletion runs Hotel's existing hook that removes its bookings
    await hotel.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    const statusCode = err.name === 'CastError' ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Cannot delete hotel' });
  }
};
