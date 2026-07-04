require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');

// Veritabanına bağlan
connectDB();

const app = express();

// Gelen JSON formatındaki istekleri parse etmek için
app.use(express.json());

// API Rotaları
app.use('/api/auth', authRoutes);

// Test rotası
app.get('/', (req, res) => {
  res.send('Flutter Backend API Çalışıyor...');
});

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
