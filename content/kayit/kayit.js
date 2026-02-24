(function() {
  'use strict';

  const signupForm = document.getElementById('signup-form');
  const signupMsg = document.getElementById('signup-msg');
  const signupBtn = document.getElementById('signupBtn');
  const consentCheckbox = document.getElementById('membershipConsent');

  if (!signupForm) {
    console.warn('Kayıt formu bulunamadı');
    return;
  }

  // Onay kutucugu kontrolü - butonu aktif/pasif yap
  if (consentCheckbox && signupBtn) {
    consentCheckbox.addEventListener('change', function() {
      if (this.checked) {
        signupBtn.disabled = false;
        signupBtn.style.opacity = '1';
        signupBtn.style.cursor = 'pointer';
      } else {
        signupBtn.disabled = true;
        signupBtn.style.opacity = '0.5';
        signupBtn.style.cursor = 'not-allowed';
      }
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Form alanlarını al
    const name = document.getElementById('ad').value.trim() + ' ' + document.getElementById('soyad').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const fotoFile = document.getElementById('fotograf').files[0];

    // Validasyon
    if (!name || !email || !password || !passwordConfirm) {
      showMessage('Lütfen zorunlu alanları doldurun.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      showMessage('Şifreler eşleşmiyor.', 'error');
      return;
    }

    // Firebase bekleme
    if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
      showMessage('Sistem hazırlanıyor, lütfen bekleyin...', 'error');
      return;
    }

    try {
      showMessage('Kayıt işlemi yapılıyor...', 'info');
      
      await window.TSGLAuth.signUp({ name, email, password });
      
      // Fotoğraf seçildiyse upload et
      if (fotoFile) {
        try {
          showMessage('Profil fotoğrafı yükleniyor...', 'info');
          await window.TSGLAuth.uploadProfilePhoto(fotoFile);
          showMessage('✅ Kayıt başarılı! Profil fotoğrafınız kaydedildi. Hesabınız yönetici onayı bekliyor.', 'success');
        } catch (photoError) {
          console.warn('Fotoğraf upload hatası:', photoError);
          // Fotoğraf upload'ı başarısız olsa bile, kullanıcı üye kaydı yapıldı
          showMessage('✅ Kayıt başarılı! (Fotoğraf yüklenemedi, daha sonra profile ekleme yapabilirsiniz)', 'success');
        }
      } else {
        showMessage('✅ Kayıt başarılı! Hesabınız yönetici onayı bekliyor. Onaylandığında e-posta ile bilgilendirileceksiniz.', 'success');
      }
      
      // Formu temizle
      setTimeout(() => {
        signupForm.reset();
      }, 2000);
      
    } catch (error) {
      console.error('Kayıt hatası:', error);
      
      let errorMsg = 'Kayıt yapılamadı.';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Bu e-posta adresi zaten kullanılıyor.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Geçersiz e-posta adresi.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Şifre çok zayıf.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showMessage('❌ ' + errorMsg, 'error');
    }
  });

  function showMessage(message, type) {
    if (!signupMsg) return;
    
    signupMsg.textContent = message;
    signupMsg.className = 'form-info';
    
    if (type === 'error') {
      signupMsg.style.color = '#dc3545';
      signupMsg.style.background = '#f8d7da';
      signupMsg.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
      signupMsg.style.color = '#155724';
      signupMsg.style.background = '#d4edda';
      signupMsg.style.border = '1px solid #c3e6cb';
    } else if (type === 'info') {
      signupMsg.style.color = '#004085';
      signupMsg.style.background = '#cce5ff';
      signupMsg.style.border = '1px solid #b8daff';
    }
    
    signupMsg.style.padding = '12px';
    signupMsg.style.borderRadius = '4px';
    signupMsg.style.marginTop = '12px';
  }
})();
