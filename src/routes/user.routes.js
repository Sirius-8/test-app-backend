const express = require('express');
const router = express.Router();

const { getUsers, getAllUsersDebug, deleteUserDebug, updatePrivacy, updateClientSettings, uploadProfilePhoto } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter, searchLimiter } = require('../middlewares/rateLimit.middleware');
const upload = require('../middlewares/upload.middleware');

// TODO: UNUTMA! Canlıya (Production) çıkmadan önce aşağıdaki test/debug rotalarını SİLMEYİ UNUTMA!

// Token GEREKTİRMEYEN (Test/Debug) Rota: Veritabanındaki herkesi görmek için
router.get('/all', getAllUsersDebug);

// Token GEREKTİRMEYEN (Test/Debug) Rota: Belirli bir kullanıcıyı silmek için
router.delete('/:id', deleteUserDebug);

// Güvenlik: Bundan sonraki rotalar (Normal kullanım) için giriş yapmış olmak zorunlu
router.use(protect);
router.use(apiLimiter);

// GET /api/discoverusers (Uygulama içi kullanıcı arama - Abuse önleme için searchLimiter eklendi)
router.route('/')
  .get(searchLimiter, getUsers);

// PUT /api/discoverusers/privacy (Gizlilik ayarları)
router.route('/privacy')
  .put(updatePrivacy);

// PUT /api/discoverusers/settings (İstemci/Tema ayarları)
router.route('/settings')
  .put(updateClientSettings);

// POST /api/discoverusers/profile-photo (Profil resmi yükleme)
router.route('/profile-photo')
  .post(upload.single('image'), uploadProfilePhoto);

module.exports = router;
