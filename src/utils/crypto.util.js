const crypto = require('crypto');

// Rastgele bir token oluşturur ve aynı zamanda veritabanına kaydetmek üzere hashlenmiş halini döner
const generateRandomToken = () => {
  // Rastgele 20 bytelık hex string (Kullanıcıya maille gidecek açık token)
  const plainToken = crypto.randomBytes(20).toString('hex');

  // Veritabanına kaydedilecek hashli versiyon (Güvenlik için token veritabanında düz metin tutulmaz)
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');

  return { plainToken, hashedToken };
};

module.exports = {
  generateRandomToken,
};
