const express = require('express');
const router = express.Router();

const {
  sendFriendRequest,
  respondToRequest,
  cancelOrRemoveFriend,
  getFriendsList,
  getPendingRequests
} = require('../controllers/friendship.controller');

const { protect } = require('../middlewares/auth.middleware');
const { friendRequestLimiter, apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(protect);

router.route('/')
  .get(apiLimiter, getFriendsList);

router.route('/pending')
  .get(apiLimiter, getPendingRequests);

router.route('/request/:userId')
  .post(friendRequestLimiter, sendFriendRequest);

router.route('/respond/:requestId')
  .put(apiLimiter, respondToRequest);

router.route('/:friendshipId')
  .delete(apiLimiter, cancelOrRemoveFriend);

module.exports = router;
