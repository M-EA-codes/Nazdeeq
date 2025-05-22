const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., plumber, chef, etc.
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  rating: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);