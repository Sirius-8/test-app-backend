const { errorResponse } = require('../utils/response.util');
const crypto = require('crypto');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Bilinmeyen Sunucu Hatası';
  let code = 'INTERNAL_SERVER_ERROR';
  let details = null;
  const traceId = crypto.randomUUID();

  // Mongoose "CastError" (Geçersiz ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Kaynak bulunamadı (Geçersiz ID formatı)';
    code = 'RESOURCE_NOT_FOUND';
  }

  // Mongoose validation hatası
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Veri doğrulama hatası';
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map(val => val.message);
  }

  // Mongoose duplicate key hatası (Örn: Aynı email ile kayıt)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Bu kayıt zaten sistemde mevcut';
    code = 'DUPLICATE_RESOURCE';
    details = Object.keys(err.keyValue);
  }

  // Geliştirme ortamı detayları
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    details = err.stack;
  }

  // Standart formatta hatayı dön
  return errorResponse(res, statusCode, message, code, details, traceId);
};

module.exports = errorHandler;
