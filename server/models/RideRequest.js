const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RideRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: Object, required: true },
  destination: { type: Object, required: true },
  dateTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'matched', 'completed', 'cancelled'], default: 'pending' },
  matchedRideId: { type: Schema.Types.ObjectId, ref: 'Ride' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RideRequest', RideRequestSchema);