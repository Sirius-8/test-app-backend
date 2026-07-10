const express = require('express');
const router = express.Router();

const { generateQRToken, scanQRToken } = require('../controllers/qr.controller');
const { protect } = require('../middlewares/auth.middleware');
const { qrScanLimiter, apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(protect);

router.route('/generate')
  .get(apiLimiter, generateQRToken);

// Rate limiter'ı buraya uyguluyoruz (Abuse engellemek için)
router.route('/scan/:token')
  .get(qrScanLimiter, scanQRToken);

module.exports = router;
