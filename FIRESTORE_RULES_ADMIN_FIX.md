# Firestore Kuralları - Admin Onay Fix

## Sorun
"Missing or insufficient permissions" hatası alınıyor çünkü admin UID'si doğru ayarlanmamış.

## Çözüm

Firebase Console → **Firestore Database** → **Rules** sekmesine gidin ve **TÜM** kuralları aşağıdakiyle değiştirin:

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

    // Admin UID
    function isAdmin(uid) {
      return uid in ['2iN63xcdOGUNQJWp3Ia4ws0EYys2'];  // Sadece admin
    }

    // ===== POSTS =====
    match /posts/{postId} {
      allow read: if true;
      allow create: if isLoggedIn() && isApprovedUser(request.auth.uid);
      // Herkes viewCount güncelleyebilir
      allow update: if isLoggedIn();
      allow delete: if isLoggedIn() && request.auth.uid == resource.data.userId;
    }

    // ===== COMMENTS =====
    match /comments/{commentId} {
      allow read: if true;
      allow create: if isLoggedIn() && isApprovedUser(request.auth.uid);
      allow delete: if isLoggedIn() && request.auth.uid == resource.data.userId;
    }

    // ===== LIKES =====
    match /likes/{likeId} {
      allow read: if true;
      allow create: if isLoggedIn();
      allow delete: if isLoggedIn() && request.auth.uid == resource.data.userId;
    }

    // ===== USERS =====
    match /users/{userId} {
      allow read: if true;

      // Yeni kayıt
      allow create: if isLoggedIn() && 
                       isOwner(userId) && 
                       request.resource.data.status == 'pending';

      // Kullanıcı kendi profil bilgilerini güncelleyebilir (status hariç)
      allow update: if isLoggedIn() && 
                       isOwner(userId) && 
                       request.resource.data.status == resource.data.status;

      // Admin: user status güncelleyebilir
      allow update: if isAdmin(request.auth.uid);
    }
  }
}
```

## Adımlar

1. **Firebase Console'a gidin**: https://console.firebase.google.com
2. **Proje seçin**: tsglDerneği
3. **Firestore Database** → **Rules** sekmesine kliklayın
4. Yukarıdaki kurallar tam haline yapıştırın
5. **Publish** düğmesine tıklayın
6. **Sayfayı yenileyin** ve tekrar deneyin

## NOT: Production İçin

Gerçek ortama geçmeden önce admin UID'sini düzeltmeyi unutmayın:

```javascript
function isAdmin(uid) {
  return uid in ['2iN63xcdOGUNQJWp3Ia4ws0EYys2'];  // Admin UID
}
```

## Kontrol Etmek İçin

1. Firebase Console → Firestore → Rules sekmesinde "Simulator" aç
2. Test yap:
   - **Collection**: users
   - **Document**: (any)
   - **Operation**: update
   - Başarılı olması gerekir
