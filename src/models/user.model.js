const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen bir isim girin'],
    },
    surname: {
      type: String,
      required: [true, 'Lütfen bir soyisim girin'],
    },
    username: {
      type: String,
      required: [true, 'Lütfen bir kullanıcı adı girin'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Lütfen e-posta adresi girin'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Lütfen geçerli bir e-posta adresi girin',
      ],
    },
    password: {
      type: String,
      required: [true, 'Lütfen bir şifre girin'],
      minlength: 8,
      select: false, // Sorgularda şifrenin otomatik olarak dönmesini engeller
    },
    profilePhoto: {
      type: String,
      default: 'default.jpg',
    },
    qrCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'dnd'],
      default: 'offline'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // createdAt ve updatedAt otomatik eklenir
  }
);

// Email ve username için unique indexler otomatik olarak oluşturuldu (şemada unique: true vererek)

// Şifreyi kaydetmeden önce hash'leme
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Girilen şifre ile veritabanındaki hash'lenmiş şifreyi karşılaştırma
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
