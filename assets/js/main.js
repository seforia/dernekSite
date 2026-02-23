(function () {
  // === ULTRA SMOOTH SCROLL HELPER ===
  // Yavaş ve yumuşak scroll animasyonu
  function smoothScroll(targetScrollY, duration = 1500) {
    const startScrollY = window.scrollY || window.pageYOffset;
    const distance = targetScrollY - startScrollY;
    const startTime = performance.now();

    // Easing function - çok yumuşak cubic easing
    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      const currentScrollY = startScrollY + distance * easedProgress;

      window.scrollTo(0, currentScrollY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // === SMOOTH SCROLL FOR ANCHOR LINKS ===
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const targetTop = target.offsetTop - 80; // header offset
    smoothScroll(targetTop, 1500); // 1.5 saniye smooth scroll
  }, true);

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
  const scrollUpBtn = document.querySelector('.scroll-to-top-button');
  const scrollProgress = document.getElementById('scrollProgress');
  const progressCircle = document.getElementById('progressCircle');
  
  // DEBUG
  console.log('Button element:', scrollUpBtn);
  console.log('Container element:', scrollProgress);
  // Sayfa başladığında is-top class'ını ekle
  if (siteHeader) {
    siteHeader.classList.add('is-top');
  }
  
  let lastScroll = 0;
  let scrollDirection = 'down';
  const SCROLL_THRESHOLD = 80;
  const HIDE_SCROLL_THRESHOLD = 100;

  function updateHeaderState() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // DEBUG - Her çağrıda log
    if (currentScroll > HIDE_SCROLL_THRESHOLD || currentScroll !== lastScroll) {
      console.log('updateHeaderState called - Scroll:', currentScroll, 'LastScroll:', lastScroll, 'Threshold:', HIDE_SCROLL_THRESHOLD);
    }
    
    // Header hidden/show logic
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
        if (!scrollUpBtn.classList.contains('visible')) {
          scrollUpBtn.classList.add('visible');
          console.log('Button VISIBLE ADDED');
        }
      } else {
        if (scrollUpBtn.classList.contains('visible')) {
          scrollUpBtn.classList.remove('visible');
          console.log('Button VISIBLE REMOVED');
        }
      }
    }
    
    lastScroll = currentScroll;
  }

  // Sayfa yüklendiğinde kontrol et
  updateHeaderState();

  // Scroll olayında kontrol et - Poll method (setInterval)
  setInterval(updateHeaderState, 200);
  
  // Scroll to top button click handler
  if (scrollUpBtn) {
    scrollUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Button clicked, scrolling to top');
      const smoothScroll = () => {
        const start = window.scrollY;
        const duration = 1000;
        const startTime = performance.now();
        
        const easeInOutCubic = (t) => {
          return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = easeInOutCubic(progress);
          const currentScroll = start * (1 - easeProgress);
          
          window.scrollTo(0, currentScroll);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      };
      
      smoothScroll();
    });
  }
  
  // === SMOOTH SCROLL PAGE NAVIGATION ===
  // Sayfalar arası soft geçişler için fade animasyonu
  const createPageTransitionEffect = () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pageTransitionIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pageTransitionOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
      
      html.page-transitioning {
        pointer-events: none;
      }
      
      main {
        animation: pageTransitionIn 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
    `;
    document.head.appendChild(style);
  };
  
  createPageTransitionEffect();

  // === MOBILE MENU SYSTEM - COMPLETELY REWRITTEN ===
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLeft = document.querySelector('.nav-left');
  const navRight = document.querySelector('.nav-right');
  let mobileOverlay = document.querySelector('.mobile-nav-overlay');

  // Create overlay if not exists
  if (!mobileOverlay && mobileMenuToggle) {
    mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-nav-overlay';
    document.body.appendChild(mobileOverlay);
  }

  // Mobile menu state
  let mobileMenuOpen = false;

  const openMobileMenu = () => {
    mobileMenuOpen = true;
    mobileMenuToggle?.classList.add('active');
    navLeft?.classList.add('mobile-active');
    mobileOverlay?.classList.add('active');
    mobileMenuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileMenu = () => {
    mobileMenuOpen = false;
    mobileMenuToggle?.classList.remove('active');
    navLeft?.classList.remove('mobile-active');
    navRight?.classList.remove('mobile-active');
    mobileOverlay?.classList.remove('active');
    mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    // Close all dropdowns when closing menu - CSS handles animation via .open class
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  // Hamburger button click
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  // Overlay click
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileMenu();
    });
  }

  // === DROPDOWN SYSTEM - MOBILE & DESKTOP ===
  const MOBILE_BREAKPOINT = 1024;
  const isMobileView = () => window.innerWidth <= MOBILE_BREAKPOINT;

  // Initialize dropdown triggers with proper ARIA attributes
  document.querySelectorAll('.nav-dropdown > a').forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
  });

  // MOBILE: Click handler for dropdown toggles (accordion)
  document.addEventListener('click', (e) => {
    // Only in mobile view
    if (!isMobileView()) return;
    
    const trigger = e.target.closest('.nav-dropdown > a');
    if (!trigger) return;
    
    // Don't navigate to #
    if (trigger.getAttribute('href') === '#') {
      e.preventDefault();
    }
    
    e.stopPropagation();
    
    const dropdown = trigger.closest('.nav-dropdown');
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('open');
    
    // Close all dropdowns
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
      d.classList.remove('open');
      const t = d.querySelector(':scope > a');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
    
    // Toggle current
    if (!isOpen) {
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  // MOBILE: Close submenu items and navigate
  document.addEventListener('click', (e) => {
    if (!isMobileView()) return;
    
    const link = e.target.closest('.submenu-card, .nav-left a:not(.nav-dropdown > a)');
    if (!link) return;
    
    const href = link.getAttribute('href') || '';
    
    // Close menu for navigation
    if (href && href !== '#' && !href.startsWith('#footer')) {
      closeMobileMenu();
    } else if (href.startsWith('#footer')) {
      e.preventDefault();
      closeMobileMenu();
      const footer = document.querySelector('.site-footer');
      if (footer) {
        smoothScroll(footer.offsetTop - 80, 1500);
      }
    }
  });

  // DESKTOP: Hover support for dropdowns
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    dropdown.addEventListener('mouseenter', () => {
      if (isMobileView()) return;
      dropdown.classList.add('open');
      const trigger = dropdown.querySelector(':scope > a');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    });
    
    dropdown.addEventListener('mouseleave', () => {
      if (isMobileView()) return;
      dropdown.classList.remove('open');
      const trigger = dropdown.querySelector(':scope > a');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });

  // DESKTOP: Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (isMobileView()) return;
    if (e.target.closest('.nav-dropdown')) return;
    
    document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      const trigger = dropdown.querySelector(':scope > a');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
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
    '/giris': { title: 'Üye Girişi | TSGL Derneği', content: 'content/giris/index.html' },
    '/giris.html': { title: 'Üye Girişi | TSGL Derneği', content: 'content/giris/index.html' },
    '/admin': { title: 'Admin Paneli | TSGL Derneği', content: 'content/admin/index.html' },
    '/admin.html': { title: 'Admin Paneli | TSGL Derneği', content: 'content/admin/index.html' },
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
    '/basari-oykuleri.html': { title: 'Başarı Öykülerimiz | TSGL Derneği', content: 'content/basari-oykuleri/index.html' },
    '/etkinlikler': { title: 'Etkinlikler | TSGL Derneği', content: 'content/etkinlikler/index.html' },
    '/etkinlikler.html': { title: 'Etkinlikler | TSGL Derneği', content: 'content/etkinlikler/index.html' },
    '/anketler': { title: 'Anketler | TSGL Derneği', content: 'content/anketler/index.html' },
    '/anketler.html': { title: 'Anketler | TSGL Derneği', content: 'content/anketler/index.html' },
    '/anma': { title: 'Anma Köşesi | TSGL Derneği', content: 'content/anma/index.html' },
    '/anma.html': { title: 'Anma Köşesi | TSGL Derneği', content: 'content/anma/index.html' },
    '/urunlerimiz': { title: 'Ürünlerimiz | TSGL Derneği', content: 'content/urunlerimiz/index.html' },
    '/urunlerimiz.html': { title: 'Ürünlerimiz | TSGL Derneği', content: 'content/urunlerimiz/index.html' },
    '/toplanti-tutanaklari': { title: 'Toplantı Tutanakları | TSGL Derneği', content: 'content/toplantisutaniklari/index.html' },
    '/toplanti-tutanaklari.html': { title: 'Toplantı Tutanakları | TSGL Derneği', content: 'content/toplantisutaniklari/index.html' }
  };

  const homeContent = document.getElementById('home-content');
  const dynamicContent = document.getElementById('dynamic-content');
  const mainContent = document.querySelector('[data-main-content]');

  const isYazilarPath = (path) => {
    if (!path) return false;
    const decoded = decodeURIComponent(String(path));
    const cleaned = decoded.split('?')[0].replace(/\.html$/, '').replace(/\/+$/, '');
    const normalized = cleaned.toLowerCase().replace(/ı/g, 'i');
    return normalized === '/yazilar';
  };

  const isAdminPath = (path) => {
    if (!path) return false;
    const decoded = decodeURIComponent(String(path));
    const cleaned = decoded.split('?')[0].replace(/\.html$/, '').replace(/\/+$/, '');
    return cleaned === '/admin';
  };

  const isGirisPath = (path) => {
    if (!path) return false;
    const decoded = decodeURIComponent(String(path));
    const cleaned = decoded.split('?')[0].replace(/\.html$/, '').replace(/\/+$/, '');
    return cleaned === '/giris';
  };

  function getCurrentPath() {
    // GitHub Pages ve file: protokolü için hash-based routing kullan
    const h = window.location.hash.replace(/^#/, '');
    const decoded = decodeURIComponent(h);
    const hashPath = decoded.split('?')[0];
    const cleaned = hashPath ? `/${hashPath.replace(/^\/+/, '').replace(/\.html$/, '')}` : '/';
    return cleaned;
  }

  async function loadContent(path) {
    // Admin paneline özel yönlendirme (Yazılar gibi)
    if (isAdminPath(path)) {
      const base = getBasePath();
      window.location.href = `${base}content/admin/index.html`;
      return;
    }

    // Giriş sayfasına özel yönlendirme (Script'lerin çalışması için)
    if (isGirisPath(path)) {
      const base = getBasePath();
      window.location.href = `${base}content/giris/index.html`;
      return;
    }

    if (isYazilarPath(path)) {
      const base = getBasePath();
      const hash = window.location.hash.replace(/^#/, '');
      const decoded = decodeURIComponent(hash);
      const hashQuery = decoded.includes('?') ? decoded.split('?')[1] : '';
      const querySuffix = hashQuery ? `?${hashQuery}` : '';
      window.location.href = `${base}content/yazılar/index.html${querySuffix}`;
      return;
    }

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
    const cleanUrl = String(url || '').replace(/\.html$/, '');
    if (isYazilarPath(cleanUrl)) {
      const base = getBasePath();
      window.location.href = `${base}content/yazılar/index.html`;
      return;
    }
    const hashUrl = `#${cleanUrl.replace(/^\//, '')}`;
    window.location.hash = hashUrl;

    loadContent(getCurrentPath()).then(() => {
      if (section) {
        setTimeout(() => {
          const el = document.getElementById(section);
          if (el) {
            const targetTop = el.offsetTop - 80;
            smoothScroll(targetTop, 1500);
          }
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
        const footerTop = footer.offsetTop - 80;
        smoothScroll(footerTop, 1500);
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
          const containerTop = containerElement.offsetTop - 80;
          smoothScroll(containerTop, 1500);
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



  // === SCROLL TO TOP BUTTON ===
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  
  if (scrollToTopBtn) {
    // Scroll event listener for showing/hiding button
    const handleScrollToTopVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 300) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
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

  // === LOAD RECENT POSTS ON HOMEPAGE ===
  async function loadRecentPosts() {
    const container = document.getElementById('recent-posts-list');
    if (!container) return; // Not on homepage

    try {
      // Wait for Firebase to be ready
      if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
        console.log('Firebase not ready, skipping recent posts');
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>Yazılar yüklenemedi</p></div>';
        return;
      }

      // Get latest 5 posts
      const result = await window.TSGLAuth.getPosts(5);
      const posts = result.posts;

      if (!posts || posts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>Henüz yazı yok</p></div>';
        return;
      }

      // Create post cards
      container.innerHTML = '';
      posts.forEach(post => {
        const card = document.createElement('a');
        card.className = 'history-side-card';
        card.href = 'content/yazılar/index.html';
        
        const excerpt = post.content ? post.content.substring(0, 80) + '...' : 'Detaylar için tıklayın';
        const dateStr = post.createdAt && post.createdAt.toDate ? 
          post.createdAt.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 
          'Tarih bilinmiyor';
        
        // Use post image if available, otherwise use default
        const imgSrc = post.imageUrl || 'assets/img/tsglFoto2.png';
        const isBase64 = imgSrc.startsWith('data:image');
        
        card.innerHTML = `
          ${isBase64 ? 
            `<div style="width: 100%; height: 150px; overflow: hidden; border-radius: 8px;">
              <img src="${imgSrc}" alt="${escapeHtml(post.title)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>` :
            `<img src="${imgSrc}" alt="${escapeHtml(post.title)}" loading="lazy" />`
          }
          <div class="history-side-body">
            <h4>${escapeHtml(post.title)}</h4>
            <time>${dateStr}</time>
            <p>${escapeHtml(excerpt)}</p>
          </div>
        `;
        
        container.appendChild(card);
      });

      console.log('✅ Ana sayfada', posts.length, 'yazı gösteriliyor');
    } catch (error) {
      console.error('Recent posts yüklenirken hata:', error);
      container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #999;"><p>Yazılar yüklenemedi</p></div>';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load recent posts after Firebase is ready
  setTimeout(() => {
    if (window.TSGLAuth && window.TSGLAuth.isReady()) {
      loadRecentPosts();
    }
  }, 1000);

  // === SCROLL TO TOP BUTTON ===
  if (scrollUpBtn) {
    scrollUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      smoothScroll(0, 1500); // 1.5 saniye içinde yukarı scroll
    });
  }

})();



