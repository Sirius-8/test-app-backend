const express = require('express');
const router = express.Router();

const { getPreferences, updatePreference } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(protect);
router.use(apiLimiter);

router.route('/preferences')
  .get(getPreferences)
  .put(updatePreference);

module.exports = router;
