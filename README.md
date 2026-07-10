# Postmande test yapmak için:

## AUTH MODÜLÜ

### 1. Register

POST http://localhost:3000/api/auth/register

Body: Raw JSON

{
  "name": "Ahmet",
  "surname": "Yılmaz",
  "username": "ahmetyilmaz",
  "email": "ahmet@ornek.com",
  "password": "sifre123"
}


### 2. Login

POST http://localhost:3000/api/auth/login

Body Raw JSON:

{
  "username": "ahmetyilmaz",
  "password": "sifre123"
}


### 3. Forgot Password

POST http://localhost:3000/api/auth/forgotpassword

Body Raw JSON:

{
  "email": "ahmet@ornek.com"
}


### 4. Reset Password

POST http://localhost:3000/api/auth/resetpassword/{forgot_password_sonrası_gelen_token}

Body Raw JSON:

{
  "password": "yeniSifre456"
}


### 5. Verify Email

GET http://localhost:3000/api/auth/verifyemail/TERMINALE_DUSEN_ONAY_TOKENI

Auth: Yok
Body: Yok


### 6. Logout

POST http://localhost:3000/api/auth/logout

Auth: Yok
Body:
Raw JSON:
{
  "refreshToken": "GİRİŞ_YAPTIĞINIZDA_SİZE_VERİLEN_REFRESH_TOKEN_BURAYA"
}
------------------------

## USER (TEST) MODÜLÜ

### 1. Get All Users

GET http://localhost:3000/api/users/all

Auth: Yok

Body: Yok

### 2. Delete User From DB

DELETE http://localhost:3000/api/users/{silinecek_user_id}

Auth: Yok
Body: Yok

------------------------

## CHAT MODÜLÜ

### 1. Create Chat with Someone

POST  http://localhost:3000/api/chats

Auth: Bearer Token

Body:
{
  "type": "private",
  "memberIds": ["SOHBET_EDILECEK_KISININ_ID_SI"]
}


### 2. List My Chats

GET http://localhost:3000/api/chats

Auth: Yok
Body: Yok

### 3. Get Messages A Chat

GET  http://localhost:3000/api/chats/SOHBETIN_ID_SI/messages?limit=20

Auth: Bearer Token
Body: Yok




------------------------

## USER MODÜLÜ

### 1. Discover Users

GET http://localhost:3000/api/discoverusers

Auth: Bearer Token

Body: Yok(çünkü GET isteği atılıyor.)

------------------------

## WEBSOCKET MODÜLÜ (REALTIME)

*** Dinlenilmesi gereken eventları events sekmesine yazmak gerek. Join room ya da send message gibi eventlar dinlenilmeye ihtiyaç duymadığı için yalnızca Response bölümünün içindeki event name kısmına eklenip send edilmesi yeterlidir.

Postman'de `New -> SOCKET.io` diyerek yeni bir sekme açın.

### 🔌 Bağlantı Kurulumu (Connection)
- **URL:** `ws://localhost:3000`
- **Headers:** `Authorization` -> `Bearer SİZİN_ACCESS_TOKENINIZ`
- **İşlem:** *Connect* butonuna basarak bağlanın. (Konsolda yeşil "Connected" yazısını görün).

### 1. Yeni Bir Odaya Dinamik Katılma (Join Room)
Eğer siz bağlandıktan sonra yeni bir sohbet oluşturulduysa o odaya katılmak için:
- **Event Name:** `join_room`
- **JSON Body:**
```json
{
  "chatId": "SOHBET_ODASININ_ID_SI"
}
```

### 2. Mesaj Gönderme (Send Message)
- **Event Name:** `send_message`
- **JSON Body:**
```json
{
  "tempId": "gecici-123",
  "chatId": "SOHBET_ODASININ_ID_SI",
  "content": "Merhaba!"
}
```

### 3. Gelen Mesajı Dinleme
Karşı tarafın attığı mesajları görebilmek için:
- **Events (Listen) Bölümüne Yazın:** `message.created`
- **DİKKAT:** Listen anahtarı (toggle) AÇIK (mavi) olmalıdır!

### 4. Yazıyor... (Typing) Bildirimi Gönderme
- **Event Name:** `typing`
- **JSON Body:**
```json
{
  "chatId": "SOHBET_ODASININ_ID_SI",
  "isTyping": true
}
```
*(Yazmayı bırakınca `isTyping: false` olarak gönderin)*

### 5. Karşı Tarafın "Yazıyor..." Bildirimini Dinleme
- **Events (Listen) Bölümüne Yazın:** `user.typing`
- **DİKKAT:** Listen anahtarı (toggle) AÇIK (mavi) olmalıdır!

### 6. Okundu (Mavi Tık) Bilgisi Gönderme
- **Event Name:** `mark_read`
- **JSON Body:**
```json
{
  "chatId": "SOHBET_ODASININ_ID_SI",
  "messageId": "OKUDUGUNUZ_MESAJIN_ID_SI"
}
```

### 7. Karşı Tarafın "Okundu" Bildirimini Dinleme
Sizin attığınız mesaj karşı tarafta okunduğunda size gelecek olan olay:
- **Events (Listen) Bölümüne Yazın:** `message.read`
- **DİKKAT:** Listen anahtarı (toggle) AÇIK (mavi) olmalıdır!

------------------------

## FRIENDSHIP MODÜLÜ (Arkadaşlık Sistemi)

*Tüm rotalar için Auth: Bearer Token zorunludur.*

### 1. Arkadaş Listesini Getir
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/friends`
- **Body:** Yok

### 2. Bana Gelen (Bekleyen) İstekleri Gör
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/friends/pending`
- **Body:** Yok

### 3. Arkadaşlık İsteği Gönder
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/friends/request/KARSI_TARAFIN_USER_IDSI`
- **Body:** Yok

### 4. İsteği Cevapla (Kabul veya Red)
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/friends/respond/FRIENDSHIP_ID` *(Bekleyen istekler rotasından dönen `requestId`)*
- **Body:** raw (JSON)
```json
{
  "status": "accepted" 
}
```
*(Reddetmek için `"rejected"` yazın)*

### 5. Arkadaşlıktan Çıkar / İsteği İptal Et
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/friends/FRIENDSHIP_ID`
- **Body:** Yok

------------------------

## BLOCK & PRIVACY MODÜLÜ (Engelleme ve Gizlilik)

*Tüm rotalar için Auth: Bearer Token zorunludur.*

### 1. Kullanıcıyı Engelle (Block)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/blocks/KARSI_TARAFIN_USER_IDSI`
- **Body:** Yok

### 2. Engeli Kaldır
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/blocks/KARSI_TARAFIN_USER_IDSI`
- **Body:** Yok

### 3. Engellediğim Kişileri Listele
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/blocks`
- **Body:** Yok

### 4. Gizlilik Ayarlarımı Güncelle
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/discoverusers/privacy`
- **Body:** raw (JSON)
```json
{
  "lastSeen": "nobody", 
  "profilePhoto": "friends"
}
```
*(Seçenekler: "everyone", "friends", "nobody")*

------------------------

## QR MODÜLÜ (Karekod İşlemleri)

*Tüm rotalar için Auth: Bearer Token zorunludur.*

### 1. Profilim İçin QR Üret (5 Dk Ömürlü)
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/qr/generate`
- **Body:** Yok

### 2. Başkasının QR'ını Tara (Profilini Görüntüle)
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/qr/scan/URETILEN_32_KARAKTERLIK_TOKEN_BURAYA`
- **Body:** Yok
