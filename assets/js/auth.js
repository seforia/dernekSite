(function(){
  // Safe guards - expose minimal API even if Firebase not loaded
  if (!window || !window.firebase || !window.FIREBASE_CONFIG) {
    console.warn('Firebase not initialized yet. Check firebase-config.js and Firebase SDK scripts.');
    // Expose dummy API so main.js doesn't break
    window.TSGLAuth = {
      auth: null,
      db: null,
      storage: null,
      isReady: () => false,
      signUp: async () => { throw new Error('Firebase not initialized'); },
      login: async () => { throw new Error('Firebase not initialized'); },
      ping: async () => false,
      uploadPostImage: async () => { throw new Error('Firebase not initialized'); },
      createPost: async () => { throw new Error('Firebase not initialized'); },
      updatePost: async () => { throw new Error('Firebase not initialized'); },
      deletePost: async () => { throw new Error('Firebase not initialized'); },
      addComment: async () => { throw new Error('Firebase not initialized'); },
      deleteComment: async () => { throw new Error('Firebase not initialized'); },
      getPosts: async () => [],
      getPostsByCategory: async () => [],
      getPost: async () => null,
      getComments: async () => [],
      getCategories: async () => []
    };
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
  const storage = firebase.storage();
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
          </div>
        </div>`;
      // continue to bind dropdown interactions
    } else if (user && user.displayName) {
      mount.innerHTML = `
        <div class="auth-dropdown user-menu" data-auth-dropdown>
          <button class="auth-trigger btn secondary" aria-haspopup="true" aria-expanded="false">👤 ${escapeHtml(user.displayName)}</button>
          <div class="auth-menu" role="menu" aria-hidden="true">
            <a role="menuitem" href="/content/profil/index.html" data-link class="menu-item">Profilim</a>
            <div class="menu-divider"></div>
            <button id="logout-btn-menu" class="menu-item logout-btn" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 0.75rem 1rem; color: #dc3545;">Çıkış Yap</button>
          </div>
        </div>`;
    } else if (user) {
      mount.innerHTML = `
        <div class="auth-dropdown user-menu" data-auth-dropdown>
          <button class="auth-trigger btn secondary" aria-haspopup="true" aria-expanded="false">👤 Kullanıcı</button>
          <div class="auth-menu" role="menu" aria-hidden="true">
            <a role="menuitem" href="/content/profil/index.html" data-link class="menu-item">Profilim</a>
            <div class="menu-divider"></div>
            <button id="logout-btn-menu" class="menu-item logout-btn" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 0.75rem 1rem; color: #dc3545;">Çıkış Yap</button>
          </div>
        </div>`;
    } else {
      mount.innerHTML = `
        <div class="auth-dropdown" data-auth-dropdown>
          <button class="auth-trigger btn secondary" aria-haspopup="true" aria-expanded="false">Kullanıcı Girişi</button>
          <div class="auth-menu" role="menu" aria-hidden="true">
            <a role="menuitem" href="/content/giris/index.html" data-link>Giriş Yap</a>
          </div>
        </div>`;
    }
    
    // Logout butonu için event listener
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => auth.signOut());
    }

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
  async function signUp({ name, email, graduationYear, password }) {
    try {
      console.log('🔍 signUp: Firebase Auth createUser başlıyor...', { name, email, graduationYear });
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      console.log('✅ signUp: Firebase Auth başarılı, UID:', cred.user.uid);
      
      await cred.user.updateProfile({ displayName: name });
      console.log('✅ signUp: Display name güncellendi');
      
      console.log('🔍 signUp: Firestore users collection\'a yazılıyor...');
      await db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        name,
        email,
        graduationYear,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ signUp: Firestore kaydı başarılı!');
      
      return cred.user;
    } catch (error) {
      console.error('❌ signUp hatası:', error);
      throw error;
    }
  }

  // Login with approval check
  async function login({ email, password }) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    
    // Kullanıcının onay durumunu kontrol et
    const userDoc = await db.collection('users').doc(cred.user.uid).get();
    if (!userDoc.exists) {
      // İlk giriş - users collection'a kaydet
      await db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        name: cred.user.displayName || cred.user.email,
        email: cred.user.email,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      throw new Error('Hesabınız onay bekliyor. Yönetici onayından sonra giriş yapabileceksiniz.');
    }
    
    const userData = userDoc.data();
    if (userData.status === 'pending') {
      await auth.signOut();
      throw new Error('Hesabınız onay bekliyor. Yönetici onayından sonra giriş yapabileceksiniz.');
    } else if (userData.status === 'rejected') {
      await auth.signOut();
      throw new Error('Hesabınız reddedildi. Daha fazla bilgi için iletişime geçiniz.');
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

  // YAZILARI YÖNETME İŞLEVLERİ
  // Yeni yazı oluştur
  async function createPost({ title, content, category, imageUrls, imageUrl }) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');
    
    // Kullanıcının onay durumunu kontrol et
    const isApproved = await checkUserApproval();
    if (!isApproved) {
      throw new Error('Yazı eklemek için hesabınızın onaylanması gerekiyor.');
    }

    // Kullanıcının mezuniyet yılını çek
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    const graduationYear = userData?.graduationYear || '';

    // Backward compatibility: imageUrl (single) veya imageUrls (array)
    let finalImageUrls = null;
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      finalImageUrls = imageUrls;
    } else if (imageUrl) {
      finalImageUrls = [imageUrl]; // Convert single to array
    }

    const newPost = {
      postId: db.collection('posts').doc().id,
      userId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonim',
      authorEmail: currentUser.email,
      authorGraduationYear: graduationYear,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      imageUrls: finalImageUrls, // Array of Base64 data URLs or null
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      viewCount: 0,
      commentCount: 0
    };

    await db.collection('posts').add(newPost);
    return newPost;
  }

  // Yazı güncelle (yalnızca yazar)
  async function updatePost(postId, { title, content, category, imageUrls, imageUrl }) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');

    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) throw new Error('Yazı bulunamadı.');
    
    const post = postDoc.data();
    if (post.userId !== currentUser.uid) {
      throw new Error('Bu yazıyı düzenleyemezsiniz.');
    }

    const updatePayload = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Backward compatibility: imageUrl (single) veya imageUrls (array)
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      updatePayload.imageUrls = imageUrls;
    } else if (imageUrl) {
      updatePayload.imageUrls = [imageUrl]; // Convert single to array
    }

    await db.collection('posts').doc(postId).update(updatePayload);
  }

  // Yazı sil (yalnızca yazar)
  async function deletePost(postId) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');

    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) throw new Error('Yazı bulunamadı.');
    
    const post = postDoc.data();
    if (post.userId !== currentUser.uid) {
      throw new Error('Bu yazıyı silemezsiniz.');
    }

    // Tüm yorumları sil
    const comments = await db.collection('comments').where('postId', '==', postId).get();
    const batch = db.batch();
    comments.forEach(doc => batch.delete(doc.ref));

    // No need to delete images from Storage anymore (using Base64)
    
    batch.delete(db.collection('posts').doc(postId));
    await batch.commit();
  }

  // Yazilar icin gorsel yukle
  async function uploadPostImage(file) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');
    if (!file) throw new Error('Gorsel secilmedi.');

    const safeName = String(file.name || 'image')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const path = `posts/${currentUser.uid}/${Date.now()}_${safeName}`;
    const ref = storage.ref().child(path);

    await ref.put(file);
    const url = await ref.getDownloadURL();
    return { url, path };
  }

  // Compress image to Base64 (profile photo)
  function compressProfileImage(file, maxWidth = 400, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (square crop for profile)
          const size = Math.min(img.width, img.height);
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxWidth;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, maxWidth, maxWidth);
          
          // Convert to WebP or JPEG
          let dataUrl;
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch (err) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Check size
          const sizeKB = Math.round(dataUrl.length / 1024);
          if (sizeKB > 200) {
            console.warn('Profil fotoğrafı büyük:', sizeKB, 'KB, daha fazla sıkıştırılıyor...');
            dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          }
          
          resolve(dataUrl);
        };
        
        img.onerror = () => reject(new Error('Görsel yüklenemedi'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });
  }

  // Profil fotoğrafı yükle (Base64 format - Storage gerekmez)
  async function uploadProfilePhoto(file) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');
    if (!file) throw new Error('Fotoğraf seçilmedi.');

    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      throw new Error('Lütfen bir görsel dosyası seçiniz.');
    }

    // Dosya boyutunu kontrol et (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Fotoğraf maksimum 5MB olmalıdır.');
    }

    // Compress to base64
    const photoDataUrl = await compressProfileImage(file);
    
    // Firestore'da kaydet
    await db.collection('users').doc(currentUser.uid).set({
      photoURL: photoDataUrl,
      updatedAt: new Date()
    }, { merge: true });

    // Firebase Auth profil de güncelle (optional, base64 too long for Auth)
    // Auth profileUpdate yerine sadece Firestore'u kullanacağız

    return photoDataUrl;
  }

  // Yorum ekle
  async function addComment({ postId, content }) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');
    
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) throw new Error('Yazı bulunamadı.');

    const newComment = {
      commentId: db.collection('comments').doc().id,
      postId,
      userId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonim',
      authorEmail: currentUser.email,
      content: content.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('comments').add(newComment);
    
    // Yazının yorum sayısını güncelleştir
    const postData = postDoc.data();
    await db.collection('posts').doc(postId).update({
      commentCount: (postData.commentCount || 0) + 1
    });

    return newComment;
  }

  // Yorum sil (yalnızca yazarı)
  async function deleteComment(commentId, postId) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');

    const commentDoc = await db.collection('comments').doc(commentId).get();
    if (!commentDoc.exists) throw new Error('Yorum bulunamadı.');
    
    const comment = commentDoc.data();
    if (comment.userId !== currentUser.uid) {
      throw new Error('Bu yorumu silemezsiniz.');
    }

    await db.collection('comments').doc(commentId).delete();

    // Yazının yorum sayısını azalt
    const postDoc = await db.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      const postData = postDoc.data();
      await db.collection('posts').doc(postId).update({
        commentCount: Math.max(0, (postData.commentCount || 1) - 1)
      });
    }
  }

  // Yazıları getir
  async function getPosts(pageSize = 10, lastDoc = null) {
    try {
      let query = db.collection('posts').limit(pageSize + 1); // Get one extra for pagination check
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const posts = [];
      const currentUser = auth.currentUser;
      
      // Process all documents and get likes info
      for (const doc of snapshot.docs.slice(0, pageSize)) {
        const data = doc.data();
        
        // Get likes count
        const likesSnapshot = await db.collection('likes')
          .where('postId', '==', doc.id)
          .get();
        
        // Check if current user liked this post
        let likedByCurrentUser = false;
        if (currentUser) {
          const likeDoc = await db.collection('likes')
            .where('postId', '==', doc.id)
            .where('userId', '==', currentUser.uid)
            .get();
          likedByCurrentUser = !likeDoc.empty;
        }
        
        posts.push({ 
          id: doc.id, 
          ...data,
          likesCount: likesSnapshot.size,
          likedByCurrentUser
        });
      }
      
      // Sort by createdAt descending
      posts.sort((a, b) => {
        let timeA = a.createdAt?.toDate?.() || new Date(0);
        let timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      const nextLastDoc = snapshot.docs[pageSize] || null; // Check if there are more docs
      console.log('getPosts başarılı:', posts.length, 'yazı bulundu');
      return { posts, nextLastDoc };
    } catch (error) {
      console.error('getPosts hatası:', error);
      throw error;
    }
  }

  // Yazıları kategoriye göre getir
  async function getPostsByCategory(category, pageSize = 10, lastDoc = null) {
    try {
      let query = db.collection('posts').where('category', '==', category).limit(pageSize + 1);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const posts = [];
      const currentUser = auth.currentUser;
      
      // Process documents and get likes info
      for (const doc of snapshot.docs.slice(0, pageSize)) {
        const data = doc.data();
        
        // Get likes count
        const likesSnapshot = await db.collection('likes')
          .where('postId', '==', doc.id)
          .get();
        
        // Check if current user liked this post
        let likedByCurrentUser = false;
        if (currentUser) {
          const likeDoc = await db.collection('likes')
            .where('postId', '==', doc.id)
            .where('userId', '==', currentUser.uid)
            .get();
          likedByCurrentUser = !likeDoc.empty;
        }
        
        posts.push({ 
          id: doc.id, 
          ...data,
          likesCount: likesSnapshot.size,
          likedByCurrentUser
        });
      }
      
      // Sort by createdAt descending
      posts.sort((a, b) => {
        let timeA = a.createdAt?.toDate?.() || new Date(0);
        let timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      const nextLastDoc = snapshot.docs[pageSize] || null;
      console.log('getPostsByCategory başarılı:', posts.length, 'yazı bulundu (kategori:', category + ')');
      return { posts, nextLastDoc };
    } catch (error) {
      console.error('getPostsByCategory hatası:', error);
      throw error;
    }
  }

  // Yazısı seçmek
  async function getPost(postId) {
    const currentUser = auth.currentUser;
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) throw new Error('Yazı bulunamadı.');
    
    const postData = postDoc.data();
    
    // Görüntüleme sayısını arttır (izin hatasını yoksay)
    try {
      await db.collection('posts').doc(postId).update({
        viewCount: (postData.viewCount || 0) + 1
      });
    } catch (error) {
      console.log('ViewCount güncellemesi başarısız (normal):', error.message);
    }

    // Check if current user liked this post
    let likedByCurrentUser = false;
    if (currentUser) {
      try {
        const likeDoc = await db.collection('likes')
          .where('postId', '==', postId)
          .where('userId', '==', currentUser.uid)
          .get();
        likedByCurrentUser = !likeDoc.empty;
      } catch (error) {
        console.log('Beğeni kontrol hatası:', error.message);
      }
    }

    // Get likes count
    let likesCount = 0;
    try {
      const likesSnapshot = await db.collection('likes')
        .where('postId', '==', postId)
        .get();
      likesCount = likesSnapshot.size;
    } catch (error) {
      console.log('Beğeni sayısı hatası:', error.message);
    }

    return { 
      id: postDoc.id, 
      ...postData,
      likesCount: likesCount,
      likedByCurrentUser 
    };
  }

  // Toggle like on post
  async function toggleLikePost(postId) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Lütfen giriş yapınız.');

    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) throw new Error('Yazı bulunamadı.');

    // Check if already liked
    const likeQuery = await db.collection('likes')
      .where('postId', '==', postId)
      .where('userId', '==', currentUser.uid)
      .get();

    if (likeQuery.empty) {
      // Add like
      await db.collection('likes').add({
        postId,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Remove like
      const batch = db.batch();
      likeQuery.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  // Yazıya ait yorumları getir
  async function getComments(postId) {
    try {
      console.log('🔍 getComments: Query başlıyor, postId:', postId);
      const snapshot = await db.collection('comments').where('postId', '==', postId).get();
      console.log('✅ getComments:', snapshot.size, 'yorum bulundu');
      
      const comments = [];
      snapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      
      // createdAt'e göre manuel sıralama (orderBy yerine)
      comments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      return comments;
    } catch (error) {
      console.error('❌ getComments hatası:', error);
      throw error;
    }
  }

  // Tüm kategorileri getir
  async function getCategories() {
    const snapshot = await db.collection('posts').get();
    const categories = new Set();
    snapshot.forEach(doc => {
      const post = doc.data();
      if (post.category) categories.add(post.category);
    });
    return Array.from(categories).sort();
  }

  // KULLANICI YÖNETİMİ (ADMIN)
  // Kullanıcının onay durumunu kontrol et
  async function checkUserApproval() {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    return userData.status === 'approved';
  }

  // Bekleyen kullanıcıları getir (admin)
  async function getUsersPendingApproval() {
    try {
      console.log('🔍 getUsersPendingApproval: Firestore query başlıyor...');
      const snapshot = await db.collection('users')
        .where('status', '==', 'pending')
        .get();
      console.log('✅ getUsersPendingApproval:', snapshot.size, 'bekleyen kullanıcı bulundu');
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // createdAt'e göre manuel sıralama
      users.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      return users;
    } catch (error) {
      console.error('❌ getUsersPendingApproval hatası:', error);
      throw error;
    }
  }

  // Tüm kullanıcıları getir (admin)
  // Tüm kullanıcıları getir (admin)
  async function getAllUsers() {
    try {
      console.log('🔍 getAllUsers: Firestore query başlıyor...');
      const snapshot = await db.collection('users').get();
      console.log('✅ getAllUsers: Query başarılı,', snapshot.size, 'kullanıcı bulundu');
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // createdAt'e göre manuel sıralama (orderBy yerine)
      users.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      return users;
    } catch (error) {
      console.error('❌ getAllUsers hatası:', error);
      throw error;
    }
  }

  // Kullanıcıyı onayla (admin)
  async function approveUser(uid) {
    try {
      await db.collection('users').doc(uid).update({
        status: 'approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Kullanıcı onaylandı:', uid);
    } catch (error) {
      console.error('❌ Onay hatası:', error);
      throw new Error('Kullanıcı onaylanırken hata oluştu. Admin UID kontrolü yapın. ' + error.message);
    }
  }

  // Kullanıcıyı reddet (admin)
  async function rejectUser(uid) {
    try {
      await db.collection('users').doc(uid).update({
        status: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Kullanıcı reddedildi:', uid);
    } catch (error) {
      console.error('❌ Red hatası:', error);
      throw new Error('Kullanıcı reddedilirken hata oluştu. Admin UID kontrolü yapın. ' + error.message);
    }
  }

  // Kullanıcı durumunu getir
  async function getUserStatus(uid) {
    const userDoc = await db.collection('users').doc(uid || auth.currentUser?.uid).get();
    if (!userDoc.exists) return null;
    return userDoc.data().status;
  }

  window.TSGLAuth = { 
    auth, 
    db, 
    storage,
    signUp, 
    login, 
    isReady: () => ready, 
    ping,
    uploadPostImage,
    uploadProfilePhoto,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    getPosts,
    getPostsByCategory,
    getPost,
    getComments,
    getCategories,
    toggleLikePost,
    // Admin functions
    checkUserApproval,
    getUsersPendingApproval,
    getAllUsers,
    approveUser,
    rejectUser,
    getUserStatus
  };

  // Update header on auth state change
  auth.onAuthStateChanged((user) => renderAuthUI(user));
})();
