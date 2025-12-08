const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiscussionSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  content: { type: String, required: true, maxlength: 5000 },
  category: { type: String, default: 'other' },
  tags: [{ type: String }],
  location: { type: String, default: '' },
  priority: { type: String, default: 'low' },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reports: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      created_at: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

DiscussionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Discussion', DiscussionSchema);

