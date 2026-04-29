const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  deposit: { type: Number, default: 0 },
  priceNegotiable: { type: Boolean, default: false },
  photos: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  address: { type: String, required: true },
  contactNumber: { type: String },
  nearbyUniversity: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  distanceFromUni: { type: Number }, // meters
  roomType: { type: String, enum: ['single', 'shared', 'full house'], default: 'single' },
  facilities: [{
    type: String,
    enum: ['kitchen', 'bathroom', 'parking', 'laundry', 'security', 'furnished', 'water', 'electricity', 'tv']
  }],
  rules: { type: String, default: '' },
  tenantPreferences: {
    gender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    type: { type: String, enum: ['any', 'undergraduates', 'graduates', 'professionals'], default: 'any' },
    noPets: { type: Boolean, default: false },
    noSmoking: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['available', 'occupied', 'pending', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  weeklyViews: [{ date: Date, count: Number }],
  weeklyFavorites: [{ date: Date, count: Number }]
}, { timestamps: true });

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ price: 1 });
listingSchema.index({ averageRating: -1 });
listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
