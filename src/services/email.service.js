/**
 * İzole edilmiş E-posta Gönderim Servisi
 * İleride Nodemailer veya SendGrid gibi gerçek servislere geçildiğinde sadece bu dosya değişecek.
 */

const sendEmail = async (options) => {
  // Gerçek e-posta gönderme kodları buraya gelecek
  // Şimdilik sadece terminale log basıyoruz
  
  console.log('\n=============================================');
  console.log(`✉️ SİMÜLASYON E-POSTA GÖNDERİLDİ`);
  console.log(`Kime: ${options.to}`);
  console.log(`Konu: ${options.subject}`);
  console.log(`Mesaj/Link: \n${options.text}`);
  console.log('=============================================\n');

  return true;
};

module.exports = sendEmail;
