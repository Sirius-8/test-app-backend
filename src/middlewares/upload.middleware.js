const multer = require('multer');

// Dosyayı diske kaydetmeden önce sharp ile işleyeceğimiz için memoryStorage kullanıyoruz
const storage = multer.memoryStorage();

// Sadece resim dosyalarına izin veren filtre
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

// Multer konfigürasyonu (Maksimum 5MB)
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

module.exports = upload;
