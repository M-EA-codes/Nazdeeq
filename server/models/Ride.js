const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RideSchema = new Schema({
  driverId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  passengerIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  origin: { 
    name: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  destination: { 
    name: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  dateTime: { 
    type: Date, 
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Date must be in the future'
    }
  },
  seatsAvailable: { 
    type: Number, 
    required: true,
    min: [0, 'Seats cannot be negative'],
    max: [8, 'Maximum 8 seats allowed']
  },
  totalSeats: {
    type: Number,
    default: function() {
      return this.seatsAvailable;
    }
  },
  fare: { 
    type: Number, 
    required: true,
    min: [0, 'Fare cannot be negative'],
    default: 0
  },
  notes: { type: String, maxlength: 500 },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'completed', 'cancelled'], 
    default: 'open',
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
RideSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add compound indexes for better query performance
RideSchema.index({ status: 1, dateTime: 1 });
RideSchema.index({ 'origin.name': 1, 'destination.name': 1 });

module.exports = mongoose.model('Ride', RideSchema);