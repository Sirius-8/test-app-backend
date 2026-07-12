const express = require('express');
const router = express.Router();

const { updateLocation, getNearbyUsers } = require('../controllers/location.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(protect);
router.use(apiLimiter);

router.route('/')
  .put(updateLocation);

router.route('/nearby')
  .get(getNearbyUsers);

module.exports = router;
