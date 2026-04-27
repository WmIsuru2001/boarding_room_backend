const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['listing', 'user'], required: true },
  targetListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: {
    type: String,
    enum: ['fake_listing', 'inappropriate_content', 'spam', 'scam', 'harassment', 'other'],
    required: true
  },
  description: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  adminNote: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
