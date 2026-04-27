const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalStudents, totalOwners,
      totalListings, activeListings, pendingListings,
      pendingVerifications, pendingReports,
      recentUsers, recentListings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student', isBanned: false }),
      User.countDocuments({ role: 'owner', isBanned: false }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'available', isActive: true }),
      Listing.countDocuments({ status: 'pending' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
      Listing.find({ status: 'available' }).sort('-createdAt').limit(5).populate('owner', 'name').select('title price status createdAt')
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalStudents, totalOwners,
        totalListings, activeListings, pendingListings,
        pendingVerifications, pendingReports
      },
      recentUsers,
      recentListings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get pending verifications
// @route   GET /api/admin/verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: 'pending' })
      .populate('university', 'name')
      .sort('-updatedAt');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve/reject verification
// @route   PUT /api/admin/verify/:userId
exports.reviewVerification = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.verificationStatus = action === 'approve' ? 'verified' : 'rejected';
    if (adminNote) user.banReason = adminNote;
    await user.save();

    res.json({ success: true, message: `User ${action === 'approve' ? 'verified' : 'rejected'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isBanned } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(query)
      .populate('university', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Ban/unban user
// @route   PUT /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot ban admin' });

    user.isBanned = ban;
    user.banReason = ban ? (reason || 'Violation of terms') : '';
    await user.save();

    res.json({ success: true, message: `User ${ban ? 'banned' : 'unbanned'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get pending listings
// @route   GET /api/admin/listings/pending
exports.getPendingListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'pending' })
      .populate('owner', 'name email verificationStatus')
      .populate('nearbyUniversity', 'name')
      .sort('-createdAt');
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve/reject listing
// @route   PUT /api/admin/listings/:id/review
exports.reviewListing = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    listing.status = action === 'approve' ? 'available' : 'rejected';
    await listing.save();

    res.json({ success: true, message: `Listing ${action === 'approve' ? 'approved' : 'rejected'}`, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('targetListing', 'title photos')
      .populate('targetUser', 'name email')
      .sort('-createdAt');

    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Resolve report
// @route   PUT /api/admin/reports/:id
exports.resolveReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, resolvedBy: req.user._id, resolvedAt: Date.now() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
