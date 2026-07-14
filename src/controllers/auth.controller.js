const User = require('../models/user.model');
const Session = require('../models/session.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateRandomToken } = require('../utils/crypto.util');
const sendEmail = require('../services/email.service');
const { successResponse, errorResponse } = require('../utils/response.util');

// Yardımcı fonksiyonlar: Token üretme
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// @desc    Kullanıcı kaydı (Register)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, surname, username, password, email } = req.body;

    if (!name || !surname || !username || !password || !email) {
      return errorResponse(res, 400, 'Lütfen tüm alanları eksiksiz doldurun', 'MISSING_FIELDS');
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return errorResponse(res, 409, 'Bu kullanıcı adı daha önceden alınmış', 'DUPLICATE_USERNAME');
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return errorResponse(res, 409, 'Bu e-posta adresi sistemde zaten kayıtlı', 'DUPLICATE_EMAIL');
    }

    const { plainToken, hashedToken } = generateRandomToken();

    const user = await User.create({
      name,
      surname,
      username,
      password,
      email,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 saat geçerli
    });

    // Doğrulama emaili gönder
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${plainToken}`;
    const message = `E-posta adresinizi doğrulamak için şu bağlantıya tıklayın: \n\n ${verifyUrl}`;
    
    // Asenkron çalışması için await eklemedik, hatayı tolere edebiliriz
    sendEmail({
      to: user.email,
      subject: 'E-posta Doğrulama',
      text: message
    }).catch(err => console.error('E-posta gönderim hatası:', err));

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const ip = req.ip || req.connection.remoteAddress;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      device: req.headers['user-agent'] || 'Bilinmeyen Cihaz',
      ip
    });

    return successResponse(res, 201, 'Kayıt işlemi başarılı', {
      id: user._id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      status: user.status
    }, { accessToken, refreshToken });

  } catch (error) {
    next(error); 
  }
};

// @desc    Kullanıcı girişi (Login)
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, 'Lütfen kullanıcı adınızı ve şifrenizi girin', 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Geçersiz kullanıcı adı veya şifre', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Geçersiz kullanıcı adı veya şifre', 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const ip = req.ip || req.connection.remoteAddress;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      device: req.headers['user-agent'] || 'Bilinmeyen Cihaz',
      ip
    });

    return successResponse(res, 200, 'Giriş işlemi başarılı', {
      id: user._id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      status: user.status
    }, { accessToken, refreshToken });

  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı çıkışı (Logout)
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return errorResponse(res, 400, 'Çıkış yapmak için refresh token gerekli', 'MISSING_TOKEN');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await Session.findOneAndDelete({ tokenHash });

    return successResponse(res, 200, 'Başarıyla çıkış yapıldı');
  } catch (error) {
    next(error);
  }
};

// @desc    Şifremi Unuttum (Forgot Password)
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı', 'USER_NOT_FOUND');
    }

    const { plainToken, hashedToken } = generateRandomToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika geçerli
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${plainToken}`;
    const message = `Şifrenizi sıfırlamak için şu bağlantıya tıklayın: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Şifre Sıfırlama İsteği',
        text: message
      });

      return successResponse(res, 200, 'Şifre sıfırlama e-postası gönderildi');
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return errorResponse(res, 500, 'E-posta gönderilemedi', 'EMAIL_SEND_FAILED');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Şifre Sıfırlama (Reset Password)
// @route   POST /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Geçersiz veya süresi dolmuş token', 'INVALID_TOKEN');
    }

    if (!req.body.password) {
      return errorResponse(res, 400, 'Lütfen yeni şifrenizi girin', 'MISSING_PASSWORD');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return successResponse(res, 200, 'Şifreniz başarıyla sıfırlandı, artık giriş yapabilirsiniz.');
  } catch (error) {
    next(error);
  }
};

// @desc    E-posta Doğrulama (Verify Email)
// @route   GET /api/auth/verifyemail/:verifytoken
exports.verifyEmail = async (req, res, next) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.verifytoken)
      .digest('hex');

    // Süresi dolmamış token ara
    const user = await User.findOne({ 
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Geçersiz veya süresi dolmuş doğrulama tokenı', 'INVALID_VERIFY_TOKEN');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, 'E-posta adresiniz başarıyla doğrulandı.');
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcının kendi şifresini değiştirmesi (Ayarlar içinden)
// @route   PUT /api/auth/changepassword
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Lütfen mevcut ve yeni şifrenizi eksiksiz girin.', 'MISSING_FIELDS');
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 400, 'Yeni şifreniz en az 8 karakter olmalıdır.', 'INVALID_PASSWORD_LENGTH');
    }

    // req.user._id, protect middleware'inden geliyor. Sadece şifreyi dahil ediyoruz
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'Kullanıcı bulunamadı', 'USER_NOT_FOUND');
    }

    // Eski şifre doğru mu kontrol et
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Mevcut şifreniz hatalı', 'INVALID_CREDENTIALS');
    }

    // Yeni şifreyi ata (Modelin save methodu onu hash'leyecektir)
    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Şifreniz başarıyla değiştirildi.');
  } catch (error) {
    next(error);
  }
};