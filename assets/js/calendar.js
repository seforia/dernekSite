/* TSGL Derneği — Etkinlik Takvimi
   Firebase Firestore `events` koleksiyonu ile senkronize.
   collection schema:
     title: string
     description: string (optional)
     date: Timestamp
     createdBy: uid
     createdByName: string
     createdAt: Timestamp
*/
(function () {
  'use strict';

  const MOUNT_ID = 'tsgl-calendar';
  const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                     'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const TR_DAYS   = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

  let currentYear  = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-indexed
  let eventsCache     = [];  // [{id, title, description, date:Date, createdBy, createdByName}]
  let rsvpCache       = {};  // { eventId: [{id, name, willAttend}] }
  let unsubscribe     = null;
  let rsvpUnsubscribe = null;
  let dbRef           = null;
  let authRef         = null;

  // ───── Utilities ─────────────────────────────────────────────
  function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function fromDateKey(key) { const [y,m,d] = key.split('-').map(Number); return new Date(y, m-1, d); }
  function todayKey() { const n=new Date(); return dateKey(n.getFullYear(), n.getMonth(), n.getDate()); }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ───── Render ─────────────────────────────────────────────────
  function renderCalendar() {
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) return;

    // Bugünün başlangıcı — geçmiş etkinlikler gösterilmez
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeEvents = eventsCache.filter(ev => ev.date >= todayStart);

    // Group events by key
    const eventsByDay = {};
    activeEvents.forEach(ev => {
      const k = dateKey(ev.date.getFullYear(), ev.date.getMonth(), ev.date.getDate());
      if (!eventsByDay[k]) eventsByDay[k] = [];
      eventsByDay[k].push(ev);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Mon=0 offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const today = todayKey();
    const isLoggedIn = authRef && authRef.currentUser;

    // Build header
    let html = `
      <div class="cal-wrap">
        <div class="cal-header">
          <button class="cal-nav-btn" id="cal-prev" aria-label="Önceki ay">&#8249;</button>
          <div class="cal-month-label">${TR_MONTHS[currentMonth]} ${currentYear}</div>
          <button class="cal-nav-btn" id="cal-next" aria-label="Sonraki ay">&#8250;</button>
        </div>
        ${isLoggedIn ? `<div class="cal-add-row"><button class="btn primary cal-add-event-btn" id="cal-add-btn">+ Etkinlik Ekle</button></div>` : `<div class="cal-add-row cal-login-hint">Etkinlik eklemek için <a href="/giris.html" data-link>giriş yapın</a>.</div>`}
        <div class="cal-grid-head">
          ${TR_DAYS.map(d=>`<div class="cal-day-name">${d}</div>`).join('')}
        </div>
        <div class="cal-grid" id="cal-grid">`;

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      html += `<div class="cal-cell cal-empty"></div>`;
    }

    // Day cells
    for (let day = 1; day <= totalDays; day++) {
      const k = dateKey(currentYear, currentMonth, day);
      const isToday = k === today;
      const dayEvents = eventsByDay[k] || [];
      const haEvents = dayEvents.length > 0;

      html += `<div class="cal-cell${isToday ? ' cal-today' : ''}${haEvents ? ' cal-has-events' : ''}" data-key="${k}" data-day="${day}">
        <span class="cal-day-num">${day}</span>`;
      if (haEvents) {
        html += `<div class="cal-dots">${dayEvents.slice(0,3).map(()=>'<span class="cal-dot"></span>').join('')}</div>`;
      }
      html += `</div>`;
    }

    html += `</div>`; // cal-grid

    // Event list for upcoming events this month
    const thisMonthEvents = activeEvents
      .filter(ev => ev.date.getFullYear() === currentYear && ev.date.getMonth() === currentMonth)
      .sort((a,b) => a.date - b.date);

    if (thisMonthEvents.length) {
      html += `<div class="cal-event-list"><h3 class="cal-event-list-title">Bu Aydaki Etkinlikler</h3><ul class="cal-events-ul">`;
      thisMonthEvents.forEach(ev => {
        const dayNum = ev.date.getDate();
        const wday = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][ev.date.getDay()];
        const evRsvp   = rsvpCache[ev.id] || [];
        const yesRsvp  = evRsvp.filter(r => r.willAttend);
        const noRsvp   = evRsvp.filter(r => !r.willAttend);
        html += `<li class="cal-event-item" data-id="${esc(ev.id)}">
          ${ev.imageUrl ? `<div class="cal-event-poster"><img src="${esc(ev.imageUrl)}" alt="${esc(ev.title)}" loading="lazy" class="cal-poster-thumb" data-src="${esc(ev.imageUrl)}" /></div>` : ''}
          <div class="cal-event-body">
            <span class="cal-event-date-badge">${dayNum} ${TR_MONTHS[ev.date.getMonth()]}</span>
            <div class="cal-event-info">
              <strong>${esc(ev.title)}</strong>
              ${ev.description ? `<p>${esc(ev.description)}</p>` : ''}
              <small>${wday} &bull; ${esc(ev.createdByName || 'Üye')}</small>
            </div>
            ${isLoggedIn && authRef.currentUser && authRef.currentUser.uid === ev.createdBy
              ? `<button class="cal-delete-btn" data-id="${esc(ev.id)}" aria-label="Etkinliği sil" title="Sil">✕</button>`
              : ''}
          </div>
          <div class="cal-rsvp" data-event-id="${esc(ev.id)}">
            <div class="cal-rsvp-counts">
              <span class="cal-rsvp-yes-count">✅ ${yesRsvp.length} katılıyor</span>
              <span class="cal-rsvp-sep">·</span>
              <span class="cal-rsvp-no-count">❌ ${noRsvp.length} katılmıyor</span>
            </div>
            ${yesRsvp.length ? `<div class="cal-rsvp-names-row"><span class="cal-rsvp-names-label">Katılacaklar:</span> ${yesRsvp.map(r=>`<span class="cal-rsvp-chip cal-rsvp-chip--yes">${esc(r.name)}</span>`).join('')}</div>` : ''}
            ${noRsvp.length  ? `<div class="cal-rsvp-names-row"><span class="cal-rsvp-names-label">Katılmayacaklar:</span> ${noRsvp.map(r=>`<span class="cal-rsvp-chip cal-rsvp-chip--no">${esc(r.name)}</span>`).join('')}</div>` : ''}
            <div class="cal-rsvp-btns">
              <button class="cal-rsvp-btn cal-rsvp-yes-btn" data-event-id="${esc(ev.id)}">✅ Katılacağım</button>
              <button class="cal-rsvp-btn cal-rsvp-no-btn" data-event-id="${esc(ev.id)}">❌ Katılmayacağım</button>
            </div>
            <form class="cal-rsvp-form" data-event-id="${esc(ev.id)}" data-will-attend="" hidden>
              <input type="text" class="cal-rsvp-name-input" placeholder="Adınız Soyadınız" maxlength="60" required />
              <div class="cal-rsvp-form-actions">
                <button type="submit" class="cal-rsvp-submit">Gönder</button>
                <button type="button" class="cal-rsvp-cancel">İptal</button>
              </div>
              <p class="cal-rsvp-msg" hidden></p>
            </form>
          </div>
        </li>`;
      });
      html += `</ul></div>`;
    } else {
      html += `<p class="cal-no-events">Bu ay henüz etkinlik eklenmemiş.</p>`;
    }

    html += `</div>`; // cal-wrap

    // Modal (hidden by default)
    html += `
      <div class="cal-modal-overlay" id="cal-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title" hidden>
        <div class="cal-modal">
          <div class="cal-modal-header">
            <h3 id="cal-modal-title">Yeni Etkinlik</h3>
            <button class="cal-modal-close" id="cal-modal-close" aria-label="Kapat">✕</button>
          </div>
          <div class="cal-modal-body">
            <form id="cal-add-form" class="cal-form" novalidate>
              <label for="cal-input-title">Başlık *</label>
              <input id="cal-input-title" type="text" placeholder="Etkinlik adı" required maxlength="120" />
              <label for="cal-input-date">Tarih *</label>
              <input id="cal-input-date" type="date" required />
              <label for="cal-input-desc">Açıklama</label>
              <textarea id="cal-input-desc" rows="3" placeholder="Kısa açıklama (isteğe bağlı)" maxlength="400"></textarea>
              <label for="cal-input-poster">Afiş / Görsel <span style="font-weight:400;font-size:.85rem;color:#888;">(isteğe bağlı, max 8 MB)</span></label>
              <div class="cal-poster-drop" id="cal-poster-drop">
                <input type="file" id="cal-input-poster" accept="image/*" style="display:none;" />
                <div class="cal-poster-preview" id="cal-poster-preview" hidden></div>
                <label for="cal-input-poster" class="cal-poster-label" id="cal-poster-label">
                  <span style="font-size:1.4rem;">🖼️</span>
                  <span>Görsel seç ya da sürükle bırak</span>
                </label>
              </div>
              <p id="cal-form-msg" class="cal-form-msg" hidden></p>
              <div class="cal-form-actions">
                <button type="submit" class="btn primary" id="cal-submit-btn">Kaydet</button>
                <button type="button" class="btn ghost" id="cal-cancel-btn">Vazgeç</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;

    // Day detail popup container
    html += `<div class="cal-popup" id="cal-popup" hidden></div>`;

    // Lightbox container
    html += `
      <div class="cal-lightbox" id="cal-lightbox" hidden aria-modal="true" role="dialog">
        <button class="cal-lightbox-close" id="cal-lightbox-close" aria-label="Kapat">&times;</button>
        <img class="cal-lightbox-img" id="cal-lightbox-img" src="" alt="Afiş" />
      </div>`;

    mount.innerHTML = html;
    bindEvents(mount);
    bindRsvpEvents(mount);
  }

  // ───── Bind UI events ─────────────────────────────────────────
  function bindEvents(mount) {
    // Navigation
    const prevBtn = mount.querySelector('#cal-prev');
    const nextBtn = mount.querySelector('#cal-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { navigate(-1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { navigate(1); });

    // Add event button
    const addBtn = mount.querySelector('#cal-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => openModal());

    // Modal close
    const closeBtn = mount.querySelector('#cal-modal-close');
    const cancelBtn = mount.querySelector('#cal-cancel-btn');
    const overlay = mount.querySelector('#cal-modal-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Form submit
    const form = mount.querySelector('#cal-add-form');
    if (form) form.addEventListener('submit', handleAddEvent);

    // Poster: file change + drag-drop
    const posterInput   = mount.querySelector('#cal-input-poster');
    const posterDrop    = mount.querySelector('#cal-poster-drop');
    const posterLabel   = mount.querySelector('#cal-poster-label');
    const posterPreview = mount.querySelector('#cal-poster-preview');
    if (posterInput) {
      posterInput.addEventListener('change', () => _previewPoster(posterInput, posterPreview, posterLabel));
    }
    if (posterDrop) {
      posterDrop.addEventListener('dragover', e => { e.preventDefault(); posterDrop.classList.add('cal-poster-dragover'); });
      posterDrop.addEventListener('dragleave', () => posterDrop.classList.remove('cal-poster-dragover'));
      posterDrop.addEventListener('drop', e => {
        e.preventDefault();
        posterDrop.classList.remove('cal-poster-dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/') && posterInput) {
          try { const dt = new DataTransfer(); dt.items.add(file); posterInput.files = dt.files; } catch(_){}
          _previewPoster(posterInput, posterPreview, posterLabel, file);
        }
      });
    }

    // Day cell click — show popup
    mount.querySelectorAll('.cal-cell[data-key]').forEach(cell => {
      cell.addEventListener('click', () => showDayPopup(cell.dataset.key));
    });

    // Delete event buttons
    mount.querySelectorAll('.cal-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEvent(btn.dataset.id);
      });
    });

    // Poster lightbox
    mount.querySelectorAll('.cal-poster-thumb').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const lb    = document.getElementById('cal-lightbox');
        const lbImg = document.getElementById('cal-lightbox-img');
        if (!lb || !lbImg) return;
        lbImg.src  = img.dataset.src;
        lbImg.alt  = img.alt;
        lb.hidden  = false;
        document.body.style.overflow = 'hidden';
      });
    });

    // Close lightbox
    const lb     = mount.querySelector('#cal-lightbox');
    const lbClose = mount.querySelector('#cal-lightbox-close');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lb)      lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

    // Close popup on outside click
    document.addEventListener('click', onDocClick, { once: true });
  }

  function closeLightbox() {
    const lb = document.getElementById('cal-lightbox');
    if (lb) lb.hidden = true;
    document.body.style.overflow = '';
  }


  // ───── RSVP ───────────────────────────────────────────────────
  function bindRsvpEvents(mount) {
    // Yes/No buttons → show name form
    mount.querySelectorAll('.cal-rsvp-yes-btn, .cal-rsvp-no-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId   = btn.dataset.eventId;
        const willAttend = btn.classList.contains('cal-rsvp-yes-btn');
        const rsvpDiv   = btn.closest('.cal-rsvp');
        if (!rsvpDiv) return;
        const form = rsvpDiv.querySelector('.cal-rsvp-form');
        if (!form) return;
        form.dataset.willAttend = willAttend ? 'yes' : 'no';
        form.hidden = false;
        form.querySelector('.cal-rsvp-name-input')?.focus();
        // Update button highlight
        rsvpDiv.querySelectorAll('.cal-rsvp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Cancel
    mount.querySelectorAll('.cal-rsvp-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const form = btn.closest('.cal-rsvp-form');
        if (form) { form.hidden = true; form.reset(); }
        btn.closest('.cal-rsvp')?.querySelectorAll('.cal-rsvp-btn').forEach(b => b.classList.remove('active'));
      });
    });

    // Submit
    mount.querySelectorAll('.cal-rsvp-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nameVal   = form.querySelector('.cal-rsvp-name-input')?.value.trim();
        const eventId   = form.dataset.eventId;
        const willAttend = form.dataset.willAttend === 'yes';
        const msgEl     = form.querySelector('.cal-rsvp-msg');
        const submitBtn = form.querySelector('.cal-rsvp-submit');
        if (!nameVal) {
          if (msgEl) { msgEl.textContent = 'Lütfen adınızı girin.'; msgEl.hidden = false; }
          return;
        }
        if (!dbRef) {
          if (msgEl) { msgEl.textContent = 'Bağlantı hatası.'; msgEl.hidden = false; }
          return;
        }
        if (submitBtn) submitBtn.disabled = true;
        try {
          await dbRef.collection('rsvp').add({
            eventId,
            name: nameVal,
            willAttend,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          form.hidden = true;
          form.reset();
          form.closest('.cal-rsvp')?.querySelectorAll('.cal-rsvp-btn').forEach(b => b.classList.remove('active'));
        } catch (err) {
          if (msgEl) { msgEl.textContent = '❌ Gönderilemedi: ' + (err.message || err); msgEl.hidden = false; }
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    });
  }

  // ───── RSVP Sync ────────────
  function startRsvpSync() {
    if (!dbRef) return;
    if (rsvpUnsubscribe) rsvpUnsubscribe();
    rsvpUnsubscribe = dbRef.collection('rsvp')
      .onSnapshot(snap => {
        rsvpCache = {};
        snap.forEach(doc => {
          const d = doc.data();
          if (!d.eventId) return;
          if (!rsvpCache[d.eventId]) rsvpCache[d.eventId] = [];
          rsvpCache[d.eventId].push({ id: doc.id, name: d.name || '?', willAttend: !!d.willAttend });
        });
        renderCalendar();
      }, err => { console.warn('RSVP sync error:', err); });
  }

  function onDocClick(e) {
    const popup = document.getElementById('cal-popup');
    if (popup && !popup.hidden && !popup.contains(e.target) && !e.target.closest('.cal-cell')) {
      popup.hidden = true;
    }
    // Re-register
    setTimeout(() => document.addEventListener('click', onDocClick, { once: true }), 0);
  }

  // ───── Navigate ───────────────────────────────────────────────
  function navigate(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
    renderCalendar();
    // Scroll to calendar
    const mount = document.getElementById(MOUNT_ID);
    if (mount) mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ───── Day popup ──────────────────────────────────────────────
  function showDayPopup(key) {
    const popup = document.getElementById('cal-popup');
    const cell  = document.querySelector(`.cal-cell[data-key="${key}"]`);
    if (!popup || !cell) return;

    const dayEvents = eventsCache.filter(ev => {
      return dateKey(ev.date.getFullYear(), ev.date.getMonth(), ev.date.getDate()) === key;
    });

    if (!dayEvents.length) { popup.hidden = true; return; }

    const [y, m, d] = key.split('-').map(Number);
    popup.innerHTML = `
      <button class="cal-popup-close" id="cal-popup-close" aria-label="Kapat">✕</button>
      <strong class="cal-popup-date">${d} ${TR_MONTHS[m-1]} ${y}</strong>
      <ul class="cal-popup-list">
        ${dayEvents.map(ev => `
          <li><span class="cal-popup-title">${esc(ev.title)}</span>
          ${ev.description ? `<p class="cal-popup-desc">${esc(ev.description)}</p>` : ''}
          <small>${esc(ev.createdByName || 'Üye')}</small></li>`).join('')}
      </ul>`;

    // Position near cell
    const rect = cell.getBoundingClientRect();
    const mnt  = document.getElementById(MOUNT_ID).getBoundingClientRect();
    popup.hidden = false;
    popup.style.top  = (rect.bottom - mnt.top + 6) + 'px';
    popup.style.left = Math.max(0, rect.left - mnt.left) + 'px';

    popup.querySelector('#cal-popup-close').addEventListener('click', () => { popup.hidden = true; });
  }

  // ───── Modal ──────────────────────────────────────────────────
  function openModal(prefillDate) {
    const overlay = document.getElementById('cal-modal-overlay');
    if (!overlay) return;
    overlay.hidden = false;

    const dateInput = document.getElementById('cal-input-date');
    if (dateInput && prefillDate) dateInput.value = prefillDate;
    else if (dateInput) {
      // Default to today
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('cal-input-title')?.focus();
  }

  function closeModal() {
    const overlay = document.getElementById('cal-modal-overlay');
    if (overlay) overlay.hidden = true;
    const msg = document.getElementById('cal-form-msg');
    if (msg) { msg.hidden = true; msg.textContent = ''; }
    document.getElementById('cal-add-form')?.reset();
    // Reset poster preview
    const preview = document.getElementById('cal-poster-preview');
    if (preview) { preview.hidden = true; preview.innerHTML = ''; }
    const lbl = document.getElementById('cal-poster-label');
    if (lbl) lbl.hidden = false;
  }

  function _previewPoster(input, preview, label, fileOverride) {
    const file = fileOverride || (input && input.files && input.files[0]);
    if (!file || !file.type.startsWith('image/') || !preview) return;
    const url = URL.createObjectURL(file);
    preview.innerHTML = `
      <img src="${url}" alt="Önizleme" style="width:100%;height:160px;object-fit:cover;border-radius:8px;display:block;" />
      <button type="button" id="cal-poster-remove" title="Görseli kaldır"
        style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;color:#fff;
               border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:15px;
               display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>`;
    preview.style.position = 'relative';
    preview.hidden = false;
    if (label) label.hidden = true;
    preview.querySelector('#cal-poster-remove').addEventListener('click', () => {
      if (input) input.value = '';
      preview.hidden = true;
      preview.innerHTML = '';
      if (label) label.hidden = false;
    });
  }

  // Canvas-based image compression → Base64 (Firestore'da saklanır, Storage gerekmez)
  // Firestore belge limiti ~1MB → base64 max ~700KB hedeflenir
  function _compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 600;
    quality  = quality  || 0.55;
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          var dataUrl;
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
          } catch(_) { dataUrl = canvas.toDataURL('image/jpeg', quality); }
          // Firestore belge limiti ~1MB; base64 ~700KB'ı geçmesin
          if (dataUrl.length > 700 * 1024) dataUrl = canvas.toDataURL('image/jpeg', 0.35);
          if (dataUrl.length > 700 * 1024) dataUrl = canvas.toDataURL('image/jpeg', 0.2);
          resolve(dataUrl);
        };
        img.onerror = function() { reject(new Error('Görsel okunamadı')); };
        img.src = e.target.result;
      };
      reader.onerror = function() { reject(new Error('Dosya okunamadı')); };
      reader.readAsDataURL(file);
    });
  }

  // ───── Add / Delete Events ────────────────────────────────────
  async function handleAddEvent(e) {
    e.preventDefault();
    if (!dbRef || !authRef || !authRef.currentUser) return;

    const title       = document.getElementById('cal-input-title')?.value.trim();
    const dateVal     = document.getElementById('cal-input-date')?.value;
    const desc        = document.getElementById('cal-input-desc')?.value.trim();
    const posterInput = document.getElementById('cal-input-poster');
    const msg         = document.getElementById('cal-form-msg');
    const btn         = document.getElementById('cal-submit-btn');

    if (!title)   { showMsg(msg, 'Başlık gereklidir.', 'error'); return; }
    if (!dateVal) { showMsg(msg, 'Tarih seçmelisiniz.', 'error'); return; }

    const posterFile = posterInput?.files?.[0] || null;
    if (posterFile && posterFile.size > 8 * 1024 * 1024) {
      showMsg(msg, 'Görsel maksimum 8 MB olmalıdır.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    try {
      let imageUrl = '';

      if (posterFile) {
        showMsg(msg, 'Görsel sıkıştırılıyor...', 'info');
        imageUrl = await _compressImage(posterFile, 600, 0.55);
        // Firestore belge limiti 1MB — base64 ~700KB'ı geçerse görseli atla
        if (imageUrl.length > 700 * 1024) {
          imageUrl = '';
          showMsg(msg, '⚠️ Görsel çok büyük, görselsiz kaydediliyor...', 'info');
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      const dateObj = new Date(dateVal + 'T00:00:00');
      await dbRef.collection('events').add({
        title,
        description: desc || '',
        imageUrl: imageUrl || '',
        date: firebase.firestore.Timestamp.fromDate(dateObj),
        createdBy: authRef.currentUser.uid,
        createdByName: authRef.currentUser.displayName || 'Üye',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showMsg(msg, '✅ Etkinlik eklendi!', 'success');
      setTimeout(() => {
        closeModal();
        // Navigate to month of added event
        currentMonth = dateObj.getMonth();
        currentYear  = dateObj.getFullYear();
        renderCalendar();
      }, 900);
    } catch (err) {
      console.error('Etkinlik eklenemedi:', err);
      showMsg(msg, '❌ Hata: ' + (err.message || 'Etkinlik eklenemedi.'), 'error');
      btn.disabled = false;
      btn.textContent = 'Kaydet';
    }
  }

  async function deleteEvent(id) {
    if (!id || !dbRef) return;
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    try {
      await dbRef.collection('events').doc(id).delete();
    } catch (err) {
      alert('Silinemedi: ' + (err.message || err));
    }
  }

  function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'cal-form-msg cal-form-msg--' + type;
    el.hidden = false;
  }

  // ───── Firebase Sync ──────────────────────────────────────────
  function startSync() {
    if (!dbRef) return;

    if (unsubscribe) unsubscribe();

    unsubscribe = dbRef.collection('events')
      .orderBy('date', 'asc')
      .onSnapshot(snap => {
        eventsCache = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (!d.date) return;
          eventsCache.push({
            id: doc.id,
            title: d.title || '',
            description: d.description || '',
            imageUrl: d.imageUrl || '',
            date: d.date.toDate(),
            createdBy: d.createdBy || '',
            createdByName: d.createdByName || 'Üye'
          });
        });
        renderCalendar();
      }, err => {
        console.warn('Calendar sync error:', err);
        renderCalendar(); // render without live data
      });
  }

  // ───── Init ───────────────────────────────────────────────────
  function init(retries) {
    if (!document.getElementById(MOUNT_ID)) return;

    if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
      // İlk denemede hemen boş takvimi göster — kullanıcı beklemez
      if (retries === 20) renderCalendar();
      if (retries > 0) {
        setTimeout(() => init(retries - 1), 500);
      }
      return;
    }

    dbRef   = window.TSGLAuth.db;
    authRef = window.TSGLAuth.auth;
    startSync();
    startRsvpSync();

    // Re-render on auth change (show/hide add button)
    authRef.onAuthStateChanged(() => renderCalendar());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(20));
  } else {
    // DOMContentLoaded already fired
    setTimeout(() => init(20), 200);
  }
})();
