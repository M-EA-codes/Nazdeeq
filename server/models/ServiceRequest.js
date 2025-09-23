const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceRequestSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedBudget: {
    type: Number,
    min: 0
  },
  agreedPrice: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  providerNotes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
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
ServiceRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better performance
ServiceRequestSchema.index({ providerId: 1 });
ServiceRequestSchema.index({ requesterId: 1 });
ServiceRequestSchema.index({ serviceId: 1 });
ServiceRequestSchema.index({ status: 1 });
ServiceRequestSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);