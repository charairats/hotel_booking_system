const express = require('express');
const {
  getPromotions,
  getPromotionByCode,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require('../controllers/promotions');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getPromotions)
  .post(protect, authorize('admin'), createPromotion);

router.route('/:code').get(getPromotionByCode);

router
  .route('/manage/:id')
  .put(protect, authorize('admin'), updatePromotion)
  .delete(protect, authorize('admin'), deletePromotion);

module.exports = router;
