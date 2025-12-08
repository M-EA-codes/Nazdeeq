const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PollSchema = new Schema({
  title: { type: String, required: true },
  question: { type: String, required: true },
  options: [{
    optionId: { type: Number, required: true },
    text: { type: String, required: true },
    votes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discussionId: { type: Schema.Types.ObjectId, ref: 'Discussion' },
  category: { 
    type: String, 
    enum: ['infrastructure', 'safety', 'environment', 'community', 'government', 'other'],
    default: 'other'
  },
  isActive: { type: Boolean, default: true },
  endDate: { type: Date },
  allowMultipleVotes: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  totalVotes: { type: Number, default: 0 },
  location: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Calculate total votes
PollSchema.pre('save', function(next) {
  this.totalVotes = this.options.reduce((total, option) => total + option.votes.length, 0);
  next();
});

module.exports = mongoose.model('Poll', PollSchema);
