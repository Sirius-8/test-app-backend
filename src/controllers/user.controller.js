const User = require('../models/user.model');
const Friendship = require('../models/friendship.model');
const { successResponse, errorResponse } = require('../utils/response.util');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Klasör yoksa oluştur
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// @desc    Sistemdeki kullanıcıları getir (Arama destekli - Korumalı)
// @route   GET /api/discoverusers
exports.getUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { username: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    // Block sistemini dikkate al (Ne engellediğim kişileri göreyim, ne de beni engelleyenleri)
    const blockedFriendships = await Friendship.find({
      $or: [
        { requester: req.user._id, status: 'blocked' },
        { recipient: req.user._id, status: 'blocked' }
      ]
    });

    const blockedUserIds = blockedFriendships.map(f => {
      return f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester;
    });

    const users = await User.find({ 
      ...keyword, 
      _id: { $ne: req.user._id, $nin: blockedUserIds } 
    }).select('name surname username email profilePhoto status lastSeen createdAt privacy');

    return successResponse(res, 200, 'Kullanıcılar başarıyla getirildi', users);
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı gizlilik ayarlarını güncelle
// @route   PUT /api/discoverusers/privacy
exports.updatePrivacy = async (req, res, next) => {
  try {
    const { lastSeen, profilePhoto, onlineStatus, locationShare } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (lastSeen) user.privacy.lastSeen = lastSeen;
    if (profilePhoto) user.privacy.profilePhoto = profilePhoto;
    if (onlineStatus) user.privacy.onlineStatus = onlineStatus;
    if (locationShare) user.privacy.locationShare = locationShare;
    
    await user.save();
    
    return successResponse(res, 200, 'Gizlilik ayarları başarıyla güncellendi.', user.privacy);
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı istemci ayarlarını güncelle (Dil, Tema vb.)
// @route   PUT /api/discoverusers/settings
exports.updateClientSettings = async (req, res, next) => {
  try {
    const { theme, language } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (theme) user.clientSettings.theme = theme;
    if (language) user.clientSettings.language = language;
    
    await user.save();
    
    return successResponse(res, 200, 'İstemci ayarları başarıyla güncellendi.', user.clientSettings);
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı profil fotoğrafını yükle/güncelle
// @route   POST /api/discoverusers/profile-photo
exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Lütfen bir resim dosyası seçin.');
    }

    const user = await User.findById(req.user._id);

    // Eski dosyayı silme (Eğer default.jpg değilse)
    if (user.profilePhoto && user.profilePhoto !== 'default.jpg') {
      const oldPath = path.join(__dirname, '../../public', user.profilePhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Yeni dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `profile-${req.user._id}-${uniqueSuffix}.webp`;
    
    // Klasör yolunu ayarla
    const uploadDir = path.join(__dirname, '../../public/uploads/profiles');
    ensureDir(uploadDir);

    // Sharp ile resmi yeniden boyutlandır (500x500), webp formatına dönüştür ve kaydet
    await sharp(req.file.buffer)
      .resize(500, 500, {
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .webp({ quality: 80 })
      .toFile(path.join(uploadDir, filename));

    // Veritabanını güncelle
    const photoUrl = `/uploads/profiles/${filename}`;
    user.profilePhoto = photoUrl;
    await user.save();

    return successResponse(res, 200, 'Profil fotoğrafı başarıyla güncellendi.', { profilePhoto: photoUrl });
  } catch (error) {
    next(error);
  }
};

// TODO: UNUTMA! Canlıya (Production) çıkmadan önce aşağıdaki 2 debug fonksiyonunu SİLMEYİ UNUTMA!

// @desc    DB'deki tüm kullanıcıları koşulsuz getir (Test ve Debug için)
// @route   GET /api/users/all
exports.getAllUsersDebug = async (req, res, next) => {
  try {
    // Veritabanındaki herkesi getir (Kendimiz dahil, token gerektirmez)
    const users = await User.find({});
    return successResponse(res, 200, 'DB\'deki Tüm Kullanıcılar', users);
  } catch (error) {
    next(error);
  }
};

// @desc    Belirli bir kullanıcıyı veritabanından tamamen sil (Test ve Debug için)
// @route   DELETE /api/users/:id
exports.deleteUserDebug = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'Silinecek kullanıcı bulunamadı', 'USER_NOT_FOUND');
    }

    // Kullanıcıyı sil
    await User.findByIdAndDelete(req.params.id);
    
    // Kullanıcıya ait oturumları (Tokenları) da sil
    const Session = require('../models/session.model');
    await Session.deleteMany({ userId: req.params.id });

    return successResponse(res, 200, 'Kullanıcı ve oturumları veritabanından tamamen silindi.');
  } catch (error) {
    next(error);
  }
};
