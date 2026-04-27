const express = require('express');
const router = express.Router();
const { getUser, updateProfile, updatePreferences, toggleFavorite, getFavorites } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

router.get('/favorites', protect, authorize('student'), getFavorites);
router.post('/favorites/:listingId', protect, authorize('student'), toggleFavorite);
router.put('/profile', protect, uploadDocument, updateProfile);
router.put('/preferences', protect, authorize('student'), updatePreferences);
router.get('/:id', getUser);

module.exports = router;
