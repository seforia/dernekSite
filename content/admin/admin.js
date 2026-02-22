(function() {
  'use strict';

  let allUsers = [];
  let currentTab = 'pending';

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tab);
    });
    
    // Load users for this tab
    loadUsers(tab);
  }

  async function loadUsers(status) {
    const container = document.getElementById(status);
    const loadingEl = container.querySelector('.loading');
    const gridEl = container.querySelector('.users-grid');
    const errorMsg = document.getElementById('error-msg');

    if (!window.TSGLAuth || !window.TSGLAuth.isReady()) {
      showError('Firebase hazırlanıyor, lütfen bekleyin...');
      setTimeout(() => loadUsers(status), 1000);
      return;
    }

    // Check if user is logged in (admin check can be added here)
    if (!window.TSGLAuth.auth.currentUser) {
      showError('Bu sayfayı görüntülemek için giriş yapmalısınız.');
      return;
    }

    try {
      loadingEl.style.display = 'block';
      gridEl.style.display = 'none';
      errorMsg.style.display = 'none';

      console.log('🔍 Admin: getAllUsers() çağrılıyor...');
      const users = await window.TSGLAuth.getAllUsers();
      console.log('✅ Admin: Kullanıcılar yüklendi:', users.length, 'kullanıcı');
      allUsers = users;

      let filteredUsers = users;
      if (status !== 'all') {
        filteredUsers = users.filter(u => u.status === status);
      }

      loadingEl.style.display = 'none';

      if (filteredUsers.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <p>Hiç kullanıcı bulunamadı</p>
          </div>
        `;
      } else {
        gridEl.innerHTML = filteredUsers.map(user => createUserCard(user)).join('');
        
        // Add event listeners to action buttons
        gridEl.querySelectorAll('.btn-approve').forEach(btn => {
          btn.addEventListener('click', () => handleApprove(btn.dataset.uid));
        });
        
        gridEl.querySelectorAll('.btn-reject').forEach(btn => {
          btn.addEventListener('click', () => handleReject(btn.dataset.uid));
        });
      }

      gridEl.style.display = 'grid';
    } catch (error) {
      console.error('❌ Admin: Kullanıcılar yüklenirken hata:', error);
      loadingEl.style.display = 'none';
      showError('Kullanıcılar yüklenirken hata oluştu: ' + error.message);
    }
  }

  function createUserCard(user) {
    const statusClass = `status-${user.status}`;
    const statusText = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      rejected: 'Reddedildi'
    }[user.status] || user.status;

    const createdAt = user.createdAt?.toDate ? 
      user.createdAt.toDate().toLocaleDateString('tr-TR') : 
      'Bilinmiyor';

    const approvedAt = user.approvedAt?.toDate ? 
      user.approvedAt.toDate().toLocaleDateString('tr-TR') : 
      null;

    const rejectedAt = user.rejectedAt?.toDate ? 
      user.rejectedAt.toDate().toLocaleDateString('tr-TR') : 
      null;

    return `
      <div class="user-card">
        <div class="user-header">
          <div class="user-info">
            <h3>${escapeHtml(user.name)}</h3>
            <p>📧 ${escapeHtml(user.email)}</p>
            <p>📅 Kayıt: ${createdAt}</p>
            ${approvedAt ? `<p>✅ Onay: ${approvedAt}</p>` : ''}
            ${rejectedAt ? `<p>❌ Red: ${rejectedAt}</p>` : ''}
          </div>
          <span class="user-status ${statusClass}">${statusText}</span>
        </div>
        ${user.status === 'pending' ? `
          <div class="user-actions">
            <button class="btn-approve" data-uid="${user.id}">✓ Onayla</button>
            <button class="btn-reject" data-uid="${user.id}">✗ Reddet</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  async function handleApprove(uid) {
    if (!confirm('Bu kullanıcıyı onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await window.TSGLAuth.approveUser(uid);
      alert('✅ Kullanıcı onaylandı!');
      loadUsers(currentTab);
    } catch (error) {
      console.error('Onaylama hatası:', error);
      showError('Kullanıcı onaylanırken hata oluştu: ' + error.message);
    }
  }

  async function handleReject(uid) {
    if (!confirm('Bu kullanıcıyı reddetmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await window.TSGLAuth.rejectUser(uid);
      alert('❌ Kullanıcı reddedildi!');
      loadUsers(currentTab);
    } catch (error) {
      console.error('Reddetme hatası:', error);
      showError('Kullanıcı reddedilirken hata oluştu: ' + error.message);
    }
  }

  function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial load
  setTimeout(() => {
    loadUsers('pending');
  }, 500);
})();
