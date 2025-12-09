const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // VibeTribe interests (max 6 interests)
  vibeTribeInterests: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  vibeTribeSetupCompleted: {
    type: Boolean,
    default: false
  },
  interests: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  fullName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: { 
    type: String, 
    required: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  address: { 
    type: String, 
    default: '',
    maxlength: 200
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [73.0479, 33.6844] // Default to Islamabad coordinates
    },
    address: {
      type: String,
      default: ''
    }
  },
  onboardingPreferences: {
    interests: {
      neighborCommute: { type: Boolean, default: false },
      neighborworks: { type: Boolean, default: false },
      vibeTribe: { type: Boolean, default: false },
      communityPulse: { type: Boolean, default: false },
      impactFund: { type: Boolean, default: false }
    },
    contributions: {
      offerRide: { type: Boolean, default: false },
      volunteering: { type: Boolean, default: false },
      organizingMeetups: { type: Boolean, default: false },
      participating: { type: Boolean, default: false }
    },
    connectNearby: { type: Boolean, default: true }
  },
  profilePhoto: { 
    type: String, 
    default: '' 
  },
  rating: { 
    type: Number, 
    default: 4.5,
    min: 1,
    max: 5
  },
  completedRides: { 
    type: Number, 
    default: 0 
  },
  trustScore: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  roles: {
    serviceSeeker: { type: Boolean, default: true },
    serviceProvider: { type: Boolean, default: false }
  },
  serviceCategories: [{ 
    type: String 
  }],
  reviews: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
  availability: {
    type: String,
    default: 'Available'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ phoneNumber: 1 });
// Add geospatial index for location-based queries
UserSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);