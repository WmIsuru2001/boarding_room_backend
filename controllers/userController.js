const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('university').select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, university } = req.body;
    const updates = { name, phone };
    if (university) updates.university = university;
    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { budget, preferredDistance, roomPreferences, genderPreference, university, yearOfStudy, bio } = req.body;
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { budget, preferredDistance, roomPreferences, genderPreference, university, yearOfStudy, bio },
      { new: true, upsert: true }
    );
    res.json({ success: true, profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    const listingId = req.params.listingId;
    const isFav = profile.favorites.some(id => id.toString() === listingId);
    if (isFav) {
      profile.favorites = profile.favorites.filter(id => id.toString() !== listingId);
    } else {
      profile.favorites.push(listingId);
    }
    await profile.save();
    const Listing = require('../models/Listing');
    await Listing.findByIdAndUpdate(listingId, { $inc: { favoriteCount: isFav ? -1 : 1 } });
    res.json({ success: true, isFavorite: !isFav, favorites: profile.favorites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getFavorites = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate({
      path: 'favorites',
      populate: { path: 'owner', select: 'name avatar verificationStatus' }
    });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, favorites: profile.favorites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
