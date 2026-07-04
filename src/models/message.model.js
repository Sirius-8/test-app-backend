const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'location', 'contact'],
      default: 'text',
    },
    // Mesaj tipi metin ise:
    content: {
      type: String,
      trim: true,
    },
    // Mesaj tipi medya (resim, video) ise:
    mediaUrl: {
      type: String,
    },
    // Mesaj tipi konum ise:
    locationData: {
      latitude: Number,
      longitude: Number,
    },
    // Mesaj tipi rehber/kişi ise:
    contactData: {
      name: String,
      phoneNumber: String,
    },
    // Okunma durumu için:
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
