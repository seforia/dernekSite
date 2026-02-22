# Firestore Security Rules Düzeltme

## Sorun
```
Missing or insufficient permissions
```

Bu hata, Firestore'da okuma/yazma izni olmadığını gösterir.

## Çözüm

### 1. Firebase Console'a Gidin
https://console.firebase.google.com/ → **tsgld-9d385** projesini açın

### 2. Firestore Rules'ı Güncelleyin

1. Sol menüden **"Firestore Database"** seçin
2. Üst menüde **"Rules"** sekmesine tıklayın
3. Mevcut tüm kuralları silin
4. Aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Posts collection
    match /posts/{postId} {
      // Anyone can read posts
      allow read: if true;
      
      // Authenticated users can create posts
      allow create: if request.auth != null;
      
      // Only post author can update/delete
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.userId;
    }
    
    // Comments collection
    match /comments/{commentId} {
      // Anyone can read comments
      allow read: if true;
      
      // Authenticated users can create comments
      allow create: if request.auth != null;
      
      // Only comment author can delete
      allow delete: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles (for author names)
      allow read: if true;
      
      // Users can only write their own data
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. **"Publish"** butonuna tıklayın
6. Onay popup'ında **"Publish"** tekrar tıklayın

### 3. Test Edin

1. Yazılar sayfasını yenileyin (Ctrl+Shift+R)
2. Console'da artık permission hatası olmamalı
3. Örnek yazılar otomatik yüklenmeli
4. Yazılar listelenmeye başlamalı

## Güvenlik Notları

- ✅ **read: if true** → Herkes yazıları görüntüleyebilir (public blog)
- ✅ **create: if request.auth != null** → Sadece giriş yapan kullanıcılar yazı/yorum ekleyebilir
- ✅ **update/delete** → Sadece yazarı kendi yazısını düzenleyebilir/silebilir

Production'da daha katı kurallar ekleyebilirsiniz:
- Spam kontrolü
- Rate limiting
- İçerik validasyonu
- Moderator rolleri

## Alternatif: Test Mode (Geçici)

Sadece test için (12 saat geçerli):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 2, 23);
    }
  }
}
```

⚠️ **DİKKAT**: Bu kural herkesin her şeyi yapmasına izin verir. Sadece test için kullanın!
