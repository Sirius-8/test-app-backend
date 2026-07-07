const Chat = require('../models/chat.model');
const ChatMember = require('../models/chatMember.model');
const Message = require('../models/message.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Kullanıcının sohbet listesini getir
// @route   GET /api/chats
exports.getChats = async (req, res, next) => {
  try {
    const { type, unread } = req.query;

    // Kullanıcının üyesi olduğu sohbetleri bul
    const memberChats = await ChatMember.find({ userId: req.user._id }).select('chatId lastReadMessageId muted');
    const chatIds = memberChats.map(mc => mc.chatId);

    // Filtreleri hazırla
    let chatFilter = { _id: { $in: chatIds } };
    if (type && (type === 'private' || type === 'group')) {
      chatFilter.type = type;
    }

    // Sohbetleri son mesaja göre sıralı çek
    let chats = await Chat.find(chatFilter)
      .sort({ lastMessageAt: -1 })
      .lean();

    // Sohbet üyelerini ve okunmamış mesaj durumlarını ekle (Basit implementasyon)
    // Gerçek bir prod ortamında bu işlem aggregation framework (MongoDB) ile tek seferde yapılır
    for (let chat of chats) {
      // Sohbetin diğer üyelerini getir
      const members = await ChatMember.find({ chatId: chat._id })
        .populate('userId', 'name surname username profilePhoto status lastSeen')
        .lean();
      
      chat.members = members.map(m => m.userId);

      // İsteğe bağlı: En son atılan mesajın detayını getir
      const lastMessage = await Message.findOne({ chatId: chat._id }).sort({ createdAt: -1 }).lean();
      chat.lastMessage = lastMessage;

      // Kendi ChatMember kaydımızı bulup, unread durumunu hesaplayabiliriz
      const myMembership = memberChats.find(mc => mc.chatId.toString() === chat._id.toString());
      chat.muted = myMembership.muted;
    }

    return successResponse(res, 200, 'Sohbetler başarıyla getirildi', chats);
  } catch (error) {
    next(error);
  }
};

// @desc    Sohbet başlat veya var olanı getir (Özel mesaj veya Grup)
// @route   POST /api/chats
exports.createChat = async (req, res, next) => {
  try {
    const { type, title, memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return errorResponse(res, 400, 'Lütfen sohbete eklenecek kullanıcıları belirtin', 'MISSING_MEMBERS');
    }

    // Tüm üyelerin içine beni de (kendi ID'mi) ekle
    const allMembers = [...new Set([...memberIds, req.user._id.toString()])];

    if (type === 'private' && allMembers.length > 2) {
      return errorResponse(res, 400, 'Özel sohbet sadece iki kişi arasında olabilir', 'INVALID_PRIVATE_CHAT');
    }

    // Private (Özel) sohbet oluşturuluyorsa, daha önce bu ikili arasında sohbet var mı kontrol et
    if (type === 'private') {
      // Benim olduğum özel sohbetler
      const myChats = await ChatMember.find({ userId: req.user._id }).select('chatId');
      const myChatIds = myChats.map(c => c.chatId);

      // Karşı tarafın olduğu ve benim de olduğum ortak sohbeti bul (Hem private olan)
      const existingChat = await Chat.findOne({
        _id: { $in: myChatIds },
        type: 'private'
      });

      if (existingChat) {
        // Zaten aramızda bir sohbet varsa var olanı döndür
        const existingMembers = await ChatMember.find({ chatId: existingChat._id, userId: { $in: allMembers }});
        // İkisi de bu sohbetteyse, var olanı dön
        if (existingMembers.length === 2) {
          return successResponse(res, 200, 'Mevcut sohbet getirildi', existingChat);
        }
      }
    }

    // Yeni Sohbet oluştur
    const newChat = await Chat.create({
      type: type || 'private',
      title: type === 'group' ? title : '',
      ownerId: type === 'group' ? req.user._id : null,
    });

    // ChatMembers oluştur
    const membersData = allMembers.map(userId => ({
      chatId: newChat._id,
      userId,
      role: userId === req.user._id.toString() && type === 'group' ? 'admin' : 'member'
    }));
    await ChatMember.insertMany(membersData);

    return successResponse(res, 201, 'Sohbet başarıyla oluşturuldu', newChat);
  } catch (error) {
    next(error);
  }
};

// @desc    Sohbetin geçmiş mesajlarını getir (Cursor Pagination destekli)
// @route   GET /api/chats/:id/messages
exports.getMessages = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { cursor, limit = 20 } = req.query;

    // Kullanıcının bu sohbette olup olmadığını kontrol et
    const membership = await ChatMember.findOne({ chatId, userId: req.user._id });
    if (!membership) {
      return errorResponse(res, 403, 'Bu sohbetin mesajlarını görme yetkiniz yok', 'FORBIDDEN');
    }

    let query = { chatId, deletedAt: null };

    // Cursor (Son görülen mesajın tarihi) var ise, ondan öncekileri (daha eski) getir
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'name surname username profilePhoto')
      .lean();

    // Mesajlar tersten gelir (en yeni en üstte), UI için eski->yeni yapılabilir
    
    // Yeni cursor belirle (en son dönen mesajın tarihi bir sonraki cursor olur)
    let nextCursor = null;
    if (messages.length === parseInt(limit)) {
      nextCursor = messages[messages.length - 1].createdAt;
    }

    return successResponse(res, 200, 'Mesajlar getirildi', messages, { nextCursor });
  } catch (error) {
    next(error);
  }
};
