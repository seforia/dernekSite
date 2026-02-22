(function() {
  'use strict';

  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const signupForm = document.getElementById('signup-form');
  const signupMsg = document.getElementById('signup-msg');

  // === GİRİŞ FORMU ===
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showMessage(loginMsg, 'Lütfen e-posta ve şifrenizi girin.', 'error');
        return;
      }

      // Firebase bekleme
      if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
        showMessage(loginMsg, 'Sistem hazırlanıyor, lütfen bekleyin...', 'error');
        return;
      }

      try {
        showMessage(loginMsg, 'Giriş yapılıyor...', 'info');
        
        await window.TSGLAuth.login({ email, password });
        
        showMessage(loginMsg, '✅ Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
        
        // Ana sayfaya yönlendir
        setTimeout(() => {
          window.location.href = '../../index.html';
        }, 1000);
        
      } catch (error) {
        console.error('Giriş hatası:', error);
        
        let errorMsg = 'Giriş yapılamadı.';
        if (error.code === 'auth/user-not-found') {
          errorMsg = 'Kullanıcı bulunamadı.';
        } else if (error.code === 'auth/wrong-password') {
          errorMsg = 'Hatalı şifre.';
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = 'Geçersiz e-posta adresi.';
        } else if (error.code === 'auth/user-disabled') {
          errorMsg = 'Bu hesap devre dışı bırakılmış.';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        showMessage(loginMsg, '❌ ' + errorMsg, 'error');
      }
    });
  }

  // === KAYIT FORMU ===
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const passwordConfirm = document.getElementById('signup-password-confirm').value;

      // Validasyon
      if (!name || !email || !password || !passwordConfirm) {
        showMessage(signupMsg, 'Lütfen tüm alanları doldurun.', 'error');
        return;
      }

      if (password.length < 6) {
        showMessage(signupMsg, 'Şifre en az 6 karakter olmalıdır.', 'error');
        return;
      }

      if (password !== passwordConfirm) {
        showMessage(signupMsg, 'Şifreler eşleşmiyor.', 'error');
        return;
      }

      // Firebase bekleme
      if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
        showMessage(signupMsg, 'Sistem hazırlanıyor, lütfen bekleyin...', 'error');
        return;
      }

      try {
        showMessage(signupMsg, 'Kayıt işlemi yapılıyor...', 'info');
        
        console.log('🔍 Kayıt: signUp() çağrılıyor...', { name, email });
        await window.TSGLAuth.signUp({ name, email, password });
        console.log('✅ Kayıt: Başarılı!');
        
        showMessage(signupMsg, '✅ Kayıt başarılı! Hesabınız yönetici onayı bekliyor. Onaylandığında e-posta ile bilgilendirileceksiniz.', 'success');
        
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
        
        showMessage(signupMsg, '❌ ' + errorMsg, 'error');
      }
    });
  }

  function showMessage(msgElement, message, type) {
    if (!msgElement) return;
    
    msgElement.textContent = message;
    msgElement.className = 'form-info';
    
    if (type === 'error') {
      msgElement.style.color = '#dc3545';
      msgElement.style.background = '#f8d7da';
      msgElement.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
      msgElement.style.color = '#155724';
      msgElement.style.background = '#d4edda';
      msgElement.style.border = '1px solid #c3e6cb';
    } else if (type === 'info') {
      msgElement.style.color = '#004085';
      msgElement.style.background = '#cce5ff';
      msgElement.style.border = '1px solid #b8daff';
    }
    
    msgElement.style.padding = '12px';
    msgElement.style.borderRadius = '4px';
    msgElement.style.marginTop = '12px';
  }
})();
