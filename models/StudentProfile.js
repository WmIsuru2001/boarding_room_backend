const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  budget: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 50000 }
  },
  preferredDistance: { type: Number, default: 5 }, // km
  roomPreferences: [{
    type: String,
    enum: ['quiet', 'single', 'shared', 'private_bathroom', 'ac', 'wifi', 'kitchen', 'furnished']
  }],
  genderPreference: { type: String, enum: ['any', 'boys_only', 'girls_only'], default: 'any' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  yearOfStudy: { type: Number },
  bio: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
