const mongoose = require('mongoose');

const locationShareSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [boylam, enlem]
        required: true,
      },
    },
    visibility: {
      type: String,
      enum: ['all', 'friends', 'none'],
      default: 'friends',
    },
  },
  {
    timestamps: true,
  }
);

// Konum bazlı aramalar için geospatial index
locationShareSchema.index({ coordinates: '2dsphere' });

// Canlı konumun örneğin 2 saat sonra silinmesi için (İsteğe bağlı TTL)
// locationShareSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('LocationShare', locationShareSchema);
