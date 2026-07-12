const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

notificationPreferenceSchema.index({ userId: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
