const LocationShare = require('../models/locationShare.model');
const Friendship = require('../models/friendship.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// Helper: Koordinat Maskeleme (Yaklaşık max 500m sapma)
const maskCoordinates = (lng, lat) => {
  const offset = 0.0045; // 500m için tahmini derece sapması
  const newLng = lng + (Math.random() * offset * 2 - offset);
  const newLat = lat + (Math.random() * offset * 2 - offset);
  return [newLng, newLat];
};

// @desc    Kendi konumunu güncelle
// @route   PUT /api/locations
// @body    { lng, lat, isMasked, visibility }
exports.updateLocation = async (req, res, next) => {
  try {
    let { lng, lat, isMasked, visibility } = req.body;
    
    if (lng === undefined || lat === undefined) {
      return errorResponse(res, 400, 'Boylam (lng) ve Enlem (lat) zorunludur.');
    }

    // Maskeleme aktifse koordinatları saptır
    if (isMasked) {
      [lng, lat] = maskCoordinates(lng, lat);
    }

    // Eğer body'de visibility gelmezse kullanıcının ayarlarından çek
    if (!visibility) {
      const user = await User.findById(req.user._id).select('privacy');
      visibility = user.privacy?.locationShare || 'everyone';
    }

    let locationShare = await LocationShare.findOne({ userId: req.user._id });

    if (locationShare) {
      locationShare.location.coordinates = [lng, lat];
      locationShare.visibility = visibility;
      locationShare.isMasked = isMasked || false;
      locationShare.updatedAt = Date.now();
      await locationShare.save();
    } else {
      locationShare = await LocationShare.create({
        userId: req.user._id,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        visibility,
        isMasked: isMasked || false
      });
    }

    return successResponse(res, 200, 'Konum başarıyla güncellendi.', locationShare);
  } catch (error) {
    next(error);
  }
};

// @desc    Yakındaki kişileri getir
// @route   GET /api/locations/nearby
// @query   lng, lat, radius(metre)
exports.getNearbyUsers = async (req, res, next) => {
  try {
    const { lng, lat, radius = 5000 } = req.query; // Varsayılan 5km (5000 metre)

    if (!lng || !lat) {
      return errorResponse(res, 400, 'Boylam (lng) ve Enlem (lat) parametreleri zorunludur.');
    }

    const currentUserId = req.user._id;

    // 1. Block Kontrolü (Engellediklerim veya beni engelleyenler çıkmasın)
    const blockedFriendships = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'blocked' },
        { recipient: currentUserId, status: 'blocked' }
      ]
    });
    
    const blockedUserIds = blockedFriendships.map(f => 
      f.requester.toString() === currentUserId.toString() ? f.recipient : f.requester
    );

    // 2. Arkadaşlık Kontrolü (Sadece 'friends' diyenleri görebilmem için)
    const myFriends = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'accepted' },
        { recipient: currentUserId, status: 'accepted' }
      ]
    });

    const friendIds = myFriends.map(f => 
      f.requester.toString() === currentUserId.toString() ? f.recipient.toString() : f.requester.toString()
    );

    // 3. Yakındakileri MongoDB 2dsphere ile getir
    const nearbyLocations = await LocationShare.find({
      location: {
        $near: {
          $geometry: {
             type: "Point" ,
             coordinates: [ parseFloat(lng), parseFloat(lat) ]
          },
          $maxDistance: parseInt(radius)
        }
      },
      userId: { $ne: currentUserId, $nin: blockedUserIds }
    }).populate('userId', 'name surname username profilePhoto status lastSeen privacy');

    // 4. Görünürlük (Visibility) Filtresi
    const filteredLocations = nearbyLocations.filter(loc => {
      if (!loc.userId || loc.visibility === 'nobody') return false;
      
      if (loc.visibility === 'friends' && !friendIds.includes(loc.userId._id.toString())) {
        return false;
      }
      
      return true;
    });

    return successResponse(res, 200, 'Yakındaki kullanıcılar getirildi.', filteredLocations);
  } catch (error) {
    next(error);
  }
};
