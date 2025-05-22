const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  avatarUrl: { type: String },
  location: { type: Object }, // { lat: Number, lng: Number }
  trustScore: { type: Number, default: 0 },
  roles: [{ type: String }],
  interests: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);