// gelen isteği ilgili controllera yönlendirir.
const express = require('express');
const router = express.Router(); 

const { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  verifyEmail 
} = require('../controllers/auth.controller'); 

const { authLimiter } = require('../middlewares/rateLimit.middleware');

// Güvenlik: Tüm Auth rotalarına istek sınırlandırması uygula
router.use(authLimiter);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/forgotpassword
router.post('/forgotpassword', forgotPassword);

// POST /api/auth/resetpassword/:resettoken
router.post('/resetpassword/:resettoken', resetPassword);

// GET /api/auth/verifyemail/:verifytoken
router.get('/verifyemail/:verifytoken', verifyEmail);

module.exports = router;