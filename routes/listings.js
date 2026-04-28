const express = require('express');
const router = express.Router();
const {
  getListings, getNearbyListings, getRecommended, getListing,
  createListing, updateListing, deleteListing,
  getMyListings, toggleStatus, deletePhoto, getPlatformStats
} = require('../controllers/listingController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');

router.get('/', getListings);
router.get('/stats/platform', getPlatformStats);
router.get('/nearby', getNearbyListings);
router.get('/recommended', optionalAuth, getRecommended);
router.get('/owner/my', protect, authorize('owner', 'admin'), getMyListings);
router.get('/:id', optionalAuth, getListing);
router.post('/', protect, authorize('owner', 'admin'), uploadPhotos, createListing);
router.put('/:id', protect, uploadPhotos, updateListing);
router.delete('/:id', protect, deleteListing);
router.patch('/:id/status', protect, authorize('owner', 'admin'), toggleStatus);
router.delete('/:id/photo', protect, deletePhoto);

module.exports = router;
