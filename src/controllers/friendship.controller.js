const Friendship = require('../models/friendship.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// Helper: Blok durumunu kontrol et
const checkBlockStatus = async (userA, userB) => {
  const blocked = await Friendship.findOne({
    $or: [
      { requester: userA, recipient: userB, status: 'blocked' },
      { requester: userB, recipient: userA, status: 'blocked' }
    ]
  });
  return !!blocked;
};

// @desc    Arkadaşlık isteği gönder
// @route   POST /api/friends/request/:userId
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return errorResponse(res, 400, 'Kendinize arkadaşlık isteği gönderemezsiniz.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return errorResponse(res, 404, 'Kullanıcı bulunamadı.');
    }

    const isBlocked = await checkBlockStatus(currentUserId, targetUserId);
    if (isBlocked) {
      return errorResponse(res, 403, 'Bu kullanıcıya istek gönderemezsiniz (Engellenmiş).');
    }

    let friendship = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUserId },
        { requester: targetUserId, recipient: currentUserId }
      ]
    });

    if (friendship) {
      if (friendship.status === 'pending') {
        return errorResponse(res, 400, 'Zaten bekleyen bir istek var.');
      }
      if (friendship.status === 'accepted') {
        return errorResponse(res, 400, 'Zaten arkadaşsınız.');
      }
      
      // Daha önceden red veya iptal edildiyse tekrar istek atılabilir
      friendship.requester = currentUserId;
      friendship.recipient = targetUserId;
      friendship.status = 'pending';
      await friendship.save();
    } else {
      await Friendship.create({
        requester: currentUserId,
        recipient: targetUserId,
        status: 'pending'
      });
    }

    return successResponse(res, 200, 'Arkadaşlık isteği başarıyla gönderildi.');
  } catch (error) {
    next(error);
  }
};

// @desc    Arkadaşlık isteğini yanıtla (Kabul / Red)
// @route   PUT /api/friends/respond/:requestId
// @body    { "status": "accepted" | "rejected" }
exports.respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    const requestId = req.params.requestId;

    if (!['accepted', 'rejected'].includes(status)) {
      return errorResponse(res, 400, "Geçersiz durum. 'accepted' veya 'rejected' olmalıdır.");
    }

    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      return errorResponse(res, 404, 'İstek bulunamadı.');
    }

    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Bu isteği yanıtlama yetkiniz yok.');
    }

    if (friendship.status !== 'pending') {
      return errorResponse(res, 400, 'Bu istek artık beklemede değil.');
    }

    friendship.status = status;
    await friendship.save();

    const msg = status === 'accepted' ? 'Arkadaşlık isteği kabul edildi.' : 'Arkadaşlık isteği reddedildi.';
    return successResponse(res, 200, msg);
  } catch (error) {
    next(error);
  }
};

// @desc    Kendi gönderdiği isteği iptal et veya arkadaşlıktan çıkar
// @route   DELETE /api/friends/:friendshipId
exports.cancelOrRemoveFriend = async (req, res, next) => {
  try {
    const friendshipId = req.params.friendshipId;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return errorResponse(res, 404, 'Kayıt bulunamadı.');
    }

    if (friendship.requester.toString() !== req.user._id.toString() &&
        friendship.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Bu işlemi yapma yetkiniz yok.');
    }

    if (friendship.status === 'blocked') {
      return errorResponse(res, 400, 'Engellenmiş kayıtlar buradan silinemez. Block rotasını kullanın.');
    }

    await Friendship.findByIdAndDelete(friendshipId);

    return successResponse(res, 200, 'İşlem başarıyla iptal edildi / Arkadaşlıktan çıkarıldı.');
  } catch (error) {
    next(error);
  }
};

// @desc    Arkadaş listesini getir
// @route   GET /api/friends
exports.getFriendsList = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const friends = await Friendship.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: 'accepted'
    })
    .populate('requester', 'name surname username profilePhoto privacy')
    .populate('recipient', 'name surname username profilePhoto privacy');

    const formattedList = friends.map(f => {
      // Friendship tablosu ID'sini de gönderelim ki silmek isterse kullanabilsin
      const targetUser = f.requester._id.toString() === currentUserId.toString() ? f.recipient : f.requester;
      return {
        friendshipId: f._id,
        user: targetUser
      };
    });

    return successResponse(res, 200, 'Arkadaş listesi başarıyla getirildi.', formattedList);
  } catch (error) {
    next(error);
  }
};

// @desc    Bana gelen bekleyen istekleri listele
// @route   GET /api/friends/pending
exports.getPendingRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const requests = await Friendship.find({
      recipient: currentUserId,
      status: 'pending'
    }).populate('requester', 'name surname username profilePhoto');

    const formattedList = requests.map(r => ({
      requestId: r._id,
      user: r.requester
    }));

    return successResponse(res, 200, 'Bekleyen istekler getirildi.', formattedList);
  } catch (error) {
    next(error);
  }
};
