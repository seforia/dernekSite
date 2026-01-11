(function(){
  // Safe guards
  if (!window || !window.firebase || !window.FIREBASE_CONFIG) {
    console.warn('Firebase not initialized yet. Fill assets/js/firebase-config.js');
    return;
  }

  // Config sanity
  function isConfigFilled(cfg) {
    const vals = Object.values(cfg || {});
    return vals.length >= 5 && vals.every(v => typeof v === 'string' && !v.includes('REPLACE_ME'));
  }

  let ready = false;

  // Initialize Firebase
  const app = firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();
  ready = isConfigFilled(window.FIREBASE_CONFIG);

  // Render auth UI in header
  function renderAuthUI(user) {
    const mount = document.getElementById('auth-ui');
    if (!mount) return;
    if (!ready) {
      mount.innerHTML = `
        <div class="auth-dropdown" data-auth-dropdown>
          <button class="auth-trigger btn secondary" aria-haspopup="true" aria-expanded="false">Kullanıcı Girişi</button>
          <div class="auth-menu" role="menu" aria-hidden="true">
            <div class="auth-menu-note">Firebase yapılandırılmadı.</div>
            <a role="menuitem" tabindex="-1" class="disabled">Giriş Yap</a>
            <a role="menuitem" tabindex="-1" class="disabled">Kayıt Ol</a>
          </div>
        </div>`;
      // continue to bind dropdown interactions
    } else if (user && user.displayName) {
      mount.innerHTML = `<span class="auth-welcome">Hoş geldiniz, ${escapeHtml(user.displayName)}</span> <button class="btn ghost" id="logout-btn">Çıkış</button>`;
    } else if (user) {
      mount.innerHTML = `<span class="auth-welcome">Hoş geldiniz</span> <button class="btn ghost" id="logout-btn">Çıkış</button>`;
    } else {
      mount.innerHTML = `
        <div class="auth-dropdown" data-auth-dropdown>
          <button class="auth-trigger btn secondary" aria-haspopup="true" aria-expanded="false">Kullanıcı Girişi</button>
          <div class="auth-menu" role="menu" aria-hidden="true">
            <a role="menuitem" href="/giris" data-link>Giriş Yap</a>
            <a role="menuitem" href="/kayit" data-link>Kayıt Ol</a>
          </div>
        </div>`;
    }
    const logout = document.getElementById('logout-btn');
    if (logout) logout.addEventListener('click', () => auth.signOut());

    // dropdown interactions
    const dd = mount.querySelector('[data-auth-dropdown]');
    const trigger = mount.querySelector('.auth-trigger');
    const menu = mount.querySelector('.auth-menu');
    if (dd && trigger && menu) {
      const open = () => { dd.classList.add('open'); trigger.setAttribute('aria-expanded','true'); menu.setAttribute('aria-hidden','false'); };
      const close = () => { dd.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); };
      trigger.addEventListener('click', (e) => { e.preventDefault(); dd.classList.toggle('open'); const isOpen = dd.classList.contains('open'); trigger.setAttribute('aria-expanded', String(isOpen)); menu.setAttribute('aria-hidden', String(!isOpen)); });
      dd.addEventListener('mouseenter', open);
      dd.addEventListener('mouseleave', close);
      document.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (!dd.contains(t)) close();
      });
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
  }

  // Sign up with approval flow
  async function signUp({ name, email, password }) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    await db.collection('users').doc(cred.user.uid).set({
      uid: cred.user.uid,
      name,
      email,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return cred.user;
  }

  // Login checks approval status
  async function login({ email, password }) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection('users').doc(cred.user.uid).get();
    const data = doc.exists ? doc.data() : null;
    if (!data || data.status !== 'approved') {
      await auth.signOut();
      throw new Error('Hesabınız onay bekliyor. Lütfen yönetici onayını bekleyiniz.');
    }
    return cred.user;
  }

  // Expose minimal API
  async function ping() {
    try {
      await db.collection('_health').doc('ping').get();
      return true;
    } catch(e) {
      return false;
    }
  }

  window.TSGLAuth = { auth, db, signUp, login, isReady: () => ready, ping };

  // Update header on auth state change
  auth.onAuthStateChanged((user) => renderAuthUI(user));
})();
