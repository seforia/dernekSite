# FormSubmit Kurulum Rehberi

## FormSubmit Nedir?

FormSubmit, backend kodu yazmadan HTML formlarınızdan e-posta göndermenizi sağlayan **ücretsiz** bir servistir. EmailJS gibi karmaşık API key yönetimi gerektirmez.

## Nasıl Çalışır?

1. **İlk Gönderim**: Form ilk kez gönderildiğinde FormSubmit, `tsgldernegi@gmail.com` adresine bir **doğrulama e-postası** gönderir.
2. **Doğrulama**: E-postadaki doğrulama linkine tıklayın (tek seferlik).
3. **Aktif**: Doğrulamadan sonra tüm form gönderimleri otomatik olarak e-posta olarak gelir.

## Mevcut Yapılandırma

Bağış/aidat formu şu şekilde yapılandırıldı:

```javascript
// assets/js/main.js içinde
const FORMSUBMIT_EMAIL = 'tsgldernegi@gmail.com';
const FORMSUBMIT_URL = `https://formsubmit.co/${FORMSUBMIT_EMAIL}`;
```

Form gönderildiğinde aşağıdaki bilgiler e-posta olarak iletilir:

- **İsim**: Bağışçı/üye adı
- **E-posta**: İletişim e-postası
- **Telefon**: İletişim telefonu
- **Ödeme Türü**: Bağış / Aidat / Her ikisi
- **Tutar**: Ödeme tutarı (TL)
- **Not**: Kullanıcı notu (varsa)
- **Tarih**: İşlem tarihi ve saati

## İlk Kurulum Adımları

### 1. Test Gönderimi Yapın

1. Siteyi çalıştırın (Live Server veya localhost)
2. `/bagis` sayfasına gidin
3. Formu doldurun ve gönderin
4. `tsgldernegi@gmail.com` gelen kutusunu kontrol edin

### 2. Doğrulama E-postasını Onaylayın

Gelen kutuda şuna benzer bir e-posta göreceksiniz:

```
Subject: Confirm your FormSubmit email address
From: FormSubmit <no-reply@formsubmit.co>

Click the link below to activate your form:
https://formsubmit.co/activate/xxxxx
```

**Linke tıklayın** - bu işlem sadece bir kez gereklidir.

### 3. Doğrulama Sonrası

✅ Doğrulamadan sonra tüm form gönderimleri otomatik olarak `tsgldernegi@gmail.com` adresine gelir.

## E-posta Formatı

Gelen e-postalar şu formatta gelir:

```
Subject: Yeni Bağış - Ahmet Yılmaz

İsim:         Ahmet Yılmaz
E-posta:      ahmet@example.com
Telefon:      05551234567
Ödeme Türü:   Bağış
Tutar:        500.00 ₺
Not:          Eğitim fonuna katkı
Tarih:        10/01/2026 14:30:25
```

## Özellikler

- ✅ **Ücretsiz**: Aylık 50 form gönderimi limiti (çoğu dernek için yeterli)
- ✅ **Spam Koruması**: `_captcha: false` (ihtiyaca göre `true` yapılabilir)
- ✅ **Tablo Formatı**: `_template: table` (okunması kolay)
- ✅ **Özel Konu**: Her e-postada "Yeni Bağış/Aidat - [İsim]"
- ✅ **Yapılandırma Yok**: API key, service ID gerekmez

## Güvenlik Notları

1. **E-posta Gizliliği**: FormSubmit, e-posta adresinizi spam botlarından korumak için şifreleme kullanır.
2. **Rate Limiting**: Her IP'den saatte maksimum 5 gönderim (spam koruması).
3. **Veri Saklama**: FormSubmit form verilerini saklamaz, yalnızca e-posta olarak iletir.

## Sorun Giderme

### E-posta gelmiyor?

1. **Spam/Junk klasörünü** kontrol edin
2. FormSubmit'ten gelen **doğrulama e-postasını onayladınız mı?**
3. Tarayıcı konsolunu açın (F12) ve `✅ E-posta bildirimi başarıyla gönderildi` mesajını kontrol edin
4. Eğer `⚠️` veya `❌` görürseniz, hata mesajını okuyun

### "Too many requests" hatası?

- 5 dakika bekleyin ve tekrar deneyin
- Bu, spam korumasıdır (saatte 5 gönderim limiti)

### Doğrulama e-postası gelmiyor?

1. Spam klasörünü kontrol edin
2. `no-reply@formsubmit.co` adresini güvenli gönderenler listesine ekleyin
3. Yeni bir test gönderimi yapın

## Gelişmiş Özellikler (Opsiyonel)

### reCAPTCHA Eklemek

[assets/js/main.js](assets/js/main.js) içinde:

```javascript
formData.append('_captcha', 'true'); // false → true yap
```

### Özel Teşekkür Sayfası

```javascript
formData.append('_next', 'https://tsglderegi.com/tesekkurler');
```

### CC/BCC Eklemek

Birden fazla e-posta adresine göndermek için FormSubmit Pro gereklidir (ücretli).

## İletişim

Sorularınız için:
- 📧 E-posta: tsgldernegi@gmail.com
- 📚 FormSubmit Dokümantasyon: https://formsubmit.co/

---

**Son Güncelleme**: 10 Ocak 2026
