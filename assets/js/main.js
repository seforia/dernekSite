(function () {
  // === PERFORMANCE THROTTLE HELPER ===
  function throttle(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (!timeout) {
        func(...args);
        timeout = setTimeout(later, wait);
      }
    };
  }

  // === HEADER SCROLL BEHAVIOR ===
  const siteHeader = document.querySelector('.site-header');
  const scrollUpBtn = document.getElementById('scroll-up-btn');
  
  // Sayfa başladığında is-top class'ını ekle
  if (siteHeader) {
    siteHeader.classList.add('is-top');
  }
  
  let lastScroll = 0;
  let scrollDirection = 'down';
  const SCROLL_THRESHOLD = 50;
  const HIDE_SCROLL_THRESHOLD = 60;

  function updateHeaderState() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Scroll direction detection + header hide/show
    if (currentScroll > lastScroll) {
      // Scrolling down
      scrollDirection = 'down';
      if (currentScroll > HIDE_SCROLL_THRESHOLD) {
        siteHeader?.classList.add('hide-header');
      }
    } else {
      // Scrolling up
      scrollDirection = 'up';
      siteHeader?.classList.remove('hide-header');
    }
    
    // Header state based on scroll position
    if (currentScroll === 0) {
      siteHeader?.classList.add('is-top');
      siteHeader?.classList.remove('is-scrolled');
    } else if (currentScroll > SCROLL_THRESHOLD) {
      siteHeader?.classList.remove('is-top');
      siteHeader?.classList.add('is-scrolled');
    } else {
      siteHeader?.classList.remove('is-top');
      siteHeader?.classList.remove('is-scrolled');
    }
    
    // Scroll-to-top button visibility (always reflect threshold)
    if (scrollUpBtn) {
      if (currentScroll > HIDE_SCROLL_THRESHOLD) {
        scrollUpBtn.classList.add('visible');
      } else {
        scrollUpBtn.classList.remove('visible');
      }
    }
    
    lastScroll = currentScroll;
    console.log('Scroll:', currentScroll, 'Direction:', scrollDirection, 'is-top:', siteHeader?.classList.contains('is-top'), 'is-scrolled:', siteHeader?.classList.contains('is-scrolled'), 'hidden:', siteHeader?.classList.contains('hide-header'));
  }

  // Sayfa yüklendiğinde kontrol et
  updateHeaderState();

  // Scroll olayında kontrol et - throttled
  const throttledScroll = throttle(updateHeaderState, 100);
  window.addEventListener('scroll', throttledScroll, { passive: true });

  // === MOBILE MENU (REWRITTEN SIMPLE VERSION) ===
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLeft = document.querySelector('.nav-left');
  const navRight = document.querySelector('.nav-right');
  let mobileOverlay = document.querySelector('.mobile-nav-overlay');

  // Ensure overlay exists
  if (!mobileOverlay && mobileMenuToggle) {
    mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-nav-overlay';
    document.body.appendChild(mobileOverlay);
  }

  const openMobileMenu = () => {
    mobileMenuToggle?.classList.add('active');
    navLeft?.classList.add('mobile-active');
    mobileOverlay?.classList.add('active');
    mobileMenuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileMenu = () => {
    mobileMenuToggle?.classList.remove('active');
    navLeft?.classList.remove('mobile-active');
    navRight?.classList.remove('mobile-active');
    mobileOverlay?.classList.remove('active');
    mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (mobileMenuToggle) {
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mobileMenuToggle.classList.contains('active')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    };
    mobileMenuToggle.addEventListener('click', toggleMenu, false);
    mobileMenuToggle.addEventListener('touchstart', toggleMenu, { passive: false });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
    mobileOverlay.addEventListener('touchstart', (e) => { e.preventDefault(); closeMobileMenu(); }, { passive: false });
  }

  // === MOBILE DROPDOWN TOGGLE (SIMPLE) ===
  const dropdownToggle = document.querySelector('.nav-left .nav-dropdown > a');
  const navSubmenu = document.querySelector('.nav-left .nav-submenu');
  const navDropdown = document.querySelector('.nav-left .nav-dropdown');

  if (dropdownToggle && navDropdown && navSubmenu) {
    const toggleDropdown = (e) => {
      if (window.innerWidth > 768) return; // only mobile
      e.preventDefault();
      e.stopPropagation();
      const isOpen = navDropdown.classList.contains('open');
      navDropdown.classList.toggle('open', !isOpen);
      navSubmenu.style.display = !isOpen ? 'grid' : 'none';
    };
    dropdownToggle.addEventListener('click', toggleDropdown, false);
    dropdownToggle.addEventListener('touchstart', toggleDropdown, { passive: false });
  }

  // === MOBILE NAV LINK CLICKS (SIMPLE NAVIGATE) ===
  document.querySelectorAll('.nav-left a').forEach(link => {
    link.style.touchAction = 'manipulation';
    link.style.cursor = 'pointer';
    link.style.pointerEvents = 'auto';

    const handleClick = (e) => {
      // Skip dropdown toggle itself; handled above
      if (link === dropdownToggle && window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (window.innerWidth <= 768) {
        const href = link.getAttribute('href') || '';
        const isFooterScroll = href.startsWith('#footer') || link.classList.contains('scroll-to-footer');

        e.preventDefault();
        e.stopPropagation();

        closeMobileMenu();

        if (isFooterScroll) {
          const footer = document.querySelector('.site-footer');
          if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (href) {
          navigateTo(href);
        }
        return;
      }
    };

    link.addEventListener('click', handleClick, false);
    link.addEventListener('touchstart', handleClick, { passive: false });
  });

  // === BANK INFO MODAL ===
  const infoBtn = document.getElementById('info-btn');
  const bankInfoBtn = document.getElementById('bank-info-btn');
  const bankInfoBtnMobile = document.getElementById('bank-info-btn-mobile');
  const hamburgerBtn = document.getElementById('mobile-menu-toggle');
  const bankModal = document.getElementById('bank-modal');
  const bankModalOverlay = document.getElementById('bank-modal-overlay');
  const bankModalClose = document.getElementById('bank-modal-close');
  const gotoBagis = document.getElementById('goto-bagis');
  const gotoMembership = document.getElementById('goto-membership');
  
  const openBankModal = () => {
    bankModal.classList.add('open');
    bankModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
  };

  const closeBankModal = () => {
    bankModal.classList.remove('open');
    bankModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (infoBtn) {
    infoBtn.addEventListener('click', openBankModal);
  }

  const attachBankBtn = (btn) => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.innerWidth <= 768) closeMobileMenu();
      openBankModal();
    });
  };

  attachBankBtn(bankInfoBtn);
  attachBankBtn(bankInfoBtnMobile);

  if (hamburgerBtn) {
    // Hamburger düğmesinin event'i zaten mobileMenuToggle'de tanımlı
    // Burada bank modal açma kodu olmasın
    // Hamburger butonuna event listener eklemeyin
  }

  if (bankModalClose) {
    bankModalClose.addEventListener('click', () => {
      closeBankModal();
      if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    });
  }

  if (bankModalOverlay) {
    bankModalOverlay.addEventListener('click', () => {
      closeBankModal();
      if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bankModal.classList.contains('open')) {
      closeBankModal();
      if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    }
  });

  if (gotoBagis) {
    gotoBagis.addEventListener('click', () => {
      closeBankModal();
      navigateTo('/bagis');
    });
  }

  if (gotoMembership) {
    gotoMembership.addEventListener('click', () => {
      closeBankModal();
      navigateTo('/bagis');
    });
  }

  const navDropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
  const dropdownToggles = Array.from(document.querySelectorAll('.nav-dropdown > a'));

  const closeDropdowns = (except = null) => {
    navDropdowns.forEach((item) => {
      if (except && item === except) return;
      item.classList.remove('open');
      const trigger = item.querySelector(':scope > a');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  };

  // Desktop-only dropdown handler (768px+ screens)
  const isDesktop = () => window.innerWidth > 768;
  
  dropdownToggles.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.style.touchAction = 'manipulation';
    trigger.style.cursor = 'pointer';
    
    const handleToggle = (e) => {
      // Only handle on desktop
      if (!isDesktop()) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Dropdown toggle clicked:', trigger.textContent);
      
      const parent = trigger.closest('.nav-dropdown');
      if (!parent) return;
      const willOpen = !parent.classList.contains('open');
      closeDropdowns();
      parent.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    };
    
    // Hem click hem touch
    trigger.addEventListener('click', handleToggle, false);
    trigger.addEventListener('touchstart', handleToggle, { passive: false });
  });

  document.addEventListener('click', (e) => {
    if (!isDesktop()) return;
    if (e.target.closest('.nav-dropdown')) return;
    closeDropdowns();
  });

  // === COOKIE CONSENT ===
  const cookieConsent = document.getElementById('cookie-consent');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieReject = document.getElementById('cookie-reject');
  const COOKIE_NAME = 'tsgl_cookie_consent';

  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function showCookieBanner() {
    if (cookieConsent) {
      setTimeout(() => {
        cookieConsent.classList.add('show');
      }, 1000);
    }
  }

  function hideCookieBanner() {
    if (cookieConsent) {
      cookieConsent.classList.remove('show');
    }
  }

  // Check if user has already made a choice
  if (!getCookie(COOKIE_NAME)) {
    showCookieBanner();
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      setCookie(COOKIE_NAME, 'accepted', 365);
      hideCookieBanner();
    });
  }

  if (cookieReject) {
    cookieReject.addEventListener('click', () => {
      setCookie(COOKIE_NAME, 'rejected', 365);
      hideCookieBanner();
    });
  }

  // === PAGE LOADER FUNCTIONS ===
  const pageLoader = document.getElementById('page-loader');
  
  function showLoader() {
    if (pageLoader) {
      pageLoader.classList.remove('hidden');
    }
  }

  function hideLoader() {
    if (pageLoader) {
      setTimeout(() => {
        pageLoader.classList.add('hidden');
      }, 300);
    }
  }

  // === SPA ROUTING SYSTEM ===
  // Base path desteği - GitHub Pages proje sayfaları için
  const getBasePath = () => {
    const pathname = window.location.pathname;
    // Eğer /dernekSite/ gibi bir path varsa onu kullan
    const match = pathname.match(/^(\/[^\/]+\/)/);
    return match ? match[1] : '/';
  };

  const routes = {
    '/': { title: 'TSGL Derneği', content: 'home' },
    '/hakkimizda': { title: 'Hakkımızda | TSGL Derneği', content: 'content/hakkimizda/index.html' },
    '/hakkimizda.html': { title: 'Hakkımızda | TSGL Derneği', content: 'content/hakkimizda/index.html' },
    '/galeri': { title: 'Galeri | TSGL Derneği', content: 'content/galeri/index.html' },
    '/galeri.html': { title: 'Galeri | TSGL Derneği', content: 'content/galeri/index.html' },
    '/duyurular': { title: 'Duyurular | TSGL Derneği', content: 'content/duyurular/index.html' },
    '/duyurular.html': { title: 'Duyurular | TSGL Derneği', content: 'content/duyurular/index.html' },
    '/kayit': { title: 'Üye Kayıt | TSGL Derneği', content: 'content/kayit/index.html' },
    '/kayit.html': { title: 'Üye Kayıt | TSGL Derneği', content: 'content/kayit/index.html' },
    '/giris': { title: 'Üye Girişi | TSGL Derneği', content: 'content/giris/index.html' },
    '/giris.html': { title: 'Üye Girişi | TSGL Derneği', content: 'content/giris/index.html' },
    '/burs': { title: 'Burs Başvurusu | TSGL Derneği', content: 'content/burs/index.html' },
    '/burs.html': { title: 'Burs Başvurusu | TSGL Derneği', content: 'content/burs/index.html' },
    '/tuzuk': { title: 'Dernek Tüzüğü | TSGL Derneği', content: 'content/tuzuk/index.html' },
    '/tuzuk.html': { title: 'Dernek Tüzüğü | TSGL Derneği', content: 'content/tuzuk/index.html' },
    '/bagis': { title: 'Bağış & Aidat | TSGL Derneği', content: 'content/bagis/index.html' },
    '/bagis.html': { title: 'Bağış & Aidat | TSGL Derneği', content: 'content/bagis/index.html' },
    '/yonetim-kurulu': { title: 'Yönetim Kurulu | TSGL Derneği', content: 'content/yonetim-kurulu/index.html' },
    '/yonetim-kurulu.html': { title: 'Yönetim Kurulu | TSGL Derneği', content: 'content/yonetim-kurulu/index.html' },
    '/iletisim': { title: 'İletişim | TSGL Derneği', content: 'content/iletisim/index.html' },
    '/iletisim.html': { title: 'İletişim | TSGL Derneği', content: 'content/iletisim/index.html' },
    '/okulumuz': { title: 'Okulumuz | TSGL Derneği', content: 'content/okulumuz/index.html' },
    '/okulumuz.html': { title: 'Okulumuz | TSGL Derneği', content: 'content/okulumuz/index.html' },
    '/faaliyetler': { title: 'Faaliyetlerimiz | TSGL Derneği', content: 'content/faaliyetler/index.html' },
    '/faaliyetler.html': { title: 'Faaliyetlerimiz | TSGL Derneği', content: 'content/faaliyetler/index.html' },
    '/basari-oykuleri': { title: 'Başarı Öykülerimiz | TSGL Derneği', content: 'content/basari-oykuleri/index.html' },
    '/basari-oykuleri.html': { title: 'Başarı Öykülerimiz | TSGL Derneği', content: 'content/basari-oykuleri/index.html' }
  };

  const homeContent = document.getElementById('home-content');
  const dynamicContent = document.getElementById('dynamic-content');
  const mainContent = document.querySelector('[data-main-content]');

  function getCurrentPath() {
    // GitHub Pages ve file: protokolü için hash-based routing kullan
    const h = window.location.hash.replace(/^#/, '');
    const cleaned = h ? `/${h.replace(/^\/+/, '').replace(/\.html$/, '')}` : '/';
    return cleaned;
  }

  async function loadContent(path) {
    const route = routes[path] || routes['/'];
    document.title = route.title;

    // Show loader
    showLoader();

    if (route.content === 'home') {
      // Ana sayfayı göster
      if (homeContent) homeContent.style.display = 'block';
      if (dynamicContent) dynamicContent.style.display = 'none';
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      hideLoader();
    } else {
      // Dinamik içerik yükle
      try {
        const response = await fetch(route.content);
        if (!response.ok) throw new Error('Content not found');
        const html = await response.text();
        
        if (homeContent) homeContent.style.display = 'none';
        if (dynamicContent) {
          dynamicContent.innerHTML = html;
          dynamicContent.style.display = 'block';
        }
        
        // Reveal animasyonlarını yeniden başlat
        initRevealAnimations();
        // Sayfaya özel bağlayıcılar
        bindPageHandlers(path);
        // Scroll to top immediately
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        hideLoader();
      } catch (error) {
        console.error('Error loading content:', error);
        if (dynamicContent) {
          dynamicContent.innerHTML = '<section class="page-hero"><div class="container"><h1>Sayfa Bulunamadı</h1><p>İstediğiniz sayfa yüklenemedi.</p></div></section>';
          dynamicContent.style.display = 'block';
        }
        hideLoader();
      }
    }
  }

  function navigateTo(url, section = null) {
    // GitHub Pages için hash-based routing kullan
    const cleanUrl = url.replace(/\.html$/, '');
    const hashUrl = `#${cleanUrl.replace(/^\//, '')}`;
    window.location.hash = hashUrl;

    loadContent(getCurrentPath()).then(() => {
      if (section) {
        setTimeout(() => {
          const el = document.getElementById(section);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });
  }

  // Link tıklama yönetimi
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      const section = link.getAttribute('data-section');
      navigateTo(href, section);
      closeDropdowns();
    }
    
    // Footer scroll handler
    const footerLink = e.target.closest('.scroll-to-footer');
    if (footerLink) {
      e.preventDefault();
      const footer = document.querySelector('.site-footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      closeDropdowns();
    }
  });

  // Tarayıcı geri/ileri butonları ve hash değişiklikleri
  window.addEventListener('popstate', () => {
    loadContent(getCurrentPath());
  });

  window.addEventListener('hashchange', () => {
    loadContent(getCurrentPath());
  });

  // İlk yükleme - hash-based routing kullan
  loadContent(getCurrentPath());

  // add subtle shadow to header on scroll
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    const scrolled = window.scrollY > 48;
    header.classList.toggle('is-top', !scrolled);
    header.classList.toggle('is-scrolled', scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll reveal for sections
  function initRevealAnimations() {
    const revealEls = Array.from(document.querySelectorAll('.reveal:not(.in-view)'));
    if ('IntersectionObserver' in window && revealEls.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { root: null, threshold: 0.12 });
      revealEls.forEach((el, idx) => {
        const order = Number(el.getAttribute('data-reveal-order') || idx);
        const clamped = Math.max(0, Math.min(order, 20));
        el.style.transitionDelay = `${clamped * 60}ms`;
        io.observe(el);
      });
    } else {
      // fallback: show immediately
      revealEls.forEach((el) => el.classList.add('in-view'));
    }
  }

  initRevealAnimations();

  // Sayfa bazlı form bağlama
  function bindPageHandlers(path) {
    // Kayıt formu
    if (path === '/kayit') {
      const form = document.getElementById('signup-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = form.name?.value?.trim();
          const email = form.email?.value?.trim();
          const password = form.password?.value;
          const msg = document.getElementById('signup-msg');
          const submitBtn = form.querySelector('button[type="submit"]');
          const emailValid = !!email && /.+@.+\..+/.test(email);
          const passValid = typeof password === 'string' && password.length >= 6;
          if (!name || !email || !password) {
            if (msg) msg.textContent = 'Lütfen tüm alanları doldurun.';
            return;
          }
          if (!emailValid) { if (msg) msg.textContent = 'Geçerli bir e-posta giriniz.'; return; }
          if (!passValid) { if (msg) msg.textContent = 'Şifre en az 6 karakter olmalıdır.'; return; }
          try {
            if (window.TSGLAuth) {
              if (!window.TSGLAuth.isReady()) { if (msg) msg.textContent = 'Sistem yapılandırılmadı (Firebase).'; return; }
              if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Gönderiliyor...'; }
              await window.TSGLAuth.signUp({ name, email, password });
              if (msg) msg.textContent = 'Kayıt tamamlandı. Hesabınız onay bekliyor.';
              form.reset();
            } else {
              if (msg) msg.textContent = 'Sistem yapılandırılmadı (Firebase).';
            }
          } catch (err) {
            if (msg) msg.textContent = err.message || 'Kayıt sırasında hata oluştu.';
          }
          finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kayıt Ol'; }
          }
        });
      }
    }

    // Giriş formu
    if (path === '/giris') {
      const form = document.getElementById('login-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = form.email?.value?.trim();
          const password = form.password?.value;
          const msg = document.getElementById('login-msg');
          const submitBtn = form.querySelector('button[type="submit"]');
          const emailValid = !!email && /.+@.+\..+/.test(email);
          const passValid = typeof password === 'string' && password.length >= 6;
          if (!email || !password) {
            if (msg) msg.textContent = 'Lütfen tüm alanları doldurun.';
            return;
          }
          if (!emailValid) { if (msg) msg.textContent = 'Geçerli bir e-posta giriniz.'; return; }
          if (!passValid) { if (msg) msg.textContent = 'Şifre en az 6 karakter olmalıdır.'; return; }
          try {
            if (window.TSGLAuth) {
              if (!window.TSGLAuth.isReady()) { if (msg) msg.textContent = 'Sistem yapılandırılmadı (Firebase).'; return; }
              if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Giriş yapılıyor...'; }
              await window.TSGLAuth.login({ email, password });
              if (msg) msg.textContent = 'Giriş başarılı.';
              navigateTo('/');
            } else {
              if (msg) msg.textContent = 'Sistem yapılandırılmadı (Firebase).';
            }
          } catch (err) {
            if (msg) msg.textContent = err.message || 'Giriş sırasında hata oluştu.';
          }
          finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Giriş Yap'; }
          }
        });
      }
    }

    // Bağış/Aidat formu
    if (path === '/bagis') {
      initPaymentForm();
      
      // KVKK details link
      const kvkkLink = document.getElementById('kvkk-details-link');
      if (kvkkLink) {
        kvkkLink.addEventListener('click', (e) => {
          e.preventDefault();
          alert('KVKK Aydınlatma Metni\n\n' +
            'TSGL Derneği olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca:\n\n' +
            '• Bağış/aidat işlemleriniz için verdiğiniz ad-soyad, e-posta ve telefon bilgileriniz derneğimiz tarafından işlenir.\n' +
            '• Verileriniz yalnızca bağış/aidat takibi, iletişim ve bilgilendirme amacıyla kullanılır.\n' +
            '• Verileriniz üçüncü şahıslarla paylaşılmaz.\n' +
            '• Verilerinize erişim, düzeltme ve silme haklarınız bulunmaktadır.\n' +
            '• Talepleriniz için tsgldernegi@gmail.com adresine başvurabilirsiniz.\n\n' +
            'Detaylı bilgi için web sitemizin KVKK sayfasını ziyaret edebilirsiniz.');
        });
      }
    }
  }

  // Hero slider
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  const prev = document.querySelector('.hero-btn.prev');
  const next = document.querySelector('.hero-btn.next');
  const sliderWrap = document.querySelector('.hero');
  let current = 0;
  let timer = null;

  const activate = (idx) => {
    if (!slides.length) return;
    current = (idx + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === current);
      s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const start = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => activate(current + 1), 6000);
  };

  if (slides.length) {
    activate(0);
    start();

    const goPrev = () => { activate(current - 1); start(); };
    const goNext = () => { activate(current + 1); start(); };

    if (prev) prev.addEventListener('click', goPrev);
    if (next) next.addEventListener('click', goNext);
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = Number(dot.getAttribute('data-target') || '0');
        activate(idx);
        start();
      });
    });

    if (sliderWrap) {
      sliderWrap.addEventListener('pointerenter', () => timer && clearInterval(timer));
      sliderWrap.addEventListener('pointerleave', start);
    }
  }

  // Brand accent from logo: sample dominant color and set CSS variables
  const brandImg = document.querySelector('.brand-logo');
  function setAccentFromColor([r, g, b]) {
    const primary = `rgb(${r}, ${g}, ${b})`;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000; // contrast heuristic
    const contrast = yiq >= 140 ? '#0a1420' : '#f2f5fa';
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-contrast', contrast);
  }

  function extractDominantColor(img) {
    try {
      const cvs = document.createElement('canvas');
      const ctx = cvs.getContext('2d');
      if (!ctx) return null;
      const w = (cvs.width = Math.max(1, Math.min(64, img.naturalWidth)));
      const h = (cvs.height = Math.max(1, Math.min(64, img.naturalHeight)));
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, count = 0;
      // sample every 4th pixel to reduce cost
      for (let i = 0; i < data.length; i += 16) {
        const rr = data[i];
        const gg = data[i + 1];
        const bb = data[i + 2];
        const aa = data[i + 3];
        if (aa < 32) continue; // skip near-transparent
        r += rr; g += gg; b += bb; count++;
      }
      if (!count) return null;
      return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    } catch (e) {
      return null;
    }
  }

  if (brandImg) {
    const applyAccent = () => {
      const col = extractDominantColor(brandImg);
      if (col) setAccentFromColor(col);
    };
    if (brandImg.complete && brandImg.naturalWidth) {
      applyAccent();
    } else {
      brandImg.addEventListener('load', applyAccent);
    }
  }
  // === LIGHTBOX GALLERY ===
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-btn.prev');
  const lightboxNext = document.querySelector('.lightbox-btn.next');

  let galleryImages = [];
  let currentImageIndex = 0;

  function openLightbox(index) {
    if (!galleryImages.length) return;
    currentImageIndex = (index + galleryImages.length) % galleryImages.length;
    updateLightboxImage();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    const img = galleryImages[currentImageIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = img.alt || '';
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
  }

  function nextImage() {
    openLightbox(currentImageIndex + 1);
  }

  function prevImage() {
    openLightbox(currentImageIndex - 1);
  }

  // Event listeners for lightbox controls
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);

  // Close on overlay click
  const overlay = document.querySelector('.lightbox-overlay');
  if (overlay) overlay.addEventListener('click', closeLightbox);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    }
  });

  // Build gallery images list
  function updateGalleryList() {
    galleryImages = [];
    const images = document.querySelectorAll('figure.card img');
    images.forEach((img) => {
      galleryImages.push({
        src: img.src,
        alt: img.alt
      });
      img.style.cursor = 'pointer';
    });
  }

  // Event delegation for gallery images
  document.addEventListener('click', (e) => {
    if (!e.target.matches('figure.card img')) return;
    
    updateGalleryList();
    const clickedImg = e.target;
    const allImages = Array.from(document.querySelectorAll('figure.card img'));
    const index = allImages.indexOf(clickedImg);
    
    if (index !== -1) {
      openLightbox(index);
    }
  });

  // Initial setup
  updateGalleryList();

  // === FORMSUBMIT CONFIGURATION ===
  const FORMSUBMIT_EMAIL = 'tsgldernegi@gmail.com';
  const FORMSUBMIT_URL = `https://formsubmit.co/${FORMSUBMIT_EMAIL}`;

  // === PAYMENT FORM HANDLER ===
  function initPaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    const paymentTypeSelect = document.getElementById('payment-type');
    const donorNameGroup = document.getElementById('donor-name-group');
    const amountGroup = document.getElementById('amount-group');
    const membershipAmountGroup = document.getElementById('membership-amount-group');
    const emailGroup = document.getElementById('email-group');
    const phoneGroup = document.getElementById('phone-group');
    const paymentSummary = document.getElementById('payment-summary');
    const ibanSection = document.getElementById('iban-section');
    const backToFormBtn = document.getElementById('back-to-form-btn');
    const copyIbanBtn = document.getElementById('copy-iban-btn');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const donationAmountInput = document.getElementById('donation-amount');
    const summaryPhoneItem = document.getElementById('summary-phone-item');
    const summaryPhone = document.getElementById('summary-phone');
    const paymentSteps = document.querySelectorAll('.payment-step');
    const membershipPresetBtns = document.querySelectorAll('[data-membership-amount]');
    const summaryNoteItem = document.getElementById('summary-note-item');
    const summaryNote = document.getElementById('summary-note');
    const kvkkConsent = document.getElementById('kvkk-consent');

  const setStep = (step) => {
    if (!paymentSteps.length) return;
    paymentSteps.forEach((el) => {
      const currentStep = Number(el.dataset.step || '0');
      el.classList.toggle('current', currentStep === step);
      el.classList.toggle('active', currentStep <= step);
    });
  };

  if (paymentTypeSelect) {
    paymentTypeSelect.addEventListener('change', function() {
      const type = this.value;
      
      // Reset visibility
      donorNameGroup.style.display = 'none';
      amountGroup.style.display = 'none';
      membershipAmountGroup.style.display = 'none';
      emailGroup.style.display = 'none';
      phoneGroup.style.display = 'none';
      paymentSummary.style.display = 'none';
      ibanSection.style.display = 'none';
      setStep( type ? 2 : 1 );
      amountBtns.forEach(b => b.classList.remove('active'));
      donationAmountInput.value = '';
      
      // Show relevant fields based on selection
      if (type === 'donation') {
        donorNameGroup.style.display = 'block';
        amountGroup.style.display = 'block';
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'block';
      } else if (type === 'membership') {
        donorNameGroup.style.display = 'block';
        membershipAmountGroup.style.display = 'block';
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'block';
      } else if (type === 'both') {
        donorNameGroup.style.display = 'block';
        amountGroup.style.display = 'block';
        membershipAmountGroup.style.display = 'block';
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'block';
      }
    });

    // Amount button handlers
    amountBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        amountBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        donationAmountInput.value = this.dataset.amount;
        setStep(2);
      });
    });

    membershipPresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = btn.dataset.membershipAmount;
        membershipPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const feeInput = document.getElementById('membership-fee');
        if (feeInput && amount) feeInput.value = amount;
        setStep(2);
      });
    });

    // Form submission
    paymentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitBtn = paymentForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn?.textContent;
      
      const paymentType = paymentTypeSelect.value;
      
      if (!paymentType) {
        alert('Lütfen ödeme türünü seçiniz.');
        return;
      }

      let totalAmount = 0;
      let paymentTypeText = '';

      if (paymentType === 'donation') {
        const amount = parseFloat(donationAmountInput.value || 0);
        if (amount <= 0) {
          alert('Lütfen bağış tutarını giriniz.');
          donationAmountInput.focus();
          return;
        }
        totalAmount = amount;
        paymentTypeText = 'Bağış';
      } else if (paymentType === 'membership') {
        const membershipInput = document.getElementById('membership-fee');
        const membershipValue = parseFloat(membershipInput?.value || '0');
        if (!membershipValue || membershipValue <= 0) {
          alert('Lütfen aidat tutarını giriniz.');
          membershipInput?.focus();
          return;
        }
        totalAmount = membershipValue;
        paymentTypeText = 'Üyelik Aidatı';
      } else if (paymentType === 'both') {
        const donation = parseFloat(donationAmountInput.value || 0);
        if (donation <= 0) {
          alert('Lütfen bağış tutarını giriniz.');
          donationAmountInput.focus();
          return;
        }
        const membership = parseFloat(document.getElementById('membership-fee')?.value || '0');
        if (!membership || membership <= 0) {
          alert('Lütfen aidat tutarını giriniz.');
          document.getElementById('membership-fee')?.focus();
          return;
        }
        totalAmount = donation + membership;
        paymentTypeText = 'Bağış + Aidat';
      }

      const donorName = document.getElementById('donor-name').value.trim();
      const email = document.getElementById('donor-email').value.trim();
      const phone = document.getElementById('donor-phone').value.trim();
  const note = document.getElementById('message').value.trim();

      if (!donorName) {
        alert('Lütfen adınız soyadınızı giriniz.');
        document.getElementById('donor-name').focus();
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Lütfen geçerli bir e-posta adresi giriniz.');
        document.getElementById('donor-email').focus();
        return;
      }

      if (!phone || !/^0?[5][0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
        alert('Lütfen geçerli bir telefon numarası giriniz. (05XX XXX XX XX)');
        document.getElementById('donor-phone').focus();
        return;
      }

      // Check KVKK consent
      const kvkkCheckbox = document.getElementById('kvkk-consent');
      if (!kvkkCheckbox || !kvkkCheckbox.checked) {
        alert('Lütfen KVKK aydınlatma metnini okuyup onaylayınız.');
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Hazırlanıyor...';
      }

      // Update summary
      document.getElementById('summary-type').textContent = paymentTypeText;
      document.getElementById('summary-amount').textContent = totalAmount.toFixed(2) + ' ₺';
      document.getElementById('summary-name').textContent = donorName;
      document.getElementById('summary-email').textContent = email;
      if (summaryPhone) summaryPhone.textContent = phone;
      if (summaryNoteItem && summaryNote) {
        if (note) {
          summaryNote.textContent = note;
          summaryNoteItem.style.display = 'flex';
        } else {
          summaryNoteItem.style.display = 'none';
        }
      }

      // Show/hide summary items
      document.getElementById('summary-name-item').style.display = 'flex';
      document.getElementById('summary-email-item').style.display = 'flex';
      if (summaryPhoneItem) summaryPhoneItem.style.display = 'flex';

      // Hide form, show summary and IBAN
      paymentForm.style.display = 'none';
      paymentSummary.style.display = 'block';
      ibanSection.style.display = 'block';
      setStep(3);
      
      // Send email notification to dernek via FormSubmit
      const formData = new FormData();
      formData.append('_subject', `Yeni ${paymentTypeText} - ${donorName}`);
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');
      formData.append('İsim', donorName);
      formData.append('E-posta', email);
      formData.append('Telefon', phone);
      formData.append('Ödeme Türü', paymentTypeText);
      formData.append('Tutar', totalAmount.toFixed(2) + ' ₺');
      formData.append('Not', note || 'Yok');
      formData.append('Tarih', new Date().toLocaleString('tr-TR'));

      fetch(FORMSUBMIT_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(response => {
        if (response.ok) {
          console.log('✅ E-posta bildirimi başarıyla gönderildi');
        } else {
          console.warn('⚠️ E-posta gönderiminde sorun:', response.statusText);
        }
      })
      .catch(error => {
        console.error('❌ E-posta gönderimi başarısız:', error);
      });
      
      // Show success message with confetti
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText || '💠 IBAN\'ı Göster ve Özeti Oluştur';
        }
        if (window.showSuccessWithConfetti) {
          window.showSuccessWithConfetti(
            'Teşekkürler! 🎉', 
            'Bağış bilgileriniz hazırlandı. Lütfen IBAN bilgisini kullanarak ödeme yapın.'
          );
        }
      }, 300);
      
      // Scroll to payment summary section after DOM updates
      setTimeout(() => {
        const containerElement = paymentForm.closest('.payment-form-container');
        if (containerElement) {
          containerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    });

    // Back to form button
    if (backToFormBtn) {
      backToFormBtn.addEventListener('click', function() {
        paymentForm.style.display = 'block';
        paymentSummary.style.display = 'none';
        ibanSection.style.display = 'none';
        setStep(2);
        paymentTypeSelect.dispatchEvent(new Event('change'));
        window.scrollTo({ top: paymentForm.offsetTop - 100, behavior: 'smooth' });
      });
    }

    // Copy IBAN button
    if (copyIbanBtn) {
      copyIbanBtn.addEventListener('click', function() {
        const ibanInput = document.getElementById('iban-input');
        ibanInput.select();
        document.execCommand('copy');
        
        const originalText = copyIbanBtn.textContent;
        copyIbanBtn.textContent = '✓ Kopyalandı!';
        setTimeout(() => {
          copyIbanBtn.textContent = originalText;
        }, 2000);
      });
    }
  }

  }

  // === MOBILE BANK BUTTON HANDLER ===
  const mobileBankBtn = document.getElementById('bank-info-btn-mobile');
  if (mobileBankBtn) {
    mobileBankBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const bankModal = document.getElementById('bank-modal');
      if (bankModal) {
        bankModal.classList.add('active');
        bankModal.setAttribute('aria-hidden', 'false');
        // Menüyü kapat
        const navLeft = document.querySelector('.nav-left');
        if (navLeft && navLeft.classList.contains('mobile-active')) {
          navLeft.classList.remove('mobile-active');
          hamburger.classList.remove('active');
        }
      }
    });
  }

  // === SCROLL TO TOP BUTTON ===
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  
  if (scrollToTopBtn) {
    // Scroll event listener for showing/hiding button
    const handleScrollToTopVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 300) {
        scrollToTopBtn.classList.add('show');
        scrollToTopBtn.style.display = 'flex';
      } else {
        scrollToTopBtn.classList.remove('show');
        scrollToTopBtn.style.display = 'none';
      }
    };

    // Initial check
    handleScrollToTopVisibility();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScrollToTopVisibility, { passive: true });

    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // === CONFETTI ANIMATION ===
  function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;

    const colors = ['#1e40af', '#d4af37', '#ff6b6b', '#4ecdc4', '#ffe66d'];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confettiContainer.appendChild(confetti);
    }

    // Clean up after animation
    setTimeout(() => {
      confettiContainer.innerHTML = '';
    }, 5000);
  }

  function showSuccessMessage(message = 'Teşekkürler!', subtitle = 'İşleminiz başarıyla tamamlandı.') {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <div class="success-icon">✓</div>
      <h2>${message}</h2>
      <p>${subtitle}</p>
    `;
    document.body.appendChild(successDiv);

    // Show message with animation
    setTimeout(() => {
      successDiv.classList.add('show');
    }, 100);

    // Trigger confetti
    createConfetti();

    // Hide and remove after 3 seconds
    setTimeout(() => {
      successDiv.classList.remove('show');
      setTimeout(() => {
        successDiv.remove();
      }, 500);
    }, 3000);
  }

  // Make confetti function globally accessible
  window.showSuccessWithConfetti = showSuccessMessage;

  // Hide loader when page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (pageLoader) {
        pageLoader.classList.add('hidden');
      }
    }, 500);
  });

  // === SCROLL TO TOP BUTTON ===
  if (scrollUpBtn) {
    scrollUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

})();



