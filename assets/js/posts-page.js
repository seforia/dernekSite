// Posts Page Logic
(function() {
  // Check if Firebase is ready with timeout
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds
  
  const waitForFirebase = setInterval(() => {
    attempts++;
    
    if (window.TSGLAuth && window.TSGLAuth.isReady()) {
      clearInterval(waitForFirebase);
      initPostsPage();
    } else if (attempts >= maxAttempts) {
      clearInterval(waitForFirebase);
      console.error('Firebase yüklenemedi');
      // Hide loader and show error
      const loader = document.getElementById('page-loader');
      if (loader) loader.style.display = 'none';
      
      const postsListDiv = document.getElementById('posts-list');
      if (postsListDiv) {
        postsListDiv.innerHTML = '<div class="error-message" style="text-align: center; padding: 2rem; color: #d32f2f;"><p>⚠️ Sayfa yüklenirken bir hata oluştu.</p><p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p></div>';
      }
    }
  }, 100);

  let currentUser = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let lastPostDoc = null;
  let isLoading = false;
  let selectedPostId = null;
  let selectedImageFiles = []; // Array for multiple images

  // Seed initial sample posts if database is empty
  async function seedSamplePosts() {
    try {
      const postsSnapshot = await window.TSGLAuth.db.collection('posts').limit(1).get();
      
      if (!postsSnapshot.empty) {
        return; // Already have posts, no need to seed
      }

      const samplePosts = [
        {
          title: 'Atatürk ve Tarih',
          content: 'Atatürk\'un mirası ve okul kültürümüze yansıyan tarihsel izler. Okulumuzun köklü geçmişi ve Atatürk\'ün eğitim vizyonu bizlere ilham vermeye devam ediyor.',
          category: 'Atatürk ve Tarih',
          userId: 'system',
          authorName: 'TSGL Derneği',
          createdAt: window.firebase.firestore.Timestamp.fromDate(new Date('2025-07-17')),
          viewCount: 0,
          commentCount: 0
        },
        {
          title: 'Eğitim',
          content: 'Öğrenci ve mezunlarımızın eğitim yolculuklarından notlar. Başarılı eğitim süreçleri ve deneyimlerin paylaşıldığı bu yazıda, okulumuzun eğitim anlayışını keşfedin.',
          category: 'Eğitim',
          userId: 'system',
          authorName: 'TSGL Derneği',
          createdAt: window.firebase.firestore.Timestamp.fromDate(new Date('2025-07-17')),
          viewCount: 0,
          commentCount: 0
        },
        {
          title: 'İklim ve Çevre',
          content: 'Okulumuzun çevre bilinci ve sürdürülebilirlik çalışmaları. Yeşil kampüs projelerimiz ve öğrencilerimizin çevre duyarlılığını artırma çabalarımızı bu yazıda bulabilirsiniz.',
          category: 'İklim ve Çevre',
          userId: 'system',
          authorName: 'TSGL Derneği',
          createdAt: window.firebase.firestore.Timestamp.fromDate(new Date('2025-07-17')),
          viewCount: 0,
          commentCount: 0
        },
        {
          title: 'Kültür - Sanat ve Gezi',
          content: 'Sanat, kültür ve gezi deneyimlerini paylaştığımız yazı dizisi. Öğrencilerimizin katıldığı kültürel etkinlikler ve geziler hakkında detaylı bilgiler.',
          category: 'Kültür - Sanat ve Gezi',
          userId: 'system',
          authorName: 'TSGL Derneği',
          createdAt: window.firebase.firestore.Timestamp.fromDate(new Date('2025-07-17')),
          viewCount: 0,
          commentCount: 0
        },
        {
          title: 'Toplum',
          content: 'Topluma katkı sağlayan projeler ve dayanışma hikayeleri. Derneğimizin sosyal sorumluluk projeleri ve toplumsal yardım çalışmaları hakkında.',
          category: 'Toplum',
          userId: 'system',
          authorName: 'TSGL Derneği',
          createdAt: window.firebase.firestore.Timestamp.fromDate(new Date('2025-07-17')),
          viewCount: 0,
          commentCount: 0
        }
      ];

      // Add each sample post to Firestore
      for (const post of samplePosts) {
        await window.TSGLAuth.db.collection('posts').add(post);
      }

      console.log('✅ Örnek yazılar başarıyla eklendi');
    } catch (error) {
      console.error('Örnek yazılar eklenirken hata:', error);
    }
  }

  // Initialize the page
  async function initPostsPage() {
    // Listen to auth state — sonuç ne olursa olsun yazıları yükle
    window.TSGLAuth.auth.onAuthStateChanged((user) => {
      currentUser = user;
      updateUIForUser(user);
      // Her auth değişiminde baştan yükle
      lastPostDoc = null;
      isLoading = false;
      const postsList = document.getElementById('posts-list');
      const featuredContainer = document.getElementById('featured-post-container');
      if (postsList) postsList.innerHTML = '';
      if (featuredContainer) featuredContainer.innerHTML = '';
      loadPosts();
    });

    // Load categories
    loadCategories();

    // Set up event listeners
    setupEventListeners();

    // Hide loader
    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) loader.style.display = 'none';
    }, 500);
  }

  // Update UI based on user login status
  function updateUIForUser(user) {
    const userActionsDiv = document.getElementById('user-actions');
    const commentFormContainer = document.getElementById('comment-form-container');
    
    if (user) {
      // Show user actions
      if (userActionsDiv) userActionsDiv.style.display = 'block';
    } else {
      // Hide user actions
      if (userActionsDiv) userActionsDiv.style.display = 'none';
      if (commentFormContainer) commentFormContainer.style.display = 'none';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Categories toggle
    const categoriesToggle = document.getElementById('categories-toggle');
    const categoriesFilter = document.getElementById('categories-filter');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (categoriesToggle && categoriesFilter) {
      categoriesToggle.addEventListener('click', () => {
        const isVisible = categoriesFilter.style.display !== 'none';
        categoriesFilter.style.display = isVisible ? 'none' : 'block';
        if (toggleIcon) {
          toggleIcon.style.transform = isVisible ? 'rotate(-90deg)' : 'rotate(0deg)';
        }
      });
    }

    // New post button
    document.getElementById('new-post-btn')?.addEventListener('click', showNewPostForm);

    // Cancel post button
    document.getElementById('cancel-post-btn')?.addEventListener('click', hideNewPostForm);

    // New post form submission
    document.getElementById('new-post-form')?.addEventListener('submit', handleNewPostSubmit);

    // Image input
    document.getElementById('post-image')?.addEventListener('change', handleImageSelect);

    // Search input
    document.getElementById('search-input')?.addEventListener('input', handleSearch);

    // Modal close
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('post-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'post-modal') closeModal();
    });

    // New comment form submission
    document.getElementById('new-comment-form')?.addEventListener('submit', handleNewCommentSubmit);

    // Load more button
    document.getElementById('load-more-btn')?.addEventListener('click', handleLoadMore);
  }

  // Load categories
  async function loadCategories() {
    try {
      const categories = await window.TSGLAuth.getCategories();
      const filterDiv = document.getElementById('categories-filter');
      
      if (filterDiv) {
        // Clear and rebuild
        filterDiv.innerHTML = '<button class="category-btn active" data-category="all">Tümü <span class="category-count">(0)</span></button>';
        
        categories.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'category-btn';
          btn.dataset.category = cat;
          btn.innerHTML = `${cat} <span class="category-count">(0)</span>`;
          btn.addEventListener('click', () => handleCategoryFilter(cat));
          filterDiv.appendChild(btn);
        });
      }

      // Add category filter event listener to all buttons
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
          e.target.closest('.category-btn').classList.add('active');
        });
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Handle category filter
  async function handleCategoryFilter(category) {
    currentFilter = category;
    lastPostDoc = null;
    loadPosts();
  }

  // Load posts
  async function loadPosts() {
    if (isLoading) return;
    
    isLoading = true;
    const postsList = document.getElementById('posts-list');
    const featuredContainer = document.getElementById('featured-post-container');
    
    if (!postsList) {
      console.error('posts-list element bulunamadı');
      isLoading = false;
      return;
    }
    
    try {
      console.log('Yazılar yükleniyor...', { currentFilter, lastPostDoc });
      
      let result;
      
      if (currentFilter === 'all') {
        result = await window.TSGLAuth.getPosts(11, lastPostDoc);
      } else {
        result = await window.TSGLAuth.getPostsByCategory(currentFilter, 11, lastPostDoc);
      }

      console.log('Yüklenen yazı sayısı:', result.posts.length);

      const { posts, nextLastDoc } = result;
      lastPostDoc = nextLastDoc;

      // Clear the lists if this is the first load
      if (!postsList.querySelector('.post-card') && !lastPostDoc) {
        postsList.innerHTML = '';
        if (featuredContainer) featuredContainer.innerHTML = '';
      }

      if (posts.length === 0 && !postsList.querySelector('.post-card')) {
        postsList.innerHTML = '<div class="no-posts">Henüz yazı yok.</div>';
      } else {
        // Show featured post only on first load
        if (!lastPostDoc && posts.length > 0 && featuredContainer) {
          const featuredPost = createPostCard(posts[0], true);
          featuredContainer.innerHTML = '';
          featuredContainer.appendChild(featuredPost);
          featuredContainer.style.display = 'block';
          
          // Add remaining posts to the list
          posts.slice(1).forEach(post => {
            const postCard = createPostCard(post, false);
            postsList.appendChild(postCard);
          });
        } else {
          // Add all posts for pagination
          posts.forEach(post => {
            const postCard = createPostCard(post, false);
            postsList.appendChild(postCard);
          });
        }
      }

      // Update category counts
      updateCategoryCounts();

      // Show/hide load more button
      const loadMoreContainer = document.getElementById('load-more-container');
      if (loadMoreContainer) {
        loadMoreContainer.style.display = nextLastDoc ? 'block' : 'none';
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      console.error('Hata detayı:', error.message, error.code);
      postsList.innerHTML = `<div class="error" style="padding: 2rem; text-align: center; color: #d32f2f;">
        <p>⚠️ Yazılar yüklenirken hata oluştu.</p>
        <p style="font-size: 0.9em; margin-top: 0.5rem;">${escapeHtml(error.message)}</p>
        <button class="btn primary" onclick="location.reload()" style="margin-top: 1rem;">Sayfayı Yenile</button>
      </div>`;
    } finally {
      isLoading = false;
    }
  }

  // Calculate reading time
  function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  }

  // Get initials for avatar
  function getInitials(name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  }

  // Create post card element
  function createPostCard(post, isFeatured = false) {
    const readingTime = calculateReadingTime(post.content);
    const initials = getInitials(post.authorName);
    const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : null);
    const hasImages = images && images.length > 0;
    const imageCount = hasImages ? images.length : 0;
    const isLikedByUser = currentUser && post.likedByCurrentUser;
    const likesCount = post.likesCount || 0;

    if (isFeatured) {
      return createFeaturedPostCard(post, readingTime, initials, images, hasImages, imageCount, isLikedByUser, likesCount);
    }

    const card = document.createElement('div');
    card.className = 'post-card';
    
    card.innerHTML = `
      ${hasImages ? `
        <div class="post-image">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(post.title)}" loading="lazy" />
          ${imageCount > 1 ? `<span class="image-count-badge">${imageCount} Görsel</span>` : ''}
          ${currentUser && currentUser.uid === post.userId ? `
            <div class="post-actions">
              <button class="btn-icon edit-post-btn" title="Düzenle">✏️</button>
              <button class="btn-icon delete-post-btn" title="Sil">🗑️</button>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="post-image">
          <div class="post-image-placeholder">📄</div>
          ${currentUser && currentUser.uid === post.userId ? `
            <div class="post-actions">
              <button class="btn-icon edit-post-btn" title="Düzenle">✏️</button>
              <button class="btn-icon delete-post-btn" title="Sil">🗑️</button>
            </div>
          ` : ''}
        </div>
      `}
      <div class="post-body">
        <div class="post-header">
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <span class="post-category">${escapeHtml(post.category)}</span>
        </div>
        <div class="post-meta">
          <div class="post-author-info">
            <div class="post-avatar">${escapeHtml(initials)}</div>
            <span>${escapeHtml(post.authorName)}${post.authorGraduationYear ? ` (${post.authorGraduationYear})` : ''}</span>
          </div>
          <span class="post-reading-time">⏱️ ${readingTime} dk</span>
        </div>
        <p class="post-excerpt">${escapeHtml(post.content.substring(0, 150))}...</p>
        <div class="post-footer">
          <div class="post-stats">
            <button class="post-clap-btn ${isLikedByUser ? 'clapped' : ''}" title="Alkışla" ${!currentUser ? 'disabled' : ''}>
              👏 <span class="post-clap-count">${likesCount}</span>
            </button>
            <div class="stat-item">👁️ ${post.viewCount || 0}</div>
            <div class="stat-item">💬 ${post.commentCount || 0}</div>
          </div>
          <button class="read-more-btn">Oku →</button>
        </div>
      </div>
    `;

    // Event listeners
    const clapBtn = card.querySelector('.post-clap-btn');
    if (clapBtn) {
      clapBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentUser) {
          handleCardLikePost(post, card, clapBtn);
        } else {
          showLoginPrompt();
        }
      });
    }
    
    card.querySelector('.read-more-btn').addEventListener('click', () => showPostDetail(post));
    
    if (currentUser && currentUser.uid === post.userId) {
      card.querySelector('.delete-post-btn')?.addEventListener('click', () => handleDeletePost(post.id, card));
      card.querySelector('.edit-post-btn')?.addEventListener('click', () => showEditPostForm(post));
    }

    return card;
  }

  // Create featured post card
  function createFeaturedPostCard(post, readingTime, initials, images, hasImages, imageCount, isLikedByUser, likesCount) {
    const featured = document.createElement('div');
    featured.className = 'featured-post';
    
    featured.innerHTML = `
      ${hasImages ? `
        <div class="featured-image-container">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(post.title)}" loading="lazy" />
          <span class="featured-badge">⭐ EN YENİ</span>
        </div>
      ` : `
        <div class="featured-image-container">
          <div class="post-image-placeholder">📰</div>
          <span class="featured-badge">⭐ EN YENİ</span>
        </div>
      `}
      <div class="featured-content">
        <span class="featured-category">${escapeHtml(post.category)}</span>
        <h2>${escapeHtml(post.title)}</h2>
        <div class="featured-meta">
          <div class="featured-author">
            <div class="featured-avatar">${escapeHtml(initials)}</div>
            <div>
              <div style="font-weight: 700; color: #1a1a1a;">${escapeHtml(post.authorName)}${post.authorGraduationYear ? ` (${post.authorGraduationYear})` : ''}</div>
              <div style="font-size: 0.85rem; color: #999;">📅 ${formatDate(post.createdAt)}</div>
            </div>
          </div>
          <span style="display: flex; align-items: center; gap: 0.4rem; background: rgba(74, 144, 226, 0.1); padding: 6px 12px; border-radius: 50px; font-weight: 600; color: #4a90e2;">
            ⏱️ ${readingTime} dk
          </span>
        </div>
        <p class="featured-excerpt">${escapeHtml(post.content.substring(0, 200))}...</p>
        <div class="featured-footer">
          <div class="featured-stats">
            <span>👁️ ${post.viewCount || 0} Görüntülenme</span>
            <span>💬 ${post.commentCount || 0} Yorum</span>
            <span>❤️ ${likesCount} Beğeni</span>
          </div>
          <button class="featured-read-btn">Devamını Oku →</button>
        </div>
      </div>
    `;

    featured.querySelector('.featured-read-btn').addEventListener('click', () => showPostDetail(post));

    return featured;
  }

  // Handle like/unlike from card
  async function handleCardLikePost(post, cardElement, clapBtn) {
    if (!currentUser) return;
    
    // Optimistic UI
    const isCurrentlyClapped = clapBtn.classList.contains('clapped');
    const countSpan = clapBtn.querySelector('.post-clap-count');
    const currentCount = parseInt(countSpan?.textContent) || 0;
    clapBtn.disabled = true;

    if (isCurrentlyClapped) {
      clapBtn.classList.remove('clapped');
      if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
    } else {
      clapBtn.classList.add('clapped');
      if (countSpan) countSpan.textContent = currentCount + 1;
    }

    try {
      await window.TSGLAuth.toggleLikePost(post.id);
    } catch (error) {
      // Geri al (rollback)
      if (isCurrentlyClapped) {
        clapBtn.classList.add('clapped');
        if (countSpan) countSpan.textContent = currentCount;
      } else {
        clapBtn.classList.remove('clapped');
        if (countSpan) countSpan.textContent = currentCount;
      }
      console.error('Beğeni işlemi başarısız:', error);
    } finally {
      clapBtn.disabled = false;
    }
  }

  // Show login prompt
  function showLoginPrompt() {
    const message = document.createElement('div');
    message.className = 'login-prompt';
    message.innerHTML = `
      <div class="login-prompt-content">
        <p>😊 Beğenmek için lütfen giriş yapın</p>
        <button class="btn primary" onclick="window.location.hash = 'giris'">Giriş Yap</button>
      </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.3); z-index: 9998;';
    overlay.addEventListener('click', () => {
      message.remove();
      overlay.remove();
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
      overlay.remove();
    }, 3000);
  }

  // Show post detail
  async function showPostDetail(post) {
    selectedPostId = post.id;
    const modal = document.getElementById('post-modal');
    const detailContainer = document.getElementById('post-detail-container');
    const commentFormContainer = document.getElementById('comment-form-container');

    if (!modal || !detailContainer) return;

    // Show/hide comment form based on login status
    if (commentFormContainer) {
      commentFormContainer.style.display = currentUser ? 'block' : 'none';
    }

    // Show modal
    modal.style.display = 'block';

    // Load post detail
    try {
      const fullPost = await window.TSGLAuth.getPost(post.id);
      window.currentFullPost = fullPost; // Store globally for lightbox
      
      detailContainer.innerHTML = `
        <article class="post-detail">
          <h2>${escapeHtml(fullPost.title)}</h2>
          <div class="post-detail-meta">
            <span>👤 ${escapeHtml(fullPost.authorName)}${fullPost.authorGraduationYear ? ` (${fullPost.authorGraduationYear})` : ''}</span>
            <span>📁 ${escapeHtml(fullPost.category)}</span>
            <span>📅 ${formatDate(fullPost.createdAt)}</span>
            <span>👁️ ${fullPost.viewCount || 0}</span>
          </div>
          <div class="post-detail-engagement">
            <button class="btn-like ${fullPost.likedByCurrentUser ? 'liked' : ''}" id="like-post-btn" ${!currentUser ? 'disabled' : ''}>
              <span class="like-icon">${fullPost.likedByCurrentUser ? '❤️' : '🤍'}</span>
              <span class="like-count">${fullPost.likesCount || 0}</span>
            </button>
          </div>
          <div class="post-detail-content">
            ${fullPost.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
          </div>
          ${(() => {
            const images = fullPost.imageUrls || (fullPost.imageUrl ? [fullPost.imageUrl] : null);
            if (!images || images.length === 0) return '';
            return `
              <div class="gallery-slider-container">
                <div class="gallery-slider-header">
                  <h3>📸 Görseller</h3>
                  <span class="gallery-counter"><span id="current-image">1</span> / ${images.length}</span>
                </div>
                <div class="gallery-slider">
                  <button class="gallery-btn gallery-prev" title="Önceki" id="gallery-prev">‹</button>
                  <div class="gallery-track" id="gallery-track">
                    ${images.map((img, idx) => `
                      <div class="gallery-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="openLightboxFromModal(${idx})">
                        <img src="${escapeHtml(img)}" alt="Görsel ${idx + 1}" loading="lazy" />
                        <div class="zoom-icon">🔍</div>
                      </div>
                    `).join('')}
                  </div>
                  <button class="gallery-btn gallery-next" title="Sonraki" id="gallery-next">›</button>
                </div>
              </div>
            `;
          })()}
          ${currentUser && currentUser.uid === fullPost.userId ? `
            <div class="post-detail-actions">
              <button class="btn secondary" id="edit-detail-btn">✏️ Düzenle</button>
              <button class="btn danger" id="delete-detail-btn">🗑️ Sil</button>
            </div>
          ` : ''}
        </article>
      `;

      // Add event listeners for edit/delete
      if (currentUser && currentUser.uid === fullPost.userId) {
        document.getElementById('edit-detail-btn')?.addEventListener('click', () => showEditPostForm(fullPost));
        document.getElementById('delete-detail-btn')?.addEventListener('click', () => handleDeletePost(post.id, null, true));
      }

      // Add like button listener
      const likeBtn = document.getElementById('like-post-btn');
      if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLikePost(post.id));
      }

      // Setup gallery slider
      const images = fullPost.imageUrls || (fullPost.imageUrl ? [fullPost.imageUrl] : null);
      if (images && images.length > 0) {
        setupGallerySlider(images);
      }

      // Load comments
      loadComments(post.id);
    } catch (error) {
      console.error('Error loading post detail:', error);
      detailContainer.innerHTML = '<div class="error">Yazı yüklenirken hata oluştu.</div>';
    }
  }

  // Setup gallery slider
  function setupGallerySlider(images) {
    const track = document.getElementById('gallery-track');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const currentCounter = document.getElementById('current-image');

    if (!track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;

    function updateGallery() {
      const items = track.querySelectorAll('.gallery-item');
      items.forEach((item, idx) => {
        item.classList.remove('active');
        if (idx === currentIndex) item.classList.add('active');
      });
      currentCounter.textContent = currentIndex + 1;

      // Scroll to active item
      const activeItem = items[currentIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      // Update button states
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === images.length - 1;
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateGallery();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < images.length - 1) {
        currentIndex++;
        updateGallery();
      }
    });

    // Keyboard navigation
    const handleKeyboard = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        updateGallery();
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        currentIndex++;
        updateGallery();
      }
    };

    document.addEventListener('keydown', handleKeyboard);

    // Initial state
    updateGallery();

    // Store handlers for cleanup
    track.dataset.handlers = 'true';
  }

  // Open lightbox from modal gallery
  function openLightboxFromModal(index) {
    const fullPost = window.currentFullPost;
    if (!fullPost) return;
    
    const images = fullPost.imageUrls || (fullPost.imageUrl ? [fullPost.imageUrl] : []);
    if (images.length === 0) return;
    
    openLightbox(images, index);
  }

  // Open lightbox (full screen modal)
  function openLightbox(images, startIndex = 0) {
    let currentIndex = startIndex;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.innerHTML = `
      <div class="lightbox-overlay" onclick="this.parentNode.remove()"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="this.closest('.lightbox').remove()">×</button>
        <button class="lightbox-prev" onclick="lightboxPrev()">‹</button>
        <img class="lightbox-image" src="${escapeHtml(images[currentIndex])}" alt="Görsel ${currentIndex + 1}" />
        <button class="lightbox-next" onclick="lightboxNext()">›</button>
        <div class="lightbox-counter">${currentIndex + 1} / ${images.length}</div>
      </div>
    `;

    document.body.appendChild(lightbox);

    // Store globally for navigation
    window.lightboxCurrent = currentIndex;
    window.lightboxImages = images;

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') lightbox.remove();
      else if (e.key === 'ArrowLeft') lightboxPrev();
      else if (e.key === 'ArrowRight') lightboxNext();
    };

    document.addEventListener('keydown', handleKeyDown);

    lightbox.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  // Lightbox navigation
  function lightboxPrev() {
    const lightbox = document.querySelector('.lightbox');
    if (!lightbox || window.lightboxCurrent <= 0) return;
    
    window.lightboxCurrent--;
    const img = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');
    
    img.src = escapeHtml(window.lightboxImages[window.lightboxCurrent]);
    counter.textContent = `${window.lightboxCurrent + 1} / ${window.lightboxImages.length}`;
    
    img.style.animation = 'fadeIn 0.3s ease';
  }

  function lightboxNext() {
    const lightbox = document.querySelector('.lightbox');
    if (!lightbox || window.lightboxCurrent >= window.lightboxImages.length - 1) return;
    
    window.lightboxCurrent++;
    const img = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');
    
    img.src = escapeHtml(window.lightboxImages[window.lightboxCurrent]);
    counter.textContent = `${window.lightboxCurrent + 1} / ${window.lightboxImages.length}`;
    
    img.style.animation = 'fadeIn 0.3s ease';
  }

  // Load comments
  async function loadComments(postId) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    try {
      console.log('🔍 loadComments: Yorumlar yükleniyor, postId:', postId);
      const comments = await window.TSGLAuth.getComments(postId);
      console.log('✅ loadComments:', comments.length, 'yorum alındı');
      
      commentsList.innerHTML = '';

      if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">Henüz yorum yok. İlk yorumu sen yap!</div>';
      } else {
        comments.forEach(comment => {
          const commentElement = createCommentElement(comment);
          commentsList.appendChild(commentElement);
        });
      }
    } catch (error) {
      console.error('❌ Yorumlar yüklenirken hata:', error);
      commentsList.innerHTML = '<div class="error">Yorumlar yüklenirken hata oluştu: ' + error.message + '</div>';
    }
  }

  // Create comment element
  function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
      <div class="comment-header">
        <strong>${escapeHtml(comment.authorName)}</strong>
        <span class="comment-date">${formatDate(comment.createdAt)}</span>
      </div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
      ${currentUser && currentUser.uid === comment.userId ? `
        <button class="btn-icon delete-comment-btn" title="Sil">🗑️</button>
      ` : ''}
    `;

    if (currentUser && currentUser.uid === comment.userId) {
      div.querySelector('.delete-comment-btn')?.addEventListener('click', () => {
        handleDeleteComment(comment.id, selectedPostId, div);
      });
    }

    return div;
  }

  // Show new post form
  function showNewPostForm() {
    const container = document.getElementById('new-post-form-container');
    if (container) {
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('post-title')?.focus();
    }
  }

  // Hide new post form
  function hideNewPostForm() {
    const container = document.getElementById('new-post-form-container');
    if (container) {
      container.style.display = 'none';
      document.getElementById('new-post-form')?.reset();
      clearSelectedImages();
    }
  }

  function handleImageSelect(e) {
    const files = e.target.files;
    
    const previewGrid = document.getElementById('image-preview-grid');
    if (!previewGrid) return;

    if (!files || files.length === 0) {
      selectedImageFiles = [];
      previewGrid.style.display = 'none';
      previewGrid.innerHTML = '';
      return;
    }

    // Process multiple files
    const promises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`Dosya ${i + 1}: Lütfen bir görsel dosyası seçin`);
        continue;
      }

      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Dosya ${i + 1}: Görsel boyutu çok büyük. Maksimum 5MB olmalıdır.`);
        continue;
      }

      promises.push(compressImage(file));
    }

    Promise.all(promises)
      .then(compressedDataUrls => {
        selectedImageFiles = compressedDataUrls.filter(url => url); // Remove nulls
        renderImagePreviews();
        console.log('Görseller sıkıştırıldı:', selectedImageFiles.length, 'adet');
      })
      .catch(error => {
        console.error('Görsel sıkıştırma hatası:', error);
        alert('Görseller işlenirken hata oluştu: ' + error.message);
        e.target.value = '';
      });
  }

  function renderImagePreviews() {
    const previewGrid = document.getElementById('image-preview-grid');
    if (!previewGrid) return;

    if (selectedImageFiles.length === 0) {
      previewGrid.style.display = 'none';
      previewGrid.innerHTML = '';
      return;
    }

    previewGrid.style.display = 'grid';
    
    previewGrid.innerHTML = `
      <div style="grid-column: 1 / -1; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <p style="color: #666; font-size: 0.9rem; margin: 0;">
          <strong>${selectedImageFiles.length}</strong> görsel seçildi
        </p>
        <button type="button" class="add-more-images-btn" id="add-more-btn" title="Daha fazla görsel ekle">
          <span>+</span>
        </button>
      </div>
      ${selectedImageFiles.map((dataUrl, index) => `
        <div class="image-preview-item">
          <img src="${dataUrl}" alt="Görsel ${index + 1}" />
          <button 
            type="button" 
            class="remove-image-btn" 
            data-index="${index}"
            title="Kaldır"
          >
            <span>×</span>
          </button>
          <span class="image-number">${index + 1}</span>
        </div>
      `).join('')}
      <button type="button" class="add-more-images-btn" id="add-more-btn-end" title="Daha fazla görsel ekle">
        <span>+</span>
      </button>
    `;

    // Add click handlers for add more buttons
    previewGrid.querySelectorAll('#add-more-btn, #add-more-btn-end').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('post-image')?.click();
      });
    });

    // Add click handlers for remove buttons
    previewGrid.querySelectorAll('.remove-image-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(e.currentTarget.dataset.index);
        removeImage(index);
      });
    });
  }

  function removeImage(index) {
    selectedImageFiles.splice(index, 1);
    renderImagePreviews();
  }

  function clearSelectedImages() {
    selectedImageFiles = [];
    const previewGrid = document.getElementById('image-preview-grid');
    if (previewGrid) {
      previewGrid.style.display = 'none';
      previewGrid.innerHTML = '';
    }
    const input = document.getElementById('post-image');
    if (input) input.value = '';
  }

  // Compress image to Base64 data URL
  function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP or JPEG
          let dataUrl;
          try {
            // Try WebP first (better compression)
            dataUrl = canvas.toDataURL('image/webp', quality);
            // Fallback to JPEG if WebP not supported
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch (err) {
            // Fallback to JPEG
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Check size (Firestore limit is 1MB per document, aim for ~200KB)
          const sizeKB = Math.round(dataUrl.length / 1024);
          if (sizeKB > 300) {
            console.warn('Sıkıştırılmış görsel hala büyük:', sizeKB, 'KB, daha fazla sıkıştırılıyor...');
            // Retry with lower quality
            dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          }
          
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Görsel yüklenemedi'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Dosya okunamadı'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  function clearSelectedImage() {
    selectedImageFiles = [];
    const input = document.getElementById('post-image');
    if (input) input.value = '';

    const previewGrid = document.getElementById('image-preview-grid');
    if (previewGrid) {
      previewGrid.style.display = 'none';
      previewGrid.innerHTML = '';
    }
  }

  // Show edit post form
  function showEditPostForm(post) {
    closeModal();
    const container = document.getElementById('new-post-form-container');
    const form = document.getElementById('new-post-form');
    const heading = container?.querySelector('h2');
    
    if (container && form && heading) {
      clearSelectedImages();
      heading.textContent = 'Yazıyı Düzenle';
      document.getElementById('post-title').value = post.title;
      document.getElementById('post-category').value = post.category;
      document.getElementById('post-content').value = post.content;
      
      // Show existing images
      const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      if (images.length > 0) {
        selectedImageFiles = [...images];
        renderImagePreviews();
      }
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });

      // Temporary replace submit handler
      const originalHandler = form.onsubmit;
      form.onsubmit = (e) => {
        e.preventDefault();
        handleEditPostSubmit(post.id);
      };
    }
  }

  // Handle new post submit
  async function handleNewPostSubmit(e) {
    e.preventDefault();
    console.log('Yeni yazı gönderiliyor...', { currentUser });
    
    if (!currentUser) {
      alert('Lütfen giriş yapınız');
      return;
    }

    const title = document.getElementById('post-title')?.value?.trim();
    const category = document.getElementById('post-category')?.value;
    const content = document.getElementById('post-content')?.value?.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Validation
    if (!title || !category || !content) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    console.log('Form verileri:', { title, category, content, imageCount: selectedImageFiles.length });

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Yayınlanıyor...';
      }

      // selectedImageFiles is an array of Base64 data URLs
      const imageUrls = selectedImageFiles.length > 0 ? selectedImageFiles : null;

      console.log('Yazı oluşturuluyor...', imageUrls ? `${imageUrls.length} görsel ile` : 'görselsiz');
      await window.TSGLAuth.createPost({ title, category, content, imageUrls });
      console.log('Yazı başarıyla oluşturuldu');
      
      hideNewPostForm();
      alert('Yazı başarıyla yayınlandı! Sayfa yenileniyor...');
      
      // Refresh page to show new post
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Yazı yayınlanırken hata oluştu: ' + error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Yayınla';
      }
    }
  }

  // Handle edit post submit
  async function handleEditPostSubmit(postId) {
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value;
    const submitBtn = document.querySelector('#new-post-form button[type="submit"]');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Güncelleniyor...';
      }

      // selectedImageFiles is an array of Base64 data URLs
      const imageUrls = selectedImageFiles.length > 0 ? selectedImageFiles : null;

      await window.TSGLAuth.updatePost(postId, { title, category, content, imageUrls });
      hideNewPostForm();
      lastPostDoc = null;
      loadPosts();
      alert('Yazı başarıyla güncellendi!');
      
      // Reset form handler
      document.getElementById('new-post-form').onsubmit = handleNewPostSubmit;
      document.querySelector('#new-post-form-container h2').textContent = 'Yeni Yazı Yayınla';
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Yazı güncellenirken hata oluştu: ' + error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Yayınla';
      }
    }
  }

  // Handle delete post
  async function handleDeletePost(postId, cardElement = null, fromModal = false) {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;

    try {
      await window.TSGLAuth.deletePost(postId);
      alert('Yazı başarıyla silindi!');
      
      if (fromModal) {
        closeModal();
        lastPostDoc = null;
        loadPosts();
      } else if (cardElement) {
        cardElement.remove();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Yazı silinirken hata oluştu: ' + error.message);
    }
  }

  // Handle new comment submit
  async function handleNewCommentSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
      alert('Lütfen giriş yapınız');
      return;
    }

    if (!selectedPostId) {
      alert('Yazı seçilmedi');
      return;
    }

    const content = document.getElementById('comment-content').value;

    try {
      await window.TSGLAuth.addComment({ postId: selectedPostId, content });
      document.getElementById('new-comment-form').reset();
      loadComments(selectedPostId);
      alert('Yorum başarıyla eklendi!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Yorum eklenirken hata oluştu: ' + error.message);
    }
  }

  // Handle delete comment
  async function handleDeleteComment(commentId, postId, commentElement) {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

    try {
      await window.TSGLAuth.deleteComment(commentId, postId);
      commentElement.remove();
      alert('Yorum başarıyla silindi!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Yorum silinirken hata oluştu: ' + error.message);
    }
  }

  // Handle search
  function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    // This would require a more advanced search implementation
    // For now, just a placeholder
  }

  // Handle load more
  function handleLoadMore() {
    loadPosts();
  }

  // Lightbox functions
  let currentLightboxImages = [];
  let currentLightboxIndex = 0;

  function openLightbox(images, startIndex = 0) {
    currentLightboxImages = images;
    currentLightboxIndex = startIndex;

    // Create lightbox if it doesn't exist
    let lightbox = document.getElementById('image-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'image-lightbox';
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-overlay"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Kapat">&times;</button>
          <button class="lightbox-prev" aria-label="Önceki">‹</button>
          <button class="lightbox-next" aria-label="Sonraki">›</button>
          <img class="lightbox-image" src="" alt="Görsel" />
          <div class="lightbox-counter"></div>
        </div>
      `;
      document.body.appendChild(lightbox);

      // Event listeners
      lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
      lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
      lightbox.querySelector('.lightbox-prev').addEventListener('click', showPrevImage);
      lightbox.querySelector('.lightbox-next').addEventListener('click', showNextImage);

      // Keyboard navigation
      document.addEventListener('keydown', handleLightboxKeyboard);
    }

    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function showPrevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    updateLightboxImage();
  }

  function showNextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
    updateLightboxImage();
  }

  function updateLightboxImage() {
    const lightbox = document.getElementById('image-lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    img.src = currentLightboxImages[currentLightboxIndex];
    counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;

    // Hide/show navigation buttons
    prevBtn.style.display = currentLightboxImages.length > 1 ? 'block' : 'none';
    nextBtn.style.display = currentLightboxImages.length > 1 ? 'block' : 'none';
  }

  function handleLightboxKeyboard(e) {
    const lightbox = document.getElementById('image-lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showPrevImage();
    else if (e.key === 'ArrowRight') showNextImage();
  }

  // Like post function
  async function handleLikePost(postId) {
    if (!currentUser) {
      // Show login prompt with modal
      const message = document.createElement('div');
      message.className = 'login-prompt';
      message.innerHTML = `
        <div class="login-prompt-content">
          <p>🔐 Beğenmek için lütfen giriş yapın</p>
          <button class="btn primary" onclick="window.location.hash = '#giris'">Giriş Yap</button>
          <button class="btn secondary" onclick="this.parentElement.parentElement.remove()">Kapat</button>
        </div>
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 4000);
      return;
    }

    const likeBtn = document.getElementById('like-post-btn');
    if (!likeBtn) return;

    try {
      likeBtn.style.opacity = '0.6';
      
      await window.TSGLAuth.toggleLikePost(postId);
      
      // Refresh post detail
      const fullPost = await window.TSGLAuth.getPost(postId);
      
      // Update like button
      const likeIcon = likeBtn.querySelector('.like-icon');
      const likeCount = likeBtn.querySelector('.like-count');
      
      likeBtn.classList.toggle('liked', fullPost.likedByCurrentUser);
      likeIcon.textContent = fullPost.likedByCurrentUser ? '❤️' : '🤍';
      likeCount.textContent = fullPost.likesCount || 0;
      
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Beğeni işlemi sırasında hata oluştu: ' + error.message);
    } finally {
      likeBtn.style.opacity = '1';
    }
  }

  // Close modal
  function closeModal() {
    const modal = document.getElementById('post-modal');
    if (modal) {
      modal.style.display = 'none';
      selectedPostId = null;
    }
  }

  // Update category counts
  async function updateCategoryCounts() {
    try {
      // Tüm postları al
      const allPostsResult = await window.TSGLAuth.getPosts(1000);
      const allPosts = allPostsResult.posts;
      
      // Kategorilere göre say
      const categoryCounts = {};
      allPosts.forEach(post => {
        const cat = post.category || 'Diğer';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      
      // Tümü sayısını güncelle
      const allBtn = document.querySelector('.category-btn[data-category="all"] .category-count');
      if (allBtn) {
        allBtn.textContent = `(${allPosts.length})`;
      }
      
      // Her kategori butonunun sayısını güncelle
      document.querySelectorAll('.category-btn[data-category]').forEach(btn => {
        const category = btn.dataset.category;
        if (category !== 'all') {
          const countSpan = btn.querySelector('.category-count');
          if (countSpan) {
            const count = categoryCounts[category] || 0;
            countSpan.textContent = `(${count})`;
          }
        }
      });
    } catch (error) {
      console.error('Kategori sayıları güncellenirken hata:', error);
    }
  }

  // Utility functions
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Tarih bilinmiyor';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'Tarih bilinmiyor';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
})();
