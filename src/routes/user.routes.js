const express = require('express');
const router = express.Router();

const { getUsers, getAllUsersDebug, deleteUserDebug } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

// TODO: UNUTMA! Canlıya (Production) çıkmadan önce aşağıdaki test/debug rotalarını SİLMEYİ UNUTMA!

// Token GEREKTİRMEYEN (Test/Debug) Rota: Veritabanındaki herkesi görmek için
router.get('/all', getAllUsersDebug);

// Token GEREKTİRMEYEN (Test/Debug) Rota: Belirli bir kullanıcıyı silmek için
router.delete('/:id', deleteUserDebug);

// Güvenlik: Bundan sonraki rotalar (Normal kullanım) için giriş yapmış olmak zorunlu
router.use(protect);
router.use(apiLimiter);

// GET /api/users (Uygulama içi kullanıcı arama)
router.route('/')
  .get(getUsers);

module.exports = router;
