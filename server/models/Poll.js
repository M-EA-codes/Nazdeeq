const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PollOptionSchema = new Schema({
  optionId: { type: Number, required: true },
  text: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

const PollSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  question: { type: String, required: true, maxlength: 1000 },
  options: [PollOptionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'other' },
  isActive: { type: Boolean, default: true },
  endDate: { type: Date },
  allowMultipleVotes: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  totalVotes: { type: Number, default: 0 },
  location: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

PollSchema.pre('save', function (next) {
  this.updated_at = new Date();
  this.totalVotes = this.options.reduce((sum, opt) => sum + (opt.votes ? opt.votes.length : 0), 0);
  next();
});

module.exports = mongoose.model('Poll', PollSchema);

