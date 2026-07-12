const NotificationPreference = require('../models/notificationPreference.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Kullanıcının bildirim tercihlerini getir
// @route   GET /api/notifications/preferences
exports.getPreferences = async (req, res, next) => {
  try {
    const preferences = await NotificationPreference.find({ userId: req.user._id }).select('channel enabled -_id');
    
    // Varsayılan ayarlar
    const defaultPrefs = [
      { channel: 'push', enabled: true },
      { channel: 'email', enabled: true },
      { channel: 'sms', enabled: false },
      { channel: 'in_app', enabled: true }
    ];

    // Eğer veritabanında ayar varsa, varsayılanları ez
    const mergedPrefs = defaultPrefs.map(def => {
      const userPref = preferences.find(p => p.channel === def.channel);
      return userPref ? { channel: userPref.channel, enabled: userPref.enabled } : def;
    });

    return successResponse(res, 200, 'Bildirim tercihleri getirildi.', mergedPrefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Bildirim tercihini güncelle
// @route   PUT /api/notifications/preferences
// @body    { channel, enabled }
exports.updatePreference = async (req, res, next) => {
  try {
    const { channel, enabled } = req.body;

    if (!channel || enabled === undefined) {
      return errorResponse(res, 400, 'Kanal (channel) ve Durum (enabled) alanları zorunludur.');
    }

    if (!['push', 'email', 'sms', 'in_app'].includes(channel)) {
      return errorResponse(res, 400, 'Geçersiz bildirim kanalı.');
    }

    let pref = await NotificationPreference.findOne({ userId: req.user._id, channel });

    if (pref) {
      pref.enabled = enabled;
      await pref.save();
    } else {
      pref = await NotificationPreference.create({
        userId: req.user._id,
        channel,
        enabled
      });
    }

    return successResponse(res, 200, 'Bildirim tercihi başarıyla güncellendi.', { channel: pref.channel, enabled: pref.enabled });
  } catch (error) {
    next(error);
  }
};
