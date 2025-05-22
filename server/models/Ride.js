const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RideSchema = new Schema({
  driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  passengerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  origin: { type: Object, required: true },
  destination: { type: Object, required: true },
  dateTime: { type: Date, required: true },
  seatsAvailable: { type: Number, required: true },
  fare: { type: Number, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', RideSchema);