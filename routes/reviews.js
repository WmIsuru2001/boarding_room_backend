const express = require('express');
const router = express.Router();
const { getReviews, createReview, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:listingId', getReviews);
router.post('/:listingId', protect, authorize('student'), createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
