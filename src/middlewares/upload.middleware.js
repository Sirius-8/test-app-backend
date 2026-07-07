const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Klasör yoksa oluştur (Örn: uploads/chats veya uploads/profiles)
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Disk Depolama ayarları (Şimdilik lokal disk, ileride AWS S3'e kolayca geçirilebilir)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.params.type || 'general'; // Örn: chat, profile
    const dir = `uploads/${type}`;
    ensureDir(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Benzersiz bir dosya adı oluştur: timestamp-rastgeleSayi.uzanti
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Dosya filtreleme (Sadece belirli formatlara izin ver)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı'), false);
  }
};

// 5MB limit
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;
