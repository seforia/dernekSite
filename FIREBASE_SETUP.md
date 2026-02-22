# Firebase Firestore Kurulumu

## Sorun
Yazılar sayfası Firestore'a bağlanamıyor. Console hatası:
```
Could not reach Cloud Firestore backend. Connection failed.
```

## Çözüm Adımları

### 1. Firebase Console'a Giriş
1. https://console.firebase.google.com/ adresine gidin
2. **tsgld-9d385** projesini açın

### 2. Firestore Database'i Aktifleştirin
1. Sol menüden **"Firestore Database"** seçin
2. **"Create database"** butonuna tıklayın
3. **"Start in production mode"** seçin (güvenlik kurallarını sonra değiştireceğiz)
4. Location seçin (örnek: europe-west3)
5. **"Enable"** butonuna tıklayın

### 3. Security Rules'ı Güncelleyin
1. Firestore Database sayfasında **"Rules"** sekmesine tıklayın
2. Aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Posts collection - Anyone can read, authenticated users can write
    match /posts/{postId} {
      allow read: if true;  // Public read
      allow create: if request.auth != null;  // Logged in users can create
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.userId;  // Only author can edit/delete
    }
    
    // Comments collection - Anyone can read, authenticated users can write
    match /comments/{commentId} {
      allow read: if true;  // Public read
      allow create: if request.auth != null;  // Logged in users can comment
      allow delete: if request.auth != null && 
                     request.auth.uid == resource.data.userId;  // Only author can delete
    }
    
    // Users collection - Users can read/write their own data
    match /users/{userId} {
      allow read: if true;  // Public read
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **"Publish"** butonuna tıklayın

### 4. Test Edin
1. Yazılar sayfasını yenileyin: http://127.0.0.1:5501/content/yazılar/index.html
2. Sayfa artık yüklenmeli ve örnek yazılar otomatik eklenmeli
3. Console'da hata olmamalı

### 5. Koleksiyonları Kontrol Edin
Firestore aktifleştikten sonra:
1. **"Data"** sekmesine gidin
2. `posts` koleksiyonu otomatik oluşmalı (ilk yazı eklendiğinde)
3. Manuel test için bir belge ekleyebilirsiniz:
   - Collection ID: `posts`
   - Document ID: Auto-ID
   - Fields:
     - title (string): "Test Yazı"
     - content (string): "Bu bir test yazısıdır"
     - category (string): "Eğitim"
     - userId (string): "system"
     - authorName (string): "Test User"
     - createdAt (timestamp): NOW
     - viewCount (number): 0
     - commentCount (number): 0

## Not
Firestore ilk aktifleştirildiğinde birkaç dakika gecikmeli başlayabilir. Hata devam ederse 2-3 dakika bekleyip tekrar deneyin.

## İnternet Bağlantısı
Firestore cloud servis olduğu için internet bağlantısı gerektirir. Offline mode otomatik çalışır ama ilk bağlantı için internet şarttır.
