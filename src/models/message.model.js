const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'location', 'contact'],
      default: 'text',
    },
    deletedAt: {
      type: Date, // Eğer mesaj silinirse soft-delete için (Audit log)
      default: null,
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt otomatik
  }
);

// Sonsuz liste (Cursor pagination) sorgularını hızlandırmak için birleşik index
messageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
