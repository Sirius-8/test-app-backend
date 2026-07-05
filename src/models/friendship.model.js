const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt
  }
);

// Aynı iki kişi arasında sadece bir adet arkadaşlık ilişkisi olabilir
friendshipSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);
