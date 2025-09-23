const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
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

module.exports = mongoose.model('User', UserSchema);