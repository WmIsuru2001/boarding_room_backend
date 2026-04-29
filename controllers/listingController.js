const Listing = require('../models/Listing');
const StudentProfile = require('../models/StudentProfile');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// @desc    Get all listings (public, with filtering)
// @route   GET /api/listings
exports.getListings = async (req, res) => {
  try {
    const {
      page = 1, limit = 12,
      minPrice, maxPrice,
      roomType, facilities,
      status = 'available',
      sort = '-createdAt',
      search, university,
      gender
    } = req.query;

    const query = { isActive: true };
    if (status !== 'all') query.status = status;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (roomType) query.roomType = roomType;
    if (gender) {
      query['tenantPreferences.gender'] = gender;
    }
    if (facilities) {
      const facilityList = facilities.split(',');
      query.facilities = { $all: facilityList };
    }
    if (university) query.nearbyUniversity = university;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
      .populate('owner', 'name avatar verificationStatus')
      .populate('nearbyUniversity', 'name shortName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Listing.countDocuments(query);

    res.json({ success: true, listings, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get nearby listings (geospatial)
// @route   GET /api/listings/nearby
exports.getNearbyListings = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000, limit = 20 } = req.query;
    if (!lng || !lat) return res.status(400).json({ success: false, message: 'lng and lat required' });

    const listings = await Listing.find({
      status: 'available',
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance)
        }
      }
    })
      .populate('owner', 'name avatar verificationStatus')
      .populate('nearbyUniversity', 'name shortName')
      .limit(Number(limit));

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recommended listings for student
// @route   GET /api/listings/recommended
exports.getRecommended = async (req, res) => {
  try {
    let query = { status: 'available', isActive: true };

    if (req.user && req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile) {
        if (profile.budget?.max) query.price = { $lte: profile.budget.max };
        if (profile.roomPreferences?.length) query.facilities = { $in: profile.roomPreferences };
      }
    }

    const listings = await Listing.find(query)
      .populate('owner', 'name avatar verificationStatus')
      .populate('nearbyUniversity', 'name shortName')
      .sort('-averageRating -createdAt')
      .limit(10);

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner', 'name avatar verificationStatus phone createdAt')
      .populate('nearbyUniversity', 'name shortName city');

    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    // Increment view count
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Check if favorited
    let isFavorite = false;
    if (req.user && req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile) isFavorite = profile.favorites.some(id => id.toString() === listing._id.toString());
    }

    res.json({ success: true, listing, isFavorite });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create listing
// @route   POST /api/listings
exports.createListing = async (req, res) => {
  try {
    const {
      title, description, price, deposit, priceNegotiable,
      address, contactNumber, coordinates, roomType, facilities, rules,
      tenantPreferences, nearbyUniversity
    } = req.body;

    // Upload photos
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(f => uploadToCloudinary(f.buffer, 'listings'));
      photoUrls = await Promise.all(uploadPromises);
    }

    const coordsParsed = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;

    const listing = await Listing.create({
      owner: req.user._id,
      title, description,
      price: Number(price),
      deposit: Number(deposit || 0),
      priceNegotiable,
      photos: photoUrls,
      location: { type: 'Point', coordinates: [coordsParsed.lng, coordsParsed.lat] },
      address,
      contactNumber,
      roomType,
      facilities: typeof facilities === 'string' ? JSON.parse(facilities) : facilities,
      rules,
      tenantPreferences: typeof tenantPreferences === 'string' ? JSON.parse(tenantPreferences) : tenantPreferences,
      nearbyUniversity,
      status: 'pending' // requires admin approval
    });

    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
exports.updateListing = async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.body.coordinates) {
      const c = typeof req.body.coordinates === 'string' ? JSON.parse(req.body.coordinates) : req.body.coordinates;
      updates.location = { type: 'Point', coordinates: [c.lng, c.lat] };
      delete updates.coordinates;
    }
    if (req.body.facilities && typeof req.body.facilities === 'string') {
      updates.facilities = JSON.parse(req.body.facilities);
    }
    if (req.body.tenantPreferences && typeof req.body.tenantPreferences === 'string') {
      updates.tenantPreferences = JSON.parse(req.body.tenantPreferences);
    }

    // Handle new photos
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(f => uploadToCloudinary(f.buffer, 'listings'));
      const newPhotos = await Promise.all(uploadPromises);
      updates.photos = [...(listing.photos || []), ...newPhotos];
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    // Delete photos from cloudinary
    await Promise.all(listing.photos.map(url => deleteFromCloudinary(url)));
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get owner's listings
// @route   GET /api/listings/owner/my
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id })
      .populate('nearbyUniversity', 'name shortName')
      .sort('-createdAt');
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle listing status available/occupied
// @route   PATCH /api/listings/:id/status
exports.toggleStatus = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (listing.status === 'pending' || listing.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot change status of unapproved listing' });
    }
    listing.status = listing.status === 'available' ? 'occupied' : 'available';
    await listing.save();
    res.json({ success: true, status: listing.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a photo from listing
// @route   DELETE /api/listings/:id/photo
exports.deletePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await deleteFromCloudinary(photoUrl);
    listing.photos = listing.photos.filter(p => p !== photoUrl);
    await listing.save();
    res.json({ success: true, photos: listing.photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get platform stats for homepage
// @route   GET /api/listings/stats/platform
exports.getPlatformStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Review = require('../models/Review');
    
    const [activeStudents, verifiedListings, totalReviews, verifiedOwners] = await Promise.all([
      User.countDocuments({ role: 'student', isBanned: false }),
      Listing.countDocuments({ status: { $in: ['available', 'occupied'] }, isActive: true }),
      Review.countDocuments(),
      User.countDocuments({ role: 'owner', verificationStatus: 'verified', isBanned: false })
    ]);

    res.json({
      success: true,
      stats: {
        activeStudents,
        verifiedListings,
        totalReviews,
        verifiedOwners
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
