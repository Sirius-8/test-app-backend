const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ChatMember = require('../models/chatMember.model');
const Message = require('../models/message.model');

let io;

const initializeSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*', // Sadece belirli istemcilere izin ver
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket Auth Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      
      if (!token) {
        return next(new Error('Yetkilendirme Hatası: Token bulunamadı'));
      }

      // 'Bearer ' prefix'i varsa temizle
      const tokenStr = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

      const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Yetkilendirme Hatası: Kullanıcı bulunamadı'));
      }

      // Kullanıcıyı socket nesnesine kaydet
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Yetkilendirme Hatası: Geçersiz veya süresi dolmuş token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`⚡ WebSocket bağlandı: ${socket.user.username} (Socket ID: ${socket.id})`);

    // 1. Kullanıcının Kendi Kişisel Odasına Katılması (user:{id})
    // Bu oda, ona özel bildirimler (Örn: Yeni sohbet isteği) yollamak içindir
    const personalRoom = `user:${socket.user._id}`;
    socket.join(personalRoom);

    // 2. Kullanıcının Üye Olduğu Tüm Sohbet Odalarına Katılması (chat:{chatId})
    const myChats = await ChatMember.find({ userId: socket.user._id }).select('chatId');
    myChats.forEach(chat => {
      socket.join(`chat:${chat.chatId}`);
    });

    // Kullanıcı online oldu bilgisini diğerlerine yayınla
    await User.findByIdAndUpdate(socket.user._id, { status: 'online' });
    io.emit('user.online', { userId: socket.user._id, status: 'online' });

    // --- EVENTLER ---

    // Mesaj Gönderme ve ACK Mekanizması
    socket.on('send_message', async (data, callback) => {
      try {
        const { tempId, chatId, content, type = 'text' } = data;

        // Kullanıcı bu sohbetin üyesi mi?
        const isMember = await ChatMember.findOne({ chatId, userId: socket.user._id });
        if (!isMember) {
          if(callback) callback({ status: 'error', message: 'Yetkisiz işlem' });
          return;
        }

        // Mesajı Veritabanına Yaz
        const newMessage = await Message.create({
          chatId,
          senderId: socket.user._id,
          content,
          type
        });

        // 1. Mesajı atan istemciye (Client) başarılı (ACK) bilgisini gerçek _id ile dön
        if (callback) {
          callback({
            status: 'ok',
            tempId, // Client'ın yolladığı geçici ID (Eşleştirme için)
            message: newMessage // DB'de oluşan gerçek mesaj verisi (_id ile)
          });
        }

        // 2. Mesajı odadaki DİĞER kullanıcılara yayınla
        socket.to(`chat:${chatId}`).emit('message.created', {
          chatId,
          message: newMessage
        });

        // Sohbetin lastMessageAt tarihini güncelle
        const Chat = require('../models/chat.model');
        await Chat.findByIdAndUpdate(chatId, { lastMessageAt: new Date() });

      } catch (error) {
        if(callback) callback({ status: 'error', message: 'Mesaj gönderilemedi' });
      }
    });

    // Yazıyor... (Typing)
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat:${chatId}`).emit('user.typing', {
        chatId,
        userId: socket.user._id,
        isTyping
      });
    });

    // Mesaj Okundu Bilgisi (Read Receipt)
    socket.on('mark_read', async (data) => {
      const { chatId, messageId } = data;
      
      // DB'de kullanıcının lastReadMessageId bilgisini güncelle
      await ChatMember.findOneAndUpdate(
        { chatId, userId: socket.user._id },
        { lastReadMessageId: messageId }
      );

      // Diğer üyelere okundu bilgisini yayınla
      socket.to(`chat:${chatId}`).emit('message.read', {
        chatId,
        userId: socket.user._id,
        messageId
      });
    });

    // Çıkış (Disconnect)
    socket.on('disconnect', async () => {
      console.log(`❌ WebSocket ayrıldı: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, { status: 'offline', lastSeen: new Date() });
      io.emit('user.offline', { userId: socket.user._id, status: 'offline', lastSeen: new Date() });
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io başlatılmamış!');
  }
  return io;
};

module.exports = initializeSockets;
module.exports.getIo = getIo;
