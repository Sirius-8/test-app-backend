// Standart API cevap formatı oluşturucu (Kurumsal Standartlara Uyumlu)
const successResponse = (res, statusCode = 200, message = 'Başarılı', data = {}, meta = {}) => {
  const responseObj = {
    message,
    data,
    meta,
  };

  return res.status(statusCode).json(responseObj);
};

const errorResponse = (res, statusCode = 500, message = 'Sunucu Hatası', code = 'INTERNAL_ERROR', details = null, traceId = null) => {
  const responseObj = {
    code,
    message,
  };

  if (details) {
    responseObj.details = details;
  }

  // İstek bazlı benzersiz bir hata takip numarası (Eğer yollanmamışsa otomatik üret)
  responseObj.traceId = traceId || require('crypto').randomUUID();

  return res.status(statusCode).json(responseObj);
};

module.exports = {
  successResponse,
  errorResponse,
};
