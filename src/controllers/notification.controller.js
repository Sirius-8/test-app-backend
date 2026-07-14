const NotificationPreference = require('../models/notificationPreference.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Kullanıcının bildirim tercihlerini getir
// @route   GET /api/notifications/preferences
exports.getPreferences = async (req, res, next) => {
  try {
    const type = req.query.type || 'global';
    const preferences = await NotificationPreference.find({ userId: req.user._id, type }).select('channel enabled type -_id');
    
    // Varsayılan ayarlar
    const defaultPrefs = [
      { channel: 'push', enabled: true, type },
      { channel: 'email', enabled: true, type },
      { channel: 'sms', enabled: false, type },
      { channel: 'in_app', enabled: true, type }
    ];

    // Eğer veritabanında ayar varsa, varsayılanları ez
    const mergedPrefs = defaultPrefs.map(def => {
      const userPref = preferences.find(p => p.channel === def.channel);
      return userPref ? { channel: userPref.channel, enabled: userPref.enabled, type: userPref.type } : def;
    });

    return successResponse(res, 200, 'Bildirim tercihleri getirildi.', mergedPrefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Bildirim tercihini güncelle
// @route   PUT /api/notifications/preferences
// @body    { channel, type, enabled }
exports.updatePreference = async (req, res, next) => {
  try {
    const { channel, type = 'global', enabled } = req.body;

    if (!channel || enabled === undefined) {
      return errorResponse(res, 400, 'Kanal (channel) ve Durum (enabled) alanları zorunludur.');
    }

    if (!['push', 'email', 'sms', 'in_app'].includes(channel)) {
      return errorResponse(res, 400, 'Geçersiz bildirim kanalı.');
    }

    if (!['global', 'group_chat', 'private_chat'].includes(type)) {
      return errorResponse(res, 400, 'Geçersiz bildirim tipi (type). global, group_chat, private_chat olabilir.');
    }

    let pref = await NotificationPreference.findOne({ userId: req.user._id, channel, type });

    if (pref) {
      pref.enabled = enabled;
      await pref.save();
    } else {
      pref = await NotificationPreference.create({
        userId: req.user._id,
        channel,
        type,
        enabled
      });
    }

    return successResponse(res, 200, 'Bildirim tercihi başarıyla güncellendi.', { channel: pref.channel, type: pref.type, enabled: pref.enabled });
  } catch (error) {
    next(error);
  }
};
