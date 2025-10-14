const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  name: { type: String, required: true },
  description: { type: String },
  dateTime: { type: Date, required: true },
  location: { type: Object, required: true },
  attendeeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);