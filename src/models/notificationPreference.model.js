const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in_app'],
      default: 'push',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Gerekirse "mentions", "friend_requests" gibi spesifik ayarlar da eklenebilir
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcının bir kanal için tek bir ayarı olur
notificationPreferenceSchema.index({ userId: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
