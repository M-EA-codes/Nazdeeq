const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionSchema = new Schema({
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  sharedInterests: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  message: {
    type: String,
    maxlength: 200,
    trim: true
  },
  connectionStrength: {
    type: Number,
    default: 0,
    min: 0
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate connections
ConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

// Index for querying user's connections
ConnectionSchema.index({ requesterId: 1, status: 1 });
ConnectionSchema.index({ recipientId: 1, status: 1 });

// Update lastInteractionAt before saving
ConnectionSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isModified('connectionStrength')) {
    this.lastInteractionAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Connection', ConnectionSchema);

