require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Session = require('../models/session.model');

// Veritabanına bağlan
mongoose.connect(process.env.MONGO_URI);

const users = [
  {
    name: 'Ahmet',
    surname: 'Yılmaz',
    username: 'ahmetyilmaz',
    email: 'ahmet@ornek.com',
    password: 'password123',
    isEmailVerified: true
  },
  {
    name: 'Ayşe',
    surname: 'Demir',
    username: 'aysedemir',
    email: 'ayse@ornek.com',
    password: 'password123',
    isEmailVerified: true
  },
  {
    name: 'Mehmet',
    surname: 'Kaya',
    username: 'mehmetkaya',
    email: 'mehmet@ornek.com',
    password: 'password123',
    isEmailVerified: true
  }
];

const importData = async () => {
  try {
    // Önce tüm verileri temizle
    await User.deleteMany();
    await Chat.deleteMany();
    await Message.deleteMany();
    await Session.deleteMany();

    // Kullanıcıları ekle
    const createdUsers = await User.create(users);

    // İlk iki kullanıcıyı (Ahmet ve Ayşe) arkadaş yapalım
    createdUsers[0].friends.push(createdUsers[1]._id);
    createdUsers[1].friends.push(createdUsers[0]._id);
    await createdUsers[0].save();
    await createdUsers[1].save();

    console.log('Veriler Başarıyla İçeri Aktarıldı (Seeded)!');
    process.exit();
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Chat.deleteMany();
    await Message.deleteMany();
    await Session.deleteMany();

    console.log('Veriler Silindi (Destroyed)!');
    process.exit();
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
