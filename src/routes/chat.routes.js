const express = require('express');
const router = express.Router();

const { getChats, createChat, getMessages } = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

// Güvenlik: Tüm Chat rotalarında giriş yapmış olma (protect) şartı var
router.use(protect);

// Rate Limiter: Genel API limiti uygula
router.use(apiLimiter);

// GET /api/chats -> Sohbet listesi
// POST /api/chats -> Sohbet oluştur
router.route('/')
  .get(getChats)
  .post(createChat);

// GET /api/chats/:id/messages -> Mesaj geçmişi
router.route('/:id/messages')
  .get(getMessages);

module.exports = router;
