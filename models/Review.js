const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  aspects: {
    cleanliness: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    landlord: { type: Number, min: 1, max: 5 }
  },
  helpfulCount: { type: Number, default: 0 },
  isVerifiedTenant: { type: Boolean, default: false }
}, { timestamps: true });

reviewSchema.index({ listing: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
