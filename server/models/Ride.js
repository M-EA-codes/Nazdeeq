const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String
  },
  destination: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String
  },
  dateTime: {
    type: Date,
    required: true
  },
  seatsAvailable: {
    type: Number,
    required: true,
    min: 1
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  fare: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    maxLength: 500
  },
  vehicleInfo: {
    make: String,
    model: String,
    color: String,
    licensePlate: String
  },
  preferences: {
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    petsAllowed: {
      type: Boolean,
      default: false
    },
    musicAllowed: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['open', 'full', 'completed', 'cancelled'],
    default: 'open'
  },
  passengerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  route: {
    distance: String,
    duration: String,
    polyline: String
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
rideSchema.index({ driverId: 1, createdAt: -1 });
rideSchema.index({ status: 1, dateTime: 1 });
rideSchema.index({ 'origin.name': 1, 'destination.name': 1 });

// Add created_at virtual for compatibility
rideSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

module.exports = mongoose.model('Ride', rideSchema);