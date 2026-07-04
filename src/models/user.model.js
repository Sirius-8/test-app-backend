const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen bir ad girin'],
    },
    surname: {
      type: String,
      required: [true, 'Lütfen bir soyad girin'],
    },
    username: {
      type: String,
      required: [true, 'Lütfen bir kullanıcı adı girin'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Lütfen bir şifre girin'],
      minlength: 8,
      select: false,
    },
    profilePhoto: {
      type: String,
      default: '', // Lokal URL veya bulut URL eklenecek
    },
    qrCode: {
      type: String,
      default: '', // Backend tarafında generate edilecek UUID veya direkt kullanıcı id'si
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [boylam, enlem] formatında
        default: [0, 0],
      },
    },
    notificationSettings: {
      mentions: { type: Boolean, default: true },
      groups: { type: Boolean, default: true },
      privateChats: { type: Boolean, default: true },
    }
  },
  {
    timestamps: true,
  }
);

// Location özelliği için geo index
userSchema.index({ location: '2dsphere' });

// Şifreyi kaydetmeden önce hash'leme
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Şifre kıyaslama metodu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
