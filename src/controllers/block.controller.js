const Friendship = require('../models/friendship.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Kullanıcıyı engelle
// @route   POST /api/blocks/:userId
exports.blockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return errorResponse(res, 400, 'Kendinizi engelleyemezsiniz.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return errorResponse(res, 404, 'Kullanıcı bulunamadı.');
    }

    let friendship = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUserId },
        { requester: targetUserId, recipient: currentUserId }
      ]
    });

    if (friendship) {
      // İlişki varsa durumu blocked yap, bloklayanı requester yap
      friendship.requester = currentUserId;
      friendship.recipient = targetUserId;
      friendship.status = 'blocked';
      await friendship.save();
    } else {
      // İlişki yoksa yeni kayıt aç
      await Friendship.create({
        requester: currentUserId,
        recipient: targetUserId,
        status: 'blocked'
      });
    }

    return successResponse(res, 200, 'Kullanıcı başarıyla engellendi.');
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcının engelini kaldır
// @route   DELETE /api/blocks/:userId
exports.unblockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const friendship = await Friendship.findOne({
      requester: currentUserId,
      recipient: targetUserId,
      status: 'blocked'
    });

    if (!friendship) {
      return errorResponse(res, 404, 'Bu kullanıcı engellenmemiş veya bulunamadı.');
    }

    // Engeli kaldırınca ilişkiyi tamamen sil
    await Friendship.findByIdAndDelete(friendship._id);

    return successResponse(res, 200, 'Kullanıcının engeli başarıyla kaldırıldı.');
  } catch (error) {
    next(error);
  }
};

// @desc    Engellenen kullanıcıları listele
// @route   GET /api/blocks
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const blockedList = await Friendship.find({
      requester: req.user._id,
      status: 'blocked'
    }).populate('recipient', 'name surname username privacy profilePhoto');

    const formattedList = blockedList.map(item => item.recipient);

    return successResponse(res, 200, 'Engellenen kullanıcılar başarıyla getirildi', formattedList);
  } catch (error) {
    next(error);
  }
};
