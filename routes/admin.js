const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getPendingVerifications, reviewVerification,
  getUsers, banUser, getPendingListings, reviewListing,
  getReports, resolveReport
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/verifications', getPendingVerifications);
router.put('/verify/:userId', reviewVerification);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.get('/listings/pending', getPendingListings);
router.put('/listings/:id/review', reviewListing);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

module.exports = router;
