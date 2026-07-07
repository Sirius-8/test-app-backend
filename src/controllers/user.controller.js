const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Sistemdeki kullanıcıları getir (Arama destekli - Korumalı)
// @route   GET /api/users
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

    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
      .select('name surname username email profilePhoto status lastSeen createdAt');

    return successResponse(res, 200, 'Kullanıcılar başarıyla getirildi', users);
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
