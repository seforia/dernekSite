# TSGL Derneği Web Sitesi (SPA)

Tevfik Sırrı Gür Lisesi Derneği için hazırlanmış, modern ve profesyonel web sitesi. Single Page Application (SPA) mantığıyla çalışan, erişilebilir ve responsive tasarım.

## 🎯 Özellikler

### ✨ Modern Özellikler
- 🎨 **Modern UI/UX** - Profesyonel ve kullanıcı dostu arayüz
- 🎉 **Konfeti Animasyonu** - Bağış yapıldığında otomatik kutlama efekti
- ⚡ **Loading Spinner** - Sayfa geçişlerinde modern yükleme animasyonu
- 🎭 **Smooth Animations** - Dropdown menüler ve scroll animasyonları
- 🖼️ **Footer Background** - Özel tasarım footer arkaplan görseli
- 📝 **Modern Form Animations** - Yumuşak slideUp efekti ile form girişleri
- 📧 **Email Bildirimleri** - FormSubmit.co ile otomatik bağış/aidat bildirimleri (tsgldernegi@gmail.com)
- 💳 **Gelişmiş Ödeme Sistemi** - Adım adım IBAN/EFT ödeme akışı, tutar seçenekleri ve özet ekranı
- �📱 **Fully Responsive** - Tüm cihazlarda mükemmel görünüm
- ♿ **Accessibility** - WCAG 2.1 standartlarına uygun
- 🔒 **Firebase Auth** - Güvenli üye giriş sistemi

### 📄 Sayfalar
- Ana Sayfa
- Hakkımızda
- Yönetim Kurulu
- Okulumuz
- İletişim
- Galeri
- Duyurular
- Bağış & Aidat
- Üye Kayıt/Giriş
- Burs Başvurusu
- Dernek Tüzüğü

## Yapı

### Dosya Sistemi
```
├── index.html              # Ana HTML dosyası (tüm sayfalar buradan yüklenir)
├── .htaccess              # Apache sunucu yapılandırması (temiz URL'ler için)
├── content/               # Sayfa içerikleri
│   ├── bagis/            # Bağış ve aidat sayfası
│   ├── yonetim-kurulu/   # Yönetim kurulu
│   ├── okulumuz/         # Okul tanıtımı
│   ├── iletisim/         # İletişim sayfası
│   ├── hakkimizda/       # Hakkımızda sayfası
│   ├── galeri/           # Galeri sayfası
│   ├── duyurular/        # Duyurular sayfası
│   ├── kayit/            # Üye kayıt
│   ├── giris/            # Üye giriş
│   ├── burs/             # Burs başvurusu
│   ├── tuzuk/            # Dernek tüzüğü
│   └── uyelik/           # Üyelik bilgileri
├── assets/
│   ├── css/
│   │   └── styles.css    # Tasarım sistemi ve tüm stiller
│   ├── js/
│   │   ├── main.js       # SPA routing, animasyonlar ve etkileşimler
│   │   ├── auth.js       # Firebase authentication
│   │   └── firebase-config.js # Firebase yapılandırması
│   └── img/              # Görseller ve logo
```

## SPA (Single Page Application) Mantığı

Bu site **tek sayfa uygulama** mantığıyla çalışır:
- Her ziyaretçi aynı `index.html` dosyasını yükler
- Sayfa değişiklikleri JavaScript ile dinamik olarak yapılır
- URL'ler temiz görünür: `/hakkimizda`, `/galeri`, `/bagis`
- Sayfa yenilenmez, sadece içerik değişir
- Tarayıcı geri/ileri butonları çalışır
- Modern loading animasyonları

## URL Yapısı

Site şu URL'lere sahiptir:
- `/` - Ana sayfa
- `/hakkimizda` - Hakkımızda
- `/yonetim-kurulu` - Yönetim Kurulu
- `/okulumuz` - Okulumuz
- `/iletisim` - İletişim
- `/galeri` - Galeri
- `/duyurular` - Duyurular
- `/bagis` - Bağış & Aidat
- `/kayit` - Üye Kayıt
- `/giris` - Üye Girişi
- `/burs` - Burs Başvurusu
- `/tuzuk` - Dernek Tüzüğü

## Hızlı Başlangıç

### FormSubmit Kurulumu (Email Bildirimleri İçin)
Bağış/aidat bildirimleri için FormSubmit.co kullanılıyor (ücretsiz, API key gerektirmez):

1. **İlk Test Gönderimi**: Formu doldurup gönderin
2. **Doğrulama E-postası**: `tsgldernegi@gmail.com` adresine gelen doğrulama linkine tıklayın (tek seferlik)
3. **Aktif**: Doğrulamadan sonra tüm form gönderimleri otomatik olarak e-posta ile gelir

Detaylı kurulum adımları için `FORMSUBMIT_SETUP.md` dosyasına bakın.

### Yerel Geliştirme
1. Bu klasörü VS Code ile açın
2. Live Server eklentisi ile çalıştırın:
   - VS Code Marketplace'ten "Live Server" kurun
   - `index.html` üzerinde sağ tıklayıp "Open with Live Server" seçin
3. Tarayıcıda `http://localhost:5500` adresinden siteyi görüntüleyin


**Not:** SPA routing'in düzgün çalışması için bir web sunucusu gereklidir (Live Server veya Apache/Nginx).

### Sunucu Kurulumu

#### Apache Sunucu
- `.htaccess` dosyası sunucuya yüklenmelidir
- `mod_rewrite` modülü aktif olmalıdır
- Tüm istekler `index.html`'e yönlendirilir

#### Nginx Sunucu
Nginx için yapılandırma:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Yeni Sayfa Ekleme

1. `content/` klasörü altında yeni klasör oluşturun:
   ```
   content/yeni-sayfa/index.html
   ```

2. `assets/js/main.js` dosyasındaki `routes` objesine ekleyin:
   ```javascript
   const routes = {
     '/': { title: 'TSGL Derneği', content: 'home' },
     '/yeni-sayfa': { title: 'Yeni Sayfa | TSGL Derneği', content: 'content/yeni-sayfa/index.html' }
   };
   ```

3. Menüye link ekleyin (`index.html`):
   ```html
   <li><a href="/yeni-sayfa" data-link>Yeni Sayfa</a></li>
   ```

## Özelleştirme
- Renkler, tipografi ve boşluklar `:root` değişkenlerinde tanımlı (bkz. `assets/css/styles.css`)
- Logo ve favicon derneğinize özel olanlarla değiştirin
- İçerikler `content/` klasöründeki HTML dosyalarında düzenlenebilir

## Erişilebilirlik
- `lang="tr"`, kontrastlı renkler, klavye ile gezinme ve mobil menü sağlanmıştır
- ARIA etiketleri ve semantik HTML kullanılmıştır

## Tarayıcı Desteği
- Modern tarayıcılar (Chrome, Firefox, Safari, Edge)
- History API desteği gereklidir
- IE11 desteklenmez

## Lisans / İçerik
Bu şablon telifsizdir. Görseller ve marka varlıkları için derneğe ait materyaller kullanılmalıdır.
