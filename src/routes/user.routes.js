const express = require('express');
const router = express.Router();

const { getUsers, getAllUsersDebug, deleteUserDebug, updatePrivacy } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter, searchLimiter } = require('../middlewares/rateLimit.middleware');

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

module.exports = router;
