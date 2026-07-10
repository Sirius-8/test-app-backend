const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL: expiresAt tarihine gelindiğinde dokümanı otomatik siler
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QRToken', qrTokenSchema);
