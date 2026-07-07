const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/response.util');

// Korumalı rotalar için yetkilendirme kontrolü (Bearer Token Bekçisi)
const protect = async (req, res, next) => {
  let token;

  // Header'da Authorization alanı var mı ve "Bearer" ile mi başlıyor kontrol et
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Token yoksa hata dön
  if (!token) {
    return errorResponse(res, 401, 'Bu rotaya erişmek için yetkiniz yok (Token bulunamadı)', 'UNAUTHENTICATED');
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token içerisindeki ID ile kullanıcıyı veritabanında bul
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 401, 'Bu tokena ait kullanıcı artık mevcut değil', 'UNAUTHENTICATED');
    }

    // Doğrulanmış kullanıcı bilgilerini isteğe (req.user) ekle ki diğer rotalar kullanabilsin
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Geçersiz veya süresi dolmuş token', 'UNAUTHENTICATED');
  }
};

module.exports = { protect };
