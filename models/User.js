const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['student', 'owner', 'admin'], default: 'student' },
  phone: { type: String, default: '' },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  nicImage: { type: String, default: '' },
  utilityBillImage: { type: String, default: '' },
  studentIdFrontImage: { type: String, default: '' },
  studentIdBackImage: { type: String, default: '' },
  campusRegistrationNumber: { type: String, default: null },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create partial unique index - only applies when campusRegistrationNumber is not null
userSchema.index(
  { campusRegistrationNumber: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { campusRegistrationNumber: { $ne: null } }
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
