const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, uploadVerification, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/verify', protect, uploadDocument, uploadVerification);
router.put('/password', protect, updatePassword);

module.exports = router;
