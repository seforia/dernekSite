# GitHub Pages Deployment Kontrol Listesi

## ✅ Tamamlananlar:

### Dosya Yapısı:
- [x] `.nojekyll` dosyası oluşturuldu (Jekyll'i devre dışı bırakır)
- [x] `DEPLOYMENT.md` rehberi oluşturuldu
- [x] `README.md` güncellendi (GitHub Pages talimatları eklendi)

### Kod Değişiklikleri:
- [x] Hash-based routing sistemi eklendi (`#/hakkimizda`)
- [x] `getCurrentPath()` - Hash kullanımı
- [x] `navigateTo()` - Hash formatına dönüştürme
- [x] `hashchange` event listener eklendi
- [x] Base path desteği eklendi (proje klasörü için)
- [x] SPA routes - Hem `.html` hem uzantısız yollar destekleniyor

### Asset Yolları:
- [x] CSS linkler relative path kullanıyor (`assets/css/`)
- [x] JS scriptler relative path kullanıyor (`assets/js/`)
- [x] Image yolları relative path kullanıyor (`assets/img/`)
- [x] Content fetch'ler relative path kullanıyor (`content/*/index.html`)

### HTML Linkleri:
- [x] Ana sayfa linkleri `.html` uzantılı
- [x] Menü linkleri `.html` uzantılı
- [x] Footer linkleri `.html` uzantılı
- [x] Content sayfaları arası linkler `.html` uzantılı
- [x] JavaScript otomatik hash'e dönüştürüyor

## 📋 GitHub Pages'te Yapılacaklar:

1. **Repository Settings'e Git**
   - Repo ana sayfasında → **Settings** sekmesi

2. **Pages Bölümünü Aç**
   - Sol menüden → **Pages**

3. **Source Ayarları**
   - Source: **"Deploy from a branch"** seç
   - Branch: **`main`** (veya kullandığınız branch) seç
   - Folder: **`/ (root)`** seç
   - **Save** butonuna tıkla

4. **Bekleme**
   - GitHub Pages build işlemini başlatacak
   - 1-2 dakika içinde site yayına alınır
   - Yeşil onay işareti göründüğünde hazır

5. **Test**
   - Verilen URL'yi aç (örnek: `https://gecekodu.github.io/dernekSite/`)
   - Linkleri test et (`#/hakkimizda`, `#/galeri`, vb.)
   - Responsive görünümü test et (mobil/tablet/desktop)

## 🔍 Doğrulama:

### Çalışması Gerekenler:
- [ ] Ana sayfa yükleniyor
- [ ] Header menü linkleri çalışıyor
- [ ] Footer linkleri çalışıyor
- [ ] Slider okları tıklanabiliyor (mobilde)
- [ ] Hamburger menü açılıyor (mobilde)
- [ ] Scroll-up butonu görünüyor
- [ ] Content sayfaları yükleniyor
- [ ] Banka modal açılıyor
- [ ] Form gönderimi çalışıyor

### URL Örnekleri:
```
https://gecekodu.github.io/dernekSite/
https://gecekodu.github.io/dernekSite/#/hakkimizda
https://gecekodu.github.io/dernekSite/#/galeri
https://gecekodu.github.io/dernekSite/#/duyurular
https://gecekodu.github.io/dernekSite/#/burs
https://gecekodu.github.io/dernekSite/#/bagis
```

## 🐛 Olası Sorunlar ve Çözümler:

### Sorun: 404 Not Found
**Sebep:** Jekyll `.nojekyll` dosyasını görmüyor
**Çözüm:** `.nojekyll` dosyasının repo kökünde olduğundan emin olun

### Sorun: Linkler çalışmıyor
**Sebep:** Hash-based routing düzgün çalışmıyor
**Çözüm:** Browser console'u kontrol edin, JavaScript hatası var mı?

### Sorun: CSS/JS yüklenmiyor
**Sebep:** Asset yolları yanlış
**Çözüm:** Developer Tools → Network tab'da hangi dosyaların 404 verdiğini kontrol edin

### Sorun: Content sayfaları boş
**Sebep:** CORS hatası veya fetch yolu yanlış
**Çözüm:** Console'da hata mesajını kontrol edin

## 📞 İletişim:

Sorun yaşarsanız:
1. Browser console'u kontrol edin (F12 → Console)
2. Network tab'da başarısız istekleri kontrol edin
3. GitHub Pages build log'unu kontrol edin (Settings → Pages)
