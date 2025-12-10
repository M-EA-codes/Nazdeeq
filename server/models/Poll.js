const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  optionId: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  category: {
    type: String,
    enum: ['infrastructure', 'safety', 'environment', 'community', 'government', 'other'],
    default: 'other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  options: [pollOptionSchema],
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  endDate: {
    type: Date
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add virtual for backward compatibility
pollSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

// Ensure virtuals are included when converting to JSON
pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

// Update totalVotes before saving
pollSchema.pre('save', function(next) {
  this.totalVotes = this.options.reduce((total, option) => total + option.votes.length, 0);
  next();
});

module.exports = mongoose.model('Poll', pollSchema);