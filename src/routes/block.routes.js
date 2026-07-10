const express = require('express');
const router = express.Router();

const { blockUser, unblockUser, getBlockedUsers } = require('../controllers/block.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(protect);
router.use(apiLimiter);

router.route('/')
  .get(getBlockedUsers);

router.route('/:userId')
  .post(blockUser)
  .delete(unblockUser);

module.exports = router;
