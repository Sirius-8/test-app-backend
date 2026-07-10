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

// Kullanıcı arama (Search) rotası için rate limiter (Abuse önleme)
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 50, // 5 dakikada en fazla 50 arama
  handler: (req, res) => {
    return errorResponse(res, 429, 'Çok fazla arama yaptınız. Lütfen biraz bekleyin.');
  },
});

// Arkadaşlık istekleri için rate limiter (Spam önleme)
const friendRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20, // 15 dakikada en fazla 20 arkadaşlık isteği
  handler: (req, res) => {
    return errorResponse(res, 429, 'Çok fazla arkadaşlık isteği gönderdiniz. Lütfen daha sonra tekrar deneyin.');
  },
});

// QR Tarama için rate limiter (Brute-force önleme)
const qrScanLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 10, // 5 dakikada en fazla 10 QR taraması
  handler: (req, res) => {
    return errorResponse(res, 429, 'Çok fazla QR taraması yaptınız. Lütfen daha sonra tekrar deneyin.');
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  searchLimiter,
  friendRequestLimiter,
  qrScanLimiter
};
