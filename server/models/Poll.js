const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PollSchema = new Schema({
  question: { type: String, required: true },
  options: { type: Array, required: true }, // [{ optionId, text, votes }]
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  discussionId: { type: Schema.Types.ObjectId, ref: 'Discussion', required: true }
});

module.exports = mongoose.model('Poll', PollSchema);