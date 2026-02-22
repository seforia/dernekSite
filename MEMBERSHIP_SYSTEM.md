# Üyelik Onay Sistemi - Kullanım Kılavuzu

## 🎯 Genel Bakış

Sitenizde artık **üyelik onay sistemi** aktif! Kullanıcılar kayıt olabilir, ancak sadece sizin onayınızla üye olup yazı ekleyebilirler.

## 📋 Sistem Özellikleri

### ✅ Ne Yapabilirler
- Herkes kayıt formunu doldurabilir
- Herkes yazıları ve yorumları görüntüleyebilir
- Onaylı üyeler yazı ve yorum ekleyebilir
- Her üye sadece kendi yazılarını düzenleyebilir/silebilir

### ⚠️ Onay Gerektiren İşlemler
- Yazı ekleme → Onaylı üye gerekli
- Yorum yapma → Onaylı üye gerekli
- Giriş yapma → Onaylanmış hesap gerekli

## 🚀 Kullanım Adımları

### 1. Yeni Üye Kaydı

**Kullanıcı tarafı:**
1. Site menüsünde **Üyelik → Kayıt Ol** tıklayın
2. Kayıt formunu doldurun (Ad, Soyad, Email, Şifre)
3. "Kayıt Ol" butonuna basın
4. ✅ **Başarılı mesajı**: "Hesabınız yönetici onayı bekliyor"

### 2. Admin Onayı (Sizin işleminiz)

**Admin tarafı:**
1. Yönetici olarak giriş yapın
2. Tarayıcıda şu adresi açın: 
   ```
   http://localhost:5501/#admin
   ```
   veya
   ```
   https://yourusername.github.io/tsgldernegi/#admin
   ```
3. **"Bekleyen Başvurular"** sekmesinde yeni üyeleri görürsünüz
4. Her üye için:
   - ✅ **Onayla** → Üye sisteme giriş yapabilir
   - ❌ **Reddet** → Üye giriş yapamaz

### 3. Üye Girişi

**Kullanıcı tarafı (onaydan sonra):**
1. Site menüsünde **Üyelik → Giriş Yap** tıklayın
2. Email ve şifre ile giriş yapın
3. ✅ Onaylandıysa → Ana sayfaya yönlendirilir
4. ❌ Henüz onaylanmadıysa → "Hesabınız onay bekliyor" hatası

### 4. Yazı Ekleme

**Onaylı üye:**
1. **Duyurular → Yazılar** sayfasına gidin
2. "Yeni Yazı Ekle" butonunu tıklayın
3. Yazı formunu doldurun
4. "Yayınla" butonuna basın

## 🔐 Admin Paneli Kullanımı

### Erişim
```
Site URL + /#admin
```

### Sekmeler

#### 📋 Bekleyen Başvurular
- Henüz onaylanmamış/reddedilmemiş üyeler
- Her üye için: Ad, Email, Kayıt Tarihi
- Eylemler: Onayla / Reddet

#### ✅ Onaylanmış Üyeler
- Sisteme giriş yapabilen üyeler
- Onay tarihi gösterilir

#### ❌ Reddedilen Başvurular
- Reddedilen başvurular
- Red tarihi gösterilir

#### 👥 Tüm Kullanıcılar
- Sistemdeki tüm kullanıcılar
- Durum filtreleme yapmadan tümü

## ⚙️ Firebase Ayarları

### 1. Firestore Rules Güncellemesi

**ÖNEMLİ**: Sistemi aktif etmek için Firestore rules'ını güncellemelisiniz:

1. [Firebase Console](https://console.firebase.google.com/) → **tsgld-9d385** projesini açın
2. **Firestore Database** → **Rules** sekmesi
3. [FIRESTORE_APPROVAL_RULES.md](FIRESTORE_APPROVAL_RULES.md) dosyasındaki kuralları kopyalayın
4. Rules editörüne yapıştırın
5. **Publish** butonuna tıklayın

### 2. Admin Kullanıcıları Tanımlama

**Üretim ortamı için önemli!**

Şu anda geliştirme modunda herkes admin. Production'da:

1. Firebase Console → **Authentication** → **Users**
2. Admin yapmak istediğiniz kullanıcının **UID**'sini kopyalayın
3. Firestore Rules'da `isAdmin()` fonksiyonunu güncelleyin:

```javascript
function isAdmin(uid) {
  return uid in [
    'SIZIN_UID_BURADA',     // Sizin admin hesabınız
    'DIGER_ADMIN_UID'       // Diğer adminler (varsa)
  ];
}
```

## 🎨 Sayfa Linkleri

### Navigasyon
- **Kayıt Sayfası**: `/#kayit` veya `/#kayit.html`
- **Giriş Sayfası**: `/#giris` veya `/#giris.html`
- **Admin Paneli**: `/#admin` veya `/#admin.html`

### Menü Konumları
- Ana header → Sağ üst → "Üyelik" dropdown
- Mobil menü → "📝 Kayıt Ol" ve "🔐 Giriş Yap"

## 🛠️ Teknik Detaylar

### Dosya Yapısı
```
content/
├── kayit/
│   ├── index.html          # Kayıt formu
│   └── kayit.js           # Form işleyici
├── giris/
│   ├── index.html          # Giriş formu
│   └── giris.js           # Giriş işleyici
└── admin/
    ├── index.html          # Admin paneli UI
    └── admin.js           # Admin işlevleri

assets/js/
└── auth.js                 # Firebase auth + approval logic
```

### Auth.js Fonksiyonları
```javascript
// Kayıt
TSGLAuth.signUp({ name, email, password })

// Giriş (approval check ile)
TSGLAuth.login({ email, password })

// Admin fonksiyonları
TSGLAuth.getUsersPendingApproval()
TSGLAuth.getAllUsers()
TSGLAuth.approveUser(uid)
TSGLAuth.rejectUser(uid)
TSGLAuth.checkUserApproval()
TSGLAuth.getUserStatus(uid)
```

## 🧪 Test Senaryosu

### 1. Yeni Üye Kaydı Testi
```
1. /#kayit sayfasını aç
2. Form doldur: test@example.com / 123456
3. "Kayıt Ol" butonuna bas
4. Beklenen: "Yönetici onayı bekliyor" mesajı
```

### 2. Onaysız Giriş Testi
```
1. /#giris sayfasını aç
2. Kayıtlı (ama onaysız) email/şifre gir
3. "Giriş Yap" butonuna bas
4. Beklenen: "Hesabınız onay bekliyor" hatası
```

### 3. Admin Onay Testi
```
1. /#admin sayfasını aç
2. "Bekleyen Başvurular" sekmesinde test kullanıcısını gör
3. "Onayla" butonuna bas
4. Beklenen: Kullanıcı "Onaylanmış Üyeler" sekmesine taşınır
```

### 4. Onaylı Giriş Testi
```
1. /#giris sayfasını aç
2. Onaylanmış email/şifre gir
3. "Giriş Yap" butonuna bas
4. Beklenen: Ana sayfaya yönlendirilir
```

### 5. Yazı Ekleme Testi
```
1. Onaylı kullanıcı ile giriş yap
2. Yazılar sayfasına git
3. "Yeni Yazı Ekle" butonuna tıkla
4. Yazı ekle ve yayınla
5. Beklenen: Yazı başarıyla eklenir
```

## ❓ Sık Sorulan Sorular

### Kullanıcı şifresini unutursa?
→ Şu anda password reset yok. Manuel olarak Firebase Console'dan password reset email gönderebilirsiniz.

### Onaylı kullanıcıyı geri nasıl alabilirim?
→ Admin panelinde şu an sadece onay/red var. Manuel olarak Firestore'dan status değiştirebilirsiniz.

### Admin paneli herkese açık mı?
→ Şu anda giriş yapmış herkes erişebiliyor (geliştirme modu). Production'da Firestore rules'da admin UID'lerini tanımlayın.

### Kaç tane admin olabilir?
→ Sınırsız. Firestore rules'daki isAdmin() fonksiyonuna istediğiniz kadar UID ekleyebilirsiniz.

## 🚨 Önemli Güvenlik Notları

1. **Production öncesi**: Firestore rules'da admin UID'lerini tanımlayın
2. **Strong Passwords**: Kullanıcılardan güçlü şifre isteyin (şu an min 6 karakter)
3. **Email Verification**: İsteğe bağlı - Firebase'de email verification aktif edebilirsiniz
4. **Rate Limiting**: Spam önleme için Firebase App Check kullanabilirsiniz

## 📞 Yardım

Sorun yaşarsanız:
1. Browser console'u kontrol edin (F12 → Console)
2. Firebase Console → Firestore → Rules'ın publish edildiğinden emin olun
3. Admin panelinde authentication durumunuzu kontrol edin
