# EmailJS Kurulum Rehberi

## Adım 1: EmailJS Hesabı Oluşturun
1. https://www.emailjs.com/ adresine gidin
2. Ücretsiz hesap oluşturun (ücretsiz plan ayda 200 email gönderebilir)

## Adım 2: Email Servisi Ekleyin
1. Dashboard'da "Email Services" bölümüne gidin
2. "Add New Service" butonuna tıklayın
3. Gmail seçin (veya tercih ettiğiniz email sağlayıcısı)
4. Dernek Gmail hesabınızla (tsgldernegi@gmail.com) bağlayın
5. Service ID'yi kaydedin (örn: service_xxxxxx)

## Adım 3: Email Template Oluşturun
1. Dashboard'da "Email Templates" bölümüne gidin
2. "Create New Template" butonuna tıklayın
3. Şu template'i kullanın:

**Subject:** Yeni Bağış/Aidat Bildirimi

**Content:**
```
Merhaba,

Yeni bir bağış/aidat ödemesi yapılmak üzere!

Bağışçı Bilgileri:
- Ad Soyad: {{donor_name}}
- E-posta: {{donor_email}}
- Telefon: {{donor_phone}}

Ödeme Bilgileri:
- Ödeme Türü: {{payment_type}}
- Tutar: {{amount}}
- Not: {{note}}
- Tarih: {{date}}

Bağışçı EFT/Havale yapacak ve dekont gönderecek.

TSGL Derneği Web Sitesi
```

4. Template ID'yi kaydedin (örn: template_xxxxxx)

## Adım 4: Public Key Alın
1. Dashboard'da "Account" > "General" bölümüne gidin
2. "Public Key" değerini kopyalayın

## Adım 5: Kodda Güncelleme Yapın

`assets/js/main.js` dosyasında şu satırları güncelleyin:

```javascript
// Satır ~469 civarı
emailjs.init({
  publicKey: "BURAYA_PUBLIC_KEY_YAPIŞTIRIN",
});

// Satır ~651 civarı
emailjs.send('BURAYA_SERVICE_ID', 'BURAYA_TEMPLATE_ID', templateParams)
```

## Test Etme
1. Bağış sayfasına gidin
2. Formu doldurun ve gönderin
3. tsgldernegi@gmail.com hesabına email geldiğini kontrol edin

## Önemli Notlar
- Ücretsiz plan ayda 200 email limiti var
- Eğer daha fazla email gerekirse ücretli plana geçilebilir
- EmailJS tamamen istemci tarafında çalışır, sunucu gerektirmez
- Email gönderimi birkaç saniye sürebilir

## Sorun Giderme
- Console'da hata mesajlarını kontrol edin
- Public Key, Service ID ve Template ID'lerin doğru olduğundan emin olun
- Gmail hesabının EmailJS'ye erişim izni verdiğinden emin olun
