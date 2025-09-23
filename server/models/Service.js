const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'cleaning', 'gardening', 'carpentry', 'painting', 'tutoring', 'delivery', 'other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  priceRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 }
  },
  fixedPrice: {
    type: Number,
    min: 0
  },
  availability: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  timeSlots: [{
    type: String
  }],
  location: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
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
ServiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better performance
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ providerId: 1 });
ServiceSchema.index({ location: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);