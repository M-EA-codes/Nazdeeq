const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiscussionSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['infrastructure', 'safety', 'environment', 'community', 'government', 'other'],
    default: 'other'
  },
  tags: [String],
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  viewCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isResolved: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReports: [{
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    reportedAt: { type: Date, default: Date.now }
  }],
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
  sentiment: { type: Number, min: -1, max: 1, default: 0 },
  location: {
    type: String,
    default: ''
  },
  attachments: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update commentCount when comments are added/removed
DiscussionSchema.virtual('totalVotes').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Discussion', DiscussionSchema);