const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortName: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'Sri Lanka' },
  emailDomains: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  logo: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

universitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('University', universitySchema);
