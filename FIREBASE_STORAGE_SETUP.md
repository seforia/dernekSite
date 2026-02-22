# Firebase Storage Kurulumu

## Sorun
Görsel yüklenirken CORS hatası alıyorsunuz:
```
CORS preflight yanıtı başarısız oldu. Durum kodu: 404
```

Bu, Firebase Storage'ın henüz aktifleştirilmediği anlamına gelir.

## Çözüm Adımları

### 1. Firebase Storage'ı Aktifleştirin

1. https://console.firebase.google.com/ → **tsgld-9d385** projesini açın
2. Sol menüden **"Storage"** seçin
3. **"Get started"** butonuna tıklayın
4. Güvenlik kuralları ekranında **"Start in production mode"** seçin
5. Location seçin (örnek: europe-west3 - Firestore ile aynı)
6. **"Done"** butonuna tıklayın

### 2. Storage Security Rules'ı Güncelleyin

Storage aktifleştikten sonra:

1. Storage sayfasında **"Rules"** sekmesine tıklayın
2. Aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Posts images
    match /posts/{userId}/{fileName} {
      // Anyone can read
      allow read: if true;
      
      // Only authenticated users can upload
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                      request.resource.contentType.matches('image/.*'); // Only images
      
      // Only owner can delete
      allow delete: if request.auth != null && 
                       request.auth.uid == userId;
    }
  }
}
```

3. **"Publish"** butonuna tıklayın

### 3. CORS Ayarlarını Yapılandırın (Opsiyonel)

Eğer hala CORS hatası alıyorsanız, Google Cloud Console üzerinden CORS ayarları gerekebilir:

1. https://console.cloud.google.com/ adresine gidin
2. **tsgld-9d385** projesini seçin
3. Sol menüden **"Cloud Storage"** → **"Buckets"** seçin
4. `tsgld-9d385.firebasestorage.app` bucket'ını bulun
5. Üst menüden **"Cloud Shell"** açın (terminal ikonu)
6. Şu komutu çalıştırın:

```bash
echo '[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

gsutil cors set cors.json gs://tsgld-9d385.firebasestorage.app
```

**NOT**: Production'da `"origin": ["*"]` yerine spesifik domain kullanın.

### 4. Test Edin

1. Yazılar sayfasını yenileyin
2. Yeni yazı ekleyin ve görsel seçin
3. **"Yayınla"** butonuna tıklayın
4. Console'da CORS hatası olmamalı
5. Yazı başarıyla yayınlanmalı

## Alternatif: Görselsiz Test

Eğer Storage kurulumu zaman alıyorsa, önce görselsiz test edebilirsiniz:

1. Yazı eklerken **görsel seçmeyin**
2. Sadece başlık, kategori ve içerik doldurun
3. **"Yayınla"** butonuna tıklayın
4. Yazı başarıyla yayınlanmalı

Görsel özelliğini daha sonra test edebilirsiniz.
