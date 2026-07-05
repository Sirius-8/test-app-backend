require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const errorHandler = require('./src/middlewares/error.middleware');

// Veritabanına bağlan
connectDB();

const app = express();

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

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// HTTP sunucusunu oluştur
const server = http.createServer(app);

// Socket.io'yu HTTP sunucusuna bağla
const io = new Server(server, {
  cors: {
    origin: "*", // Geliştirme aşamasında tüm originlere izin veriyoruz
  }
});

// Socket.io bağlantı dinleyicisi
io.on('connection', (socket) => {
  console.log(`Socket.io - Yeni bir kullanıcı bağlandı: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket.io - Kullanıcı ayrıldı: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışmaya başladı.`);
});
