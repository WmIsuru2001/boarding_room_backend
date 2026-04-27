const Review = require('../models/Review');
const Listing = require('../models/Listing');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId })
      .populate('student', 'name avatar verificationStatus')
      .sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { rating, comment, aspects } = req.body;
    const existing = await Review.findOne({ listing: req.params.listingId, student: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const review = await Review.create({
      listing: req.params.listingId, student: req.user._id,
      rating, comment, aspects,
      isVerifiedTenant: req.user.verificationStatus === 'verified'
    });

    const reviews = await Review.find({ listing: req.params.listingId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Listing.findByIdAndUpdate(req.params.listingId, {
      averageRating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length
    });

    await review.populate('student', 'name avatar verificationStatus');
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Not found' });
    if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const listingId = review.listing;
    await review.deleteOne();
    const reviews = await Review.find({ listing: listingId });
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    await Listing.findByIdAndUpdate(listingId, {
      averageRating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length
    });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
