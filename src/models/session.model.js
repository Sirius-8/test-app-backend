const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// TTL index: Süresi dolduğunda otomatik silinir
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hızlı sorgular için index
sessionSchema.index({ userId: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
