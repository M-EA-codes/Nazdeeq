const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  profilePhoto: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationDocs: [{ url: String, uploadedAt: Date }],
  roles: {
    serviceSeeker: { type: Boolean, default: false },
    serviceProvider: { type: Boolean, default: false }
  },
  serviceCategories: [{ type: String }], // e.g., plumber, chef, etc.
  rating: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);