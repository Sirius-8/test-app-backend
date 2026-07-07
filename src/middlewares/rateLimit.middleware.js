const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/response.util');

// Auth (Giriş/Kayıt vb.) rotaları için rate limiter (Brute-force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // Geliştirme (Test) aşamasında limiti 10'dan 1000'e çıkardık
  handler: (req, res) => {
    return errorResponse(res, 429, 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.');
  },
  standardHeaders: true, // `RateLimit-*` headerlarını döndür
  legacyHeaders: false, // Eski `X-RateLimit-*` headerlarını kapat
});

// Genel API rotaları için daha esnek rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // Geliştirme aşamasında limiti artırdık
  handler: (req, res) => {
    return errorResponse(res, 429, 'API kullanım sınırını aştınız. Lütfen daha sonra tekrar deneyin.');
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
