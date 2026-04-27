const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const { password, ...userData } = user.toObject ? user.toObject() : user;

  res.status(statusCode).json({
    success: true,
    token,
    user: userData
  });
};

module.exports = { generateToken, sendTokenResponse };
