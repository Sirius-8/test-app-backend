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
  type: {
    type: String,
    enum: ['global', 'group_chat', 'private_chat'],
    default: 'global'
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

notificationPreferenceSchema.index({ userId: 1, channel: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
