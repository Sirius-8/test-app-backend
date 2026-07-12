const mongoose = require('mongoose');

const locationShareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Her kullanıcının sadece 1 aktif konumu olur
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  visibility: {
    type: String,
    enum: ['everyone', 'friends', 'nobody'],
    default: 'everyone'
  },
  isMasked: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // TTL Index: 3600 saniye (1 saat) sonra bu doküman otomatik silinir
  }
}, {
  timestamps: true // updatedAt alanını mongoose otomatik de günceller
});

// Geospatial index for nearby queries
locationShareSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LocationShare', locationShareSchema);
