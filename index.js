require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Socket.IO için http sunucusu
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const chatRoutes = require('./src/routes/chat.routes');
const userRoutes = require('./src/routes/user.routes');
const friendshipRoutes = require('./src/routes/friendship.routes');
const blockRoutes = require('./src/routes/block.routes');
const qrRoutes = require('./src/routes/qr.routes');
const errorHandler = require('./src/middlewares/error.middleware');
const initializeSockets = require('./src/sockets/socket'); // Yeni Socket Handler

// Veritabanına bağlan
connectDB();

const app = express();

// Socket.IO'yu Express ile aynı portta çalıştırmak için HTTP sunucusuna sarıyoruz
const server = http.createServer(app);

// Socket.IO'yu başlat
initializeSockets(server);

// CORS (Sadece izinli origin, method ve credentials - Standartlara uygun)
const corsOptions = {
  origin: process.env.CLIENT_URL || '*', // Prodüksiyonda uygulamanızın gerçek adresi yazılır
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Gelen JSON formatındaki istekleri parse etmek için
app.use(express.json());

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/discoverusers', userRoutes);
app.use('/api/friends', friendshipRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/qr', qrRoutes);

// Test rotası
app.get('/', (req, res) => {
  res.send('Flutter Backend API Çalışıyor...');
});

// Sağlık kontrolü (Health Check) rotası
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Sistem sağlıklı çalışıyor.',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Hata yakalama middleware'i (Tüm rotalardan sonra gelmeli)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n=============================================`);
  console.log(`🚀 Sunucu ${PORT} portunda çalışmaya başladı.`);
  console.log(`⚡ HTTP & WebSocket Aktif`);
  console.log(`=============================================\n`);
});
