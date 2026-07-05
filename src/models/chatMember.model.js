const mongoose = require('mongoose');

const chatMemberSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    muted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcı bir grupta sadece bir kere bulunabilir
chatMemberSchema.index({ chatId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ChatMember', chatMemberSchema);
