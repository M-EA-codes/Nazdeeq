const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  discussionId: { type: Schema.Types.ObjectId, ref: 'Discussion', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

CommentSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Comment', CommentSchema);

