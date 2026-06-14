const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { sendTokenResponse } = require('../utils/token');
const { OAuth2Client } = require('google-auth-library');
const { uploadToCloudinary } = require('../utils/cloudinary');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, campusRegistrationNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Validate campusRegistrationNumber uniqueness
    if (campusRegistrationNumber && campusRegistrationNumber.trim()) {
      const existingRegistration = await User.findOne({ campusRegistrationNumber: campusRegistrationNumber.trim() });
      if (existingRegistration) {
        return res.status(400).json({ success: false, message: 'This registration number is already in use' });
      }
    }

    let studentIdFrontImage = '';
    let studentIdBackImage = '';

    if (req.files) {
      if (req.files.studentIdFront) {
        studentIdFrontImage = await uploadToCloudinary(req.files.studentIdFront[0].buffer, 'verification');
      }
      if (req.files.studentIdBack) {
        studentIdBackImage = await uploadToCloudinary(req.files.studentIdBack[0].buffer, 'verification');
      }
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'student',
      campusRegistrationNumber: campusRegistrationNumber?.trim() || '',
      studentIdFrontImage,
      studentIdBackImage
    });

    // Create student profile if role is student
    if (user.role === 'student') {
      await StudentProfile.create({ user: user._id });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, role } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture, role: role || 'student' });
      if (user.role === 'student') await StudentProfile.create({ user: user._id });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended.' });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('university');
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id }).populate('university favorites');
    }
    res.json({ success: true, user, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload verification document
// @route   POST /api/auth/verify
exports.uploadVerification = async (req, res) => {
  try {
    if (!req.files || !req.files.nic || !req.files.bill) {
      return res.status(400).json({ success: false, message: 'Please upload both NIC and Utility Bill' });
    }

    const [nicUrl, billUrl] = await Promise.all([
      uploadToCloudinary(req.files.nic[0].buffer, 'verification'),
      uploadToCloudinary(req.files.bill[0].buffer, 'verification')
    ]);

    req.user.nicImage = nicUrl;
    req.user.utilityBillImage = billUrl;
    req.user.verificationStatus = 'pending';
    await req.user.save();

    res.json({ success: true, message: 'Documents uploaded. Awaiting admin review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { currentPassword, newPassword } = req.body;
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
