const User = require('../models/user.model');
const Session = require('../models/session.model');
const jwt = require('jsonwebtoken');

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
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, surname, username, password } = req.body;

    // 1. Tüm alanların doldurulduğunu kontrol et
    if (!name || !surname || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen ad, soyad, kullanıcı adı ve şifre alanlarını eksiksiz doldurun',
      });
    }

    // 2. Kullanıcı zaten var mı kontrol et
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı daha önceden alınmış',
      });
    }

    // 3. Kullanıcıyı oluştur ve veritabanına kaydet
    const user = await User.create({
      name,
      surname,
      username,
      password,
    });

    if (user) {
      // 4. Token'ları üret
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // 5. Refresh token'ı Session koleksiyonuna kaydet (Örnek: 7 gün geçerli)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); 

      await Session.create({
        user: user._id,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        deviceInfo: req.headers['user-agent'] || 'Bilinmeyen Cihaz'
      });

      // 6. Başarılı yanıtı dön
      res.status(201).json({
        success: true,
        message: 'Kayıt işlemi başarılı',
        data: {
          _id: user._id,
          name: user.name,
          surname: user.surname,
          username: user.username,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    console.error('Kayıt Hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin',
      error: error.message
    });
  }
};

// @desc    Kullanıcı girişi (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Kullanıcı adı ve şifre girilmiş mi kontrol et
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen kullanıcı adınızı ve şifrenizi girin',
      });
    }

    // 2. Kullanıcıyı bul (Şifreyi de getirmesini istiyoruz çünkü select: false yapmıştık)
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre',
      });
    }

    // 3. Şifre doğru mu kontrol et
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre',
      });
    }

    // 4. Token'ları üret
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5. Session oluştur (Refresh Token için)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    await Session.create({
      user: user._id,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
      deviceInfo: req.headers['user-agent'] || 'Bilinmeyen Cihaz'
    });

    // 6. Başarılı yanıtı dön
    res.status(200).json({
      success: true,
      message: 'Giriş işlemi başarılı',
      data: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        username: user.username,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    console.error('Giriş Hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin',
      error: error.message
    });
  }
};