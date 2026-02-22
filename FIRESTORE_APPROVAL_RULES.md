# Firestore Security Rules - Üyelik Onay Sistemi

## Güncellenmiş Kurallar

Firebase Console → **Firestore Database** → **Rules** sekmesine gidin ve aşağıdaki kuralları yapıştırın:

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

## Önemli Notlar

### Admin Kullanıcıları Tanımlama

1. Firebase Console → **Authentication** → **Users** sekmesine gidin
2. Admin yapmak istediğiniz kullanıcının **User UID**'sini kopyalayın
3. Rules'daki `isAdmin()` fonksiyonunu güncelleyin:

```javascript
function isAdmin(uid) {
  return uid in [
    'ABC123DEF456',  // Admin 1 UID
    'XYZ789GHI012',  // Admin 2 UID
    // Diğer admin UID'leri
  ];
}
```

### Güvenlik Özellikleri

✅ **Üyelik Onayı**: Sadece `status: 'approved'` olan kullanıcılar yazı/yorum ekleyebilir
✅ **Kayıt Sistemi**: Herkes kayıt olabilir, ama `pending` status ile başlar
✅ **Admin Kontrolü**: Sadece admin kullanıcılar onay/red yapabilir
✅ **Profil Koruma**: Kullanıcılar kendi status'lerini değiştiremez
✅ **Public Read**: Yazılar ve yorumlar herkese açık

### Hızlı Test İçin

Geliştirme sırasında tüm giriş yapmış kullanıcıların admin olmasını istiyorsanız (mevcut hali):

```javascript
function isAdmin(uid) {
  return request.auth != null;
}
```

Production'da mutlaka değiştirin:

```javascript
function isAdmin(uid) {
  return uid in ['GERÇEK_ADMIN_UID'];
}
```

## Kullanım Akışı

1. **Kayıt**: Kullanıcı kayıt olur → `status: 'pending'` 
2. **Onay Bekleme**: Admin panelinde görünür
3. **Admin Onayı**: Admin onaylar → `status: 'approved'`
4. **Giriş**: Kullanıcı tekrar giriş yapar, artık yazı yazabilir
5. **Yazı Ekleme**: Sadece approved kullanıcılar yazı ekleyebilir

## Sorun Giderme

### "Missing or insufficient permissions" Hatası

- Rules'ın publish edildiğinden emin olun
- Browser cache'i temizleyin (Ctrl+Shift+Delete)
- Firebase Console → Firestore → Rules → Simulator ile test edin

### Kullanıcı Status Değiştiremiyorum

- `isAdmin()` fonksiyonunda kendi UID'nizi eklediğinizden emin olun
- Admin panelinde giriş yaptığınızdan emin olun
- Console'da Firebase Auth hatalarını kontrol edin
