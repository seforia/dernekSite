# TSGL Derneği Web Sitesi

## GitHub Pages Deployment

Bu proje GitHub Pages'te yayınlanmak üzere yapılandırılmıştır.

### Önemli Notlar:

1. **Hash-Based Routing**: Site, GitHub Pages ile uyumlu çalışmak için hash-based routing kullanır.
   - URL formatı: `https://gecekodu.github.io/dernekSite/#/hakkimizda`

2. **.nojekyll Dosyası**: Jekyll işlemesini devre dışı bırakmak için `.nojekyll` dosyası eklenmiştir.

3. **Relative Paths**: Tüm asset ve content yolları relative path kullanır, böylece hem local hem de GitHub Pages'te çalışır.

4. **Klasör Yapısı**:
   ```
   dernekSite/
   ├── index.html (ana sayfa)
   ├── .nojekyll (Jekyll'i devre dışı bırak)
   ├── assets/
   │   ├── css/
   │   ├── js/
   │   └── img/
   └── content/
       ├── hakkimizda/
       ├── galeri/
       ├── duyurular/
       └── ... (diğer sayfalar)
   ```

5. **Deployment**:
   - GitHub repo ayarlarından "Pages" bölümüne git
   - Source: "Deploy from a branch" seç
   - Branch: `main` veya `gh-pages` seç
   - Folder: `/ (root)` seç
   - Save butonuna tıkla

6. **Linkler**:
   - Tüm internal linkler hash-based: `#/hakkimizda`, `#/galeri` vb.
   - Data attribute kullanımı: `<a href="/hakkimizda.html" data-link>`
   - JavaScript otomatik olarak hash formatına dönüştürür

### Yerel Test:

Live Server veya Python HTTP server ile test edebilirsiniz:

```bash
# Python 3
python -m http.server 8000

# Sonra tarayıcıda: http://localhost:8000
```

### Sorun Giderme:

- **404 Hatası**: Linklerinizin hash formatında olduğundan emin olun
- **Content Yüklenmiyor**: Browser console'u kontrol edin, CORS hatası varsa local server kullanın
- **CSS/JS Yüklenmiyor**: Asset yollarının relative olduğundan emin olun
