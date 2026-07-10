const crypto = require('crypto');
const QRToken = require('../models/qrToken.model');
const Friendship = require('../models/friendship.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    QR Kod Token Üret (5 dk ömürlü)
// @route   GET /api/qr/generate
exports.generateQRToken = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Varsa kullanıcının eski tokenlarını sil
    await QRToken.deleteMany({ userId: currentUserId });

    const randomString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dk

    const newQRToken = await QRToken.create({
      userId: currentUserId,
      token: randomString,
      expiresAt
    });

    return successResponse(res, 201, 'QR Kod Token başarıyla üretildi.', {
      qrToken: newQRToken.token,
      expiresAt: newQRToken.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    QR Kod Tara (Kullanıcı Profilini Getir)
// @route   GET /api/qr/scan/:token
exports.scanQRToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const currentUserId = req.user._id;

    const qrRecord = await QRToken.findOne({ token }).populate('userId', 'name surname username profilePhoto privacy');

    if (!qrRecord) {
      return errorResponse(res, 404, 'Geçersiz veya süresi dolmuş QR Kod.');
    }

    const targetUser = qrRecord.userId;

    if (targetUser._id.toString() === currentUserId.toString()) {
      return errorResponse(res, 400, 'Kendi QR kodunuzu tarayamazsınız.');
    }

    // Blok kontrolü
    const blocked = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUser._id, status: 'blocked' },
        { requester: targetUser._id, recipient: currentUserId, status: 'blocked' }
      ]
    });

    if (blocked) {
      return errorResponse(res, 403, 'Bu kullanıcının profili görüntülenemez (Engellenmiş).');
    }

    return successResponse(res, 200, 'Kullanıcı profili bulundu.', { user: targetUser });
  } catch (error) {
    next(error);
  }
};
