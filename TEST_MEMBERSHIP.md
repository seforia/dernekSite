# Üyelik Sistemi Test Senaryosu

## 📋 Adım Adım Test

### 1️⃣ Firebase Rules Güncellemesi

**[Firebase Console](https://console.firebase.google.com/)** → **tsgld-9d385** projesine gidin

1. **Firestore Database** → **Rules** sekmesine tıklayın
2. Aşağıdaki kuralları kopyalayın ve yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isLoggedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isApprovedUser(uid) {
      return exists(/databases/$(database)/documents/users/$(uid)) &&
             get(/databases/$(database)/documents/users/$(uid)).data.status == 'approved';
    }

    function isAdmin(uid) {
      return uid in [
        'BURAYA_ADMIN_UID_YAZ'
      ];
    }

    // POSTS
    match /posts/{postId} {
      allow read: if true;

      allow create: if isLoggedIn() && isApprovedUser(request.auth.uid);

      allow update, delete: if isLoggedIn() &&
                            request.auth.uid == resource.data.userId;
    }

    // COMMENTS
    match /comments/{commentId} {
      allow read: if true;

      allow create: if isLoggedIn() && isApprovedUser(request.auth.uid);

      allow delete: if isLoggedIn() &&
                     request.auth.uid == resource.data.userId;
    }

    // USERS
    match /users/{userId} {

      allow read: if true;

      // Yeni kayıt (pending ile)
      allow create: if isLoggedIn() &&
                    isOwner(userId) &&
                    request.resource.data.status == 'pending';

      // Kullanıcı kendi bilgilerini güncelleyebilir
      // AMA status değiştiremez
      allow update: if isLoggedIn() &&
                    isOwner(userId) &&
                    request.resource.data.status == resource.data.status;

      // Admin onay işlemi
      allow update: if isLoggedIn() &&
                    isAdmin(request.auth.uid);
    }
  }
}
```

3. **Publish** butonuna tıklayın
4. Onay popup'ında tekrar **Publish** tıklayın

---

### 2️⃣ Test Kullanıcısı 1 Kaydı (Pending)

1. Siteyi açın: `http://127.0.0.1:5501`
2. Üst banner'da **"Giriş Yap"** butonuna tıklayın (veya Header → Üye Girişi)
3. Sayfayı aşağı kaydırın ve **"Yeni Üye Ol"** bölümünü bulun
4. Kayıt formunu doldurun:
   - **Ad Soyad**: Test Kullanıcı
   - **E-posta**: test1@example.com
   - **Şifre**: 123456
   - **Şifre Tekrar**: 123456
5. **Üye Ol** butonuna tıklayın
6. Başarılı mesajı görmelisiniz: ✅ "Kayıt başarılı! Hesabınız yönetici onayı bekliyor."

**Beklenen Sonuç**: Kullanıcı oluşturuldu ama `status: 'pending'`

---

### 3️⃣ Onaysız Giriş Denemesi (Başarısız)

1. Sayfayı yukarı kaydırın ve **"Giriş Yap"** bölümünü bulun
2. Giriş yapın:
   - **E-posta**: test1@example.com
   - **Şifre**: 123456
3. **Giriş Yap** butonuna tıklayın

**Beklenen Sonuç**: ❌ "Hesabınız onay bekliyor. Yönetici onayından sonra giriş yapabileceksiniz."

---

### 4️⃣ Admin Kullanıcısı Oluşturma

İlk admin kullanıcıyı manuel oluşturacağız:

1. **Firebase Console** → **Authentication** → **Users** → **Add User**
2. Admin bilgilerini girin:
   - **Email**: admin@tsgl.org
   - **Password**: admin123456
3. **Add User** butonuna tıklayın
4. Oluşturulan kullanıcının **User UID**'sini kopyalayın (örnek: `abc123def456...`)

5. **Firestore Database** → **+ Start Collection** → Collection ID: `users` → **Next**
6. Document ID: Yukarıda kopyaladığınız **User UID**'yi yapıştırın
7. Alanları ekleyin:
   ```
   Field: uid          Type: string     Value: [User UID]
   Field: name         Type: string     Value: Admin
   Field: email        Type: string     Value: admin@tsgl.org
   Field: status       Type: string     Value: approved
   Field: createdAt    Type: timestamp  Value: [şimdiki zaman]
   ```
8. **Save** butonuna tıklayın

---

### 5️⃣ Admin UID'sini Rules'a Ekleme

1. **Firestore Database** → **Rules** sekmesine tekrar gidin
2. `isAdmin()` fonksiyonunu güncelleyin:

```javascript
function isAdmin(uid) {
  return uid in [
    'abc123def456...'  // Yukarıda kopyaladığınız admin UID'sini buraya yapıştırın
  ];
}
```

3. **Publish** butonuna tıklayın

---

### 6️⃣ Admin Girişi ve Onay İşlemi

1. Siteyi yenileyin: `http://127.0.0.1:5501`
2. **Giriş Yap** → Admin bilgileri ile giriş yapın:
   - **E-posta**: admin@tsgl.org
   - **Şifre**: admin123456
3. Giriş başarılı olmalı

4. **Admin Paneline** gidin:
   - URL'ye manuel yazın: `http://127.0.0.1:5501/#admin`
   - veya `http://127.0.0.1:5501/index.html#admin`

5. **"Bekleyen Başvurular"** sekmesinde `test1@example.com` kullanıcısını görmelisiniz

6. **✓ Onayla** butonuna tıklayın
7. Onay mesajında **OK** tıklayın
8. Kullanıcı **"Onaylanmış Üyeler"** sekmesine taşınmalı

**Beklenen Sonuç**: Test kullanıcısının `status` alanı `approved` olarak güncellendi

---

### 7️⃣ Onaylı Kullanıcı Girişi (Başarılı)

1. Çıkış yapın (eğer logout butonu yoksa browser'ın Developer Tools → Application → Storage → Clear Site Data)
2. **Giriş Yap** → Test kullanıcısı ile giriş yapın:
   - **E-posta**: test1@example.com
   - **Şifre**: 123456
3. **Giriş Yap** butonuna tıklayın

**Beklenen Sonuç**: ✅ Giriş başarılı! Ana sayfaya yönlendirildiniz.

---

### 8️⃣ Yazı Ekleme Testi (Onaylı Kullanıcı)

1. **Yazılar** sayfasına gidin: Header → Duyurular → Yazılar
2. **+ Yeni Yazı** butonuna tıklayın
3. Yazı bilgilerini girin:
   - **Başlık**: Test Yazısı
   - **Kategori**: Genel
   - **Görsel**: Bir resim seçin
   - **İçerik**: Lorem ipsum...
4. **Yayınla** butonuna tıklayın

**Beklenen Sonuç**: ✅ Yazı başarıyla yayınlandı ve listede görünüyor

---

### 9️⃣ Reddetme Testi (Opsiyonel)

1. Yeni bir test kullanıcısı kaydedin: test2@example.com
2. Admin paneline gidin: `#admin`
3. test2@example.com kullanıcısını bulun
4. **✗ Reddet** butonuna tıklayın
5. test2@example.com ile giriş yapmayı deneyin

**Beklenen Sonuç**: ❌ "Hesabınız reddedildi. Daha fazla bilgi için iletişime geçiniz."

---

## ✅ Test Checklist

- [ ] Firebase Rules güncellendi ve publish edildi
- [ ] Test kullanıcısı kayıt oldu (pending)
- [ ] Onaysız giriş başarısız oldu
- [ ] Admin kullanıcısı oluşturuldu
- [ ] Admin UID rules'a eklendi
- [ ] Admin paneli açıldı ve bekleyen kullanıcı görüldü
- [ ] Test kullanıcısı onaylandı
- [ ] Onaylı kullanıcı giriş yaptı
- [ ] Onaylı kullanıcı yazı ekleyebildi
- [ ] Reddedilen kullanıcı giriş yapamadı

---

## 🐛 Sorun Giderme

### "Missing or insufficient permissions" Hatası
- Firebase Rules'ın publish edildiğinden emin olun
- Browser cache'i temizleyin (Ctrl+Shift+R)
- Console'da detaylı hatayı kontrol edin

### Admin Paneli Boş
- Admin olarak giriş yaptığınızdan emin olun
- Firebase Console → Firestore → users collection'ını kontrol edin
- Console'da JavaScript hatalarını kontrol edin

### Giriş Yapamıyorum
- E-posta ve şifre doğru mu kontrol edin
- Firebase Console → Authentication → Users'da kullanıcıyı arayın
- Status: 'approved' olduğundan emin olun

### Yazı Ekleyemiyorum
- Kullanıcı onaylı mı? (Admin panelinden kontrol edin)
- Console'da "permission-denied" hatası var mı?
- Rules'da `isApprovedUser()` kontrolü doğru çalışıyor mu?

---

## 🎯 Sonuç

Tüm testler başarılıysa sistem hazır! Production'a deploy etmeden önce:

1. Admin UID'lerini güvenli bir yerde saklayın
2. Test kullanıcılarını silin
3. Gerçek admin e-postalarını kullanın
4. Rate limiting ekleyin (opsiyonel)
