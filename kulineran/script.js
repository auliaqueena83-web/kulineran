/* ==========================================================
   KULINERAN — script.js
   Filter kategori, posting baru (upload foto/video + deskripsi),
   tombol "ngiler", dan lightbox detail postingan.
   ========================================================== */

(() => {
  "use strict";

  const CATEGORY_LABEL = {
    berkuah: "🍜 Berkuah",
    jajanan: "🍢 Jajanan",
    manis: "🍰 Manis",
    pedas: "🌶️ Pedas",
    sehat: "🥗 Sehat",
  };

  const CATEGORY_ICON = {
    berkuah: "🍜",
    jajanan: "🍢",
    manis: "🍰",
    pedas: "🌶️",
    sehat: "🥗",
  };

  // ---------- seed data: postingan contoh dari pengguna ----------
  const seedPosts = [];

  // state: kumpulan post yang tampil (seed + upload baru)
  // Load posts dari localStorage terlebih dahulu
  let savedPostsFromStorage = [];
  try {
    savedPostsFromStorage = JSON.parse(localStorage.getItem("kulineran_posts") || "[]");
  } catch (e) {
    savedPostsFromStorage = [];
  }
  let posts = [...seedPosts, ...savedPostsFromStorage].map((p, i) => {
    if (!p.id) {
      p.id = "seed-" + i;
    }
    if (!p.mediaURL) {
      p.mediaURL = null;
    }
    return p;
  });
  let activeFilter = "semua";
  let pendingMedia = null; // { url, type: 'image'|'video' }
  
  // state: saved posts (disimpan di localStorage)
  let savedPostIds = new Set();
  function loadSavedPosts() {
    try {
      savedPostIds = new Set(JSON.parse(localStorage.getItem("kulineran_saved") || "[]"));
    } catch (e) {
      savedPostIds = new Set();
    }
  }
  function saveSavedPosts() {
    localStorage.setItem("kulineran_saved", JSON.stringify([...savedPostIds]));
  }
  loadSavedPosts();

  // ---------- elemen ----------
  const feedGrid = document.getElementById("feedGrid");
  const feedEmpty = document.getElementById("feedEmpty");
  const filterRow = document.getElementById("filterRow");
  const totalPostsEl = document.getElementById("totalPosts");

  const uploadModal = document.getElementById("uploadModal");
  const openUploadBtn = document.getElementById("openUploadBtn");
  const heroUploadBtn = document.getElementById("heroUploadBtn");
  const ctaUploadBtn = document.getElementById("ctaUploadBtn");
  const closeUploadBtn = document.getElementById("closeUploadBtn");
  const uploadForm = document.getElementById("uploadForm");

  const dropzone = document.getElementById("dropzone");
  const mediaInput = document.getElementById("mediaInput");
  const dropzoneEmpty = document.getElementById("dropzoneEmpty");
  const dropzonePreview = document.getElementById("dropzonePreview");

  const lightbox = document.getElementById("lightbox");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxMedia = document.getElementById("lightboxMedia");
  const lightboxTag = document.getElementById("lightboxTag");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDesc = document.getElementById("lightboxDesc");
  const lightboxUser = document.getElementById("lightboxUser");
  const lightboxTime = document.getElementById("lightboxTime");
  const lightboxSaveBtn = document.getElementById("lightboxSaveBtn");

  const editModal = document.getElementById("editModal");
  const closeEditBtn = document.getElementById("closeEditBtn");
  const editForm = document.getElementById("editForm");
  const deletePostBtn = document.getElementById("deletePostBtn");
  const editMediaInput = document.getElementById("editMediaInput");
  const editDropzoneEmpty = document.getElementById("editDropzoneEmpty");
  const editDropzonePreview = document.getElementById("editDropzonePreview");

  const toast = document.getElementById("toast");
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  const hasHomePageLayout = !!feedGrid && !!feedEmpty && !!filterRow && !!uploadModal && !!navToggle && !!mobileNav;
  if (!hasHomePageLayout) {
    return;
  }

  // ---------- status login (header: Masuk/Daftar vs profil) ----------
  const authGuest = document.getElementById("authGuest");
  const authUser = document.getElementById("authUser");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLoginLink = document.getElementById("mobileLoginLink");
  const mobileRegisterLink = document.getElementById("mobileRegisterLink");
  const mobileLogoutLink = document.getElementById("mobileLogoutLink");

  function getSession() {
    try { return JSON.parse(localStorage.getItem("kulineran_session")); }
    catch (e) { return null; }
  }

  function applyAuthUI() {
    const session = getSession();
    const loggedIn = !!(session && session.loggedIn);

    authGuest.hidden = loggedIn;
    authUser.hidden = !loggedIn;
    mobileLoginLink.hidden = loggedIn;
    mobileRegisterLink.hidden = loggedIn;
    mobileLogoutLink.hidden = !loggedIn;

    if (loggedIn) {
      const name = session.displayName || "Kamu";
      userName.textContent = name;
      userAvatar.textContent = name.trim().charAt(0).toUpperCase() || "👤";
    }
  }

  function logout() {
    localStorage.removeItem("kulineran_session");
    applyAuthUI();
    showToast("Kamu sudah keluar. Sampai jumpa lagi!");
  }

  logoutBtn.addEventListener("click", logout);
  mobileLogoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
    mobileNav.classList.remove("is-open");
  });

  applyAuthUI();

  // ---------- render feed ----------
  function renderFeed() {
    const visible = activeFilter === "semua"
      ? posts
      : posts.filter((p) => p.category === activeFilter);

    feedGrid.innerHTML = "";
    feedEmpty.hidden = visible.length !== 0;

    visible.forEach((post) => {
      feedGrid.appendChild(buildCard(post));
    });
  }

  function buildCard(post) {
    const card = document.createElement("article");
    card.className = "post-card";
    card.dataset.id = post.id;

    // media
    const media = document.createElement("div");
    media.className = "post-media";
    media.setAttribute("role", "button");
    media.setAttribute("tabindex", "0");
    media.setAttribute("aria-label", "Lihat detail " + post.title);

    if (post.mediaURL) {
      if (post.mediaType === "video") {
        const vid = document.createElement("video");
        vid.src = post.mediaURL;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        media.appendChild(vid);
        media.addEventListener("mouseenter", () => vid.play().catch(() => {}));
        media.addEventListener("mouseleave", () => vid.pause());
      } else {
        const img = document.createElement("img");
        img.src = post.mediaURL;
        img.alt = post.title;
        media.appendChild(img);
      }
    } else {
      media.style.background = "linear-gradient(150deg, var(--terracotta-light), var(--terracotta))";
      media.textContent = post.icon || "🍽️";
      if (post.isVideo) {
        const badge = document.createElement("div");
        badge.className = "play-badge";
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.25)"/><path d="M10 8L16 12L10 16V8Z" fill="white"/></svg>';
        media.appendChild(badge);
      }
    }

    const tag = document.createElement("span");
    tag.className = "post-tag";
    tag.textContent = CATEGORY_LABEL[post.category] || post.category;
    media.appendChild(tag);

    media.addEventListener("click", () => openLightbox(post));
    media.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(post); }
    });

    // body
    const body = document.createElement("div");
    body.className = "post-body";

    const title = document.createElement("h3");
    title.className = "post-title";
    title.textContent = post.title;

    const descContainer = document.createElement("div");
    descContainer.className = "post-desc-container";
    
    const desc = document.createElement("p");
    desc.className = "post-desc";
    desc.textContent = post.desc;
    desc.setAttribute("data-post-id", post.id);
    
    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "expand-desc-btn";
    expandBtn.textContent = "Baca selengkapnya";
    expandBtn.setAttribute("aria-expanded", "false");
    expandBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = desc.classList.toggle("is-expanded");
      expandBtn.textContent = isExpanded ? "Sembunyikan" : "Baca selengkapnya";
      expandBtn.setAttribute("aria-expanded", String(isExpanded));
    });
    
    descContainer.appendChild(desc);
    descContainer.appendChild(expandBtn);

    const meta = document.createElement("div");
    meta.className = "post-meta";
    meta.innerHTML = `<span>${escapeHTML(post.user)}</span><span>${escapeHTML(post.time)}</span>`;

    const footer = document.createElement("div");
    footer.className = "post-footer";

    const ngilerBtn = document.createElement("button");
    ngilerBtn.type = "button";
    ngilerBtn.className = "ngiler-btn";
    ngilerBtn.setAttribute("aria-pressed", "false");
    ngilerBtn.innerHTML = flameSVG() + ' <span class="ngiler-count">' + formatNumber(post.ngiler) + " ngiler</span>";
    ngilerBtn.addEventListener("click", () => {
      const isActive = ngilerBtn.classList.toggle("is-active");
      post.ngiler += isActive ? 1 : -1;
      ngilerBtn.querySelector(".ngiler-count").textContent = formatNumber(post.ngiler) + " ngiler";
      ngilerBtn.setAttribute("aria-pressed", String(isActive));
      ngilerBtn.classList.remove("bump");
      void ngilerBtn.offsetWidth;
      ngilerBtn.classList.add("bump");
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "save-btn";
    saveBtn.setAttribute("aria-label", "Simpan postingan");
    saveBtn.setAttribute("aria-pressed", String(savedPostIds.has(post.id)));
    saveBtn.innerHTML = bookmarkSVG();
    if (savedPostIds.has(post.id)) {
      saveBtn.classList.add("is-saved");
    }
    saveBtn.addEventListener("click", () => {
      const isSaved = saveBtn.classList.toggle("is-saved");
      if (isSaved) {
        savedPostIds.add(post.id);
      } else {
        savedPostIds.delete(post.id);
      }
      saveSavedPosts();
      saveBtn.setAttribute("aria-pressed", String(isSaved));
    });

    footer.appendChild(ngilerBtn);
    footer.appendChild(saveBtn);

    // Edit/Delete buttons (hanya untuk author)
    const session = getSession();
    const isAuthor = session && (
      session.email === post.authorEmail || 
      session.username === post.authorUsername
    );

    body.appendChild(title);
    body.appendChild(descContainer);
    body.appendChild(meta);

    if (isAuthor) {
      const actionContainer = document.createElement("div");
      actionContainer.className = "post-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn edit-btn";
      editBtn.setAttribute("aria-label", "Edit postingan");
      editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94m-2.83-2.83L17.81 9.94m0 0L21 6.94M9.11 17.25L6.94 15.08" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      editBtn.addEventListener("click", () => openEditModal(post));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.setAttribute("aria-label", "Hapus postingan");
      deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 6.4L5 6.4M10 10.7V17M14 10.7V17M3 6.4H4.33L6.3 20c.2 1.5 1.5 2.5 3 2.5h5.4c1.5 0 2.8-1 3-2.5L19.67 6.4H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      deleteBtn.addEventListener("click", () => deletePost(post));

      actionContainer.appendChild(editBtn);
      actionContainer.appendChild(deleteBtn);
      body.appendChild(actionContainer);
    }

    body.appendChild(footer);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function flameSVG() {
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 7 7 12.5C7 16 9.5 18 12 18C14.5 18 17 16 17 12.5C17 11.5 16.7 10.6 16.3 9.8C15.9 11 15 11.5 15 11.5C15.5 8.5 13.5 6 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 15.5C9.5 17.4 10.6 19 12 19C13.4 19 14.5 17.4 14.5 15.5C14.5 14.3 13.8 13.4 13.2 12.7C13 14 12 14.5 12 14.5C12 14.5 11 14 10.8 12.7C10.2 13.4 9.5 14.3 9.5 15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  function bookmarkSVG() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
  }
  function commentSVG() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:-3px"><path d="M4 5H20V16H8L4 20V5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- filter chips ----------
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    [...filterRow.querySelectorAll(".chip")].forEach((c) => {
      c.classList.toggle("is-active", c === btn);
      c.setAttribute("aria-selected", String(c === btn));
    });
    renderFeed();
  });

  // ---------- lightbox (Threads style) ----------
  let currentLightboxPost = null;
  let lightboxPanel = document.getElementById("lightboxPanel");
  let lightboxTouchStart = 0;
  let lightboxTouchEnd = 0;
  
  function openLightbox(post) {
    currentLightboxPost = post;
    lightboxMedia.innerHTML = "";
    if (post.mediaURL) {
      if (post.mediaType === "video") {
        const vid = document.createElement("video");
        vid.src = post.mediaURL;
        vid.controls = false;
        vid.autoplay = true;
        vid.loop = true;
        vid.playsInline = true;
        lightboxMedia.appendChild(vid);
      } else {
        const img = document.createElement("img");
        img.src = post.mediaURL;
        img.alt = post.title;
        lightboxMedia.appendChild(img);
      }
      lightboxMedia.style.background = "var(--ink)";
    } else {
      lightboxMedia.textContent = post.icon || "🍽️";
      lightboxMedia.style.background = "linear-gradient(150deg, var(--terracotta-light), var(--terracotta))";
    }
    lightboxTag.textContent = CATEGORY_LABEL[post.category] || post.category;
    lightboxTitle.textContent = post.title;
    lightboxDesc.textContent = post.desc;
    lightboxUser.textContent = post.user;
    lightboxTime.textContent = post.time;
    
    // update save button state
    const isSaved = savedPostIds.has(post.id);
    if (isSaved) {
      lightboxSaveBtn.classList.add("is-saved");
    } else {
      lightboxSaveBtn.classList.remove("is-saved");
    }
    lightboxSaveBtn.setAttribute("aria-pressed", String(isSaved));
    
    // reset panel position
    if (lightboxPanel) {
      lightboxPanel.style.transform = "translateY(0)";
      lightboxPanel.classList.remove("is-expanded");
    }
    
    showModal(lightbox);
  }
  
  // Threads-style swipe/drag untuk panel info
  if (lightboxPanel) {
    let isDragging = false;
    let dragStartY = 0;
    let dragCurrentY = 0;
    
    lightboxPanel.addEventListener("touchstart", (e) => {
      isDragging = true;
      dragStartY = e.touches[0].clientY;
      dragCurrentY = dragStartY;
    }, false);
    
    lightboxPanel.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      dragCurrentY = e.touches[0].clientY;
      const diff = dragCurrentY - dragStartY;
      
      // Hanya geser ke bawah (positive transform)
      if (diff > 0) {
        lightboxPanel.style.transform = "translateY(" + diff + "px)";
      }
    }, false);
    
    lightboxPanel.addEventListener("touchend", (e) => {
      isDragging = false;
      const diff = dragCurrentY - dragStartY;
      const threshold = 100; // pixel untuk trigger snap
      
      if (diff > threshold) {
        // Close lightbox
        hideModal(lightbox);
      } else {
        // Snap back
        lightboxPanel.style.transform = "translateY(0)";
      }
    }, false);
    
    // Mouse drag support
    lightboxPanel.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // hanya left mouse button
      isDragging = true;
      dragStartY = e.clientY;
      dragCurrentY = dragStartY;
      e.preventDefault();
    }, false);
    
    document.addEventListener("mousemove", (e) => {
      if (!isDragging || lightbox.hidden) return;
      dragCurrentY = e.clientY;
      const diff = dragCurrentY - dragStartY;
      
      if (diff > 0) {
        lightboxPanel.style.transform = "translateY(" + diff + "px)";
      }
    }, false);
    
    document.addEventListener("mouseup", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diff = dragCurrentY - dragStartY;
      const threshold = 100;
      
      if (diff > threshold) {
        hideModal(lightbox);
      } else {
        lightboxPanel.style.transform = "translateY(0)";
      }
    }, false);
  }
  
  lightboxSaveBtn.addEventListener("click", () => {
    if (!currentLightboxPost) return;
    const isSaved = lightboxSaveBtn.classList.toggle("is-saved");
    if (isSaved) {
      savedPostIds.add(currentLightboxPost.id);
    } else {
      savedPostIds.delete(currentLightboxPost.id);
    }
    saveSavedPosts();
    lightboxSaveBtn.setAttribute("aria-pressed", String(isSaved));
  });
  
  closeLightboxBtn.addEventListener("click", () => hideModal(lightbox));
  lightbox.addEventListener("click", (e) => { 
    // Hanya tutup jika klik di overlay (bukan di lightbox-threads container)
    if (e.target === lightbox) {
      hideModal(lightbox); 
    }
  });

  // ---------- modal helpers ----------
  function showModal(el) {
    el.hidden = false;
    document.body.style.overflow = "hidden";
    if (el.id === "lightbox") {
      lightbox.classList.add("lightbox-active");
    }
  }
  function hideModal(el) {
    el.hidden = true;
    document.body.style.overflow = "";
    if (el.id === "lightbox") {
      lightbox.classList.remove("lightbox-active");
    }
  }

  [openUploadBtn, heroUploadBtn, ctaUploadBtn].forEach((btn) => {
    btn.addEventListener("click", () => showModal(uploadModal));
  });
  closeUploadBtn.addEventListener("click", () => hideModal(uploadModal));
  uploadModal.addEventListener("click", (e) => { if (e.target === uploadModal) hideModal(uploadModal); });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!uploadModal.hidden) hideModal(uploadModal);
    if (!lightbox.hidden) hideModal(lightbox);
    if (!editModal.hidden) hideModal(editModal);
  });

  // ---------- edit modal ----------
  let currentEditPost = null;
  let editPendingMedia = null;

  closeEditBtn.addEventListener("click", () => hideModal(editModal));
  editModal.addEventListener("click", (e) => { if (e.target === editModal) hideModal(editModal); });

  editMediaInput.addEventListener("change", () => {
    const file = editMediaInput.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const url = URL.createObjectURL(file);
    editPendingMedia = { url, type: isVideo ? "video" : "image" };

    editDropzoneEmpty.hidden = true;
    editDropzonePreview.hidden = false;
    editDropzonePreview.innerHTML = "";
    const el = document.createElement(isVideo ? "video" : "img");
    el.src = url;
    if (isVideo) { el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; }
    else { el.alt = "Pratinjau makanan"; }
    editDropzonePreview.appendChild(el);
    const hint = document.createElement("span");
    hint.className = "change-hint";
    hint.textContent = "Ganti file";
    editDropzonePreview.appendChild(hint);
  });

  function openEditModal(post) {
    currentEditPost = post;
    editPendingMedia = null;

    // Set form values
    document.getElementById("editPostTitle").value = post.title;
    document.getElementById("editPostDesc").value = post.desc;
    document.getElementById("editPostCategory").value = post.category;

    // Reset media preview
    editDropzoneEmpty.hidden = false;
    editDropzonePreview.hidden = true;
    editDropzonePreview.innerHTML = "";
    editMediaInput.value = "";

    // Show existing media if there is one
    if (post.mediaURL) {
      editDropzoneEmpty.hidden = true;
      editDropzonePreview.hidden = false;
      const el = document.createElement(post.mediaType === "video" ? "video" : "img");
      el.src = post.mediaURL;
      if (post.mediaType === "video") { el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; }
      else { el.alt = post.title; }
      editDropzonePreview.appendChild(el);
      const hint = document.createElement("span");
      hint.className = "change-hint";
      hint.textContent = "Ganti file";
      editDropzonePreview.appendChild(hint);
    }

    showModal(editModal);
  }

  function deletePost(post) {
    if (!confirm("Yakin mau hapus postingan ini? Tidak bisa di-undo.")) {
      return;
    }

    // Hapus dari array posts
    const index = posts.findIndex(p => p.id === post.id);
    if (index > -1) {
      posts.splice(index, 1);
    }

    // Hapus dari localStorage
    const savedPosts = JSON.parse(localStorage.getItem("kulineran_posts") || "[]");
    const savedIndex = savedPosts.findIndex(p => p.id === post.id);
    if (savedIndex > -1) {
      savedPosts.splice(savedIndex, 1);
      localStorage.setItem("kulineran_posts", JSON.stringify(savedPosts));
    }

    // Hapus dari saved posts jika tersimpan
    if (savedPostIds.has(post.id)) {
      savedPostIds.delete(post.id);
      saveSavedPosts();
    }

    updateTotalPosts();
    renderFeed();
    hideModal(editModal);
    showToast("Postingan berhasil dihapus");
  }

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentEditPost) return;

    const title = document.getElementById("editPostTitle").value.trim();
    const desc = document.getElementById("editPostDesc").value.trim();
    const category = document.getElementById("editPostCategory").value;

    if (!title || !desc) return;

    // Update post data
    currentEditPost.title = title;
    currentEditPost.desc = desc;
    currentEditPost.category = category;
    currentEditPost.icon = CATEGORY_ICON[category] || "🍽️";

    // Update media jika ada yang baru
    if (editPendingMedia) {
      currentEditPost.mediaURL = editPendingMedia.url;
      currentEditPost.mediaType = editPendingMedia.type;
      currentEditPost.isVideo = editPendingMedia.type === "video";
    }

    // Update di localStorage
    const savedPosts = JSON.parse(localStorage.getItem("kulineran_posts") || "[]");
    const postIndex = savedPosts.findIndex(p => p.id === currentEditPost.id);
    if (postIndex > -1) {
      savedPosts[postIndex] = currentEditPost;
      localStorage.setItem("kulineran_posts", JSON.stringify(savedPosts));
    }

    renderFeed();
    hideModal(editModal);
    showToast("Postingan berhasil diupdate");
  });

  deletePostBtn.addEventListener("click", () => {
    if (currentEditPost) {
      deletePost(currentEditPost);
    }
  });

  // ---------- dropzone: pilih foto/video ----------
  dropzone.addEventListener("click", (e) => {
    // label sudah memicu klik input lewat "for", cegah dobel trigger saat klik area preview
  });
  mediaInput.addEventListener("change", () => {
    const file = mediaInput.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const url = URL.createObjectURL(file);
    pendingMedia = { url, type: isVideo ? "video" : "image" };

    dropzoneEmpty.hidden = true;
    dropzonePreview.hidden = false;
    dropzonePreview.innerHTML = "";
    const el = document.createElement(isVideo ? "video" : "img");
    el.src = url;
    if (isVideo) { el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; }
    else { el.alt = "Pratinjau makanan"; }
    dropzonePreview.appendChild(el);
    const hint = document.createElement("span");
    hint.className = "change-hint";
    hint.textContent = "Ganti file";
    dropzonePreview.appendChild(hint);
  });

  // ---------- submit posting baru ----------
  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("postTitle").value.trim();
    const desc = document.getElementById("postDesc").value.trim();
    const category = document.getElementById("postCategory").value;
    const userRaw = document.getElementById("postUser").value.trim();
    const user = userRaw ? (userRaw.startsWith("@") ? userRaw : "@" + userRaw) : "@kamu";

    if (!title || !desc) return;

    const session = JSON.parse(localStorage.getItem("kulineran_session") || "null");
    const authorName = (session && session.name) ? session.name : "Kamu";
    const authorUsername = (session && session.username) ? session.username : (userRaw || "kamu").replace(/^@/, "");
    const authorEmail = (session && session.email) ? session.email : "";

    const newPost = {
      id: "post-" + Date.now(),
      title,
      desc,
      category,
      user,
      authorName,
      authorUsername,
      authorEmail,
      time: "baru saja",
      ngiler: 0,
      comments: 0,
      icon: CATEGORY_ICON[category] || "🍽️",
      isVideo: pendingMedia ? pendingMedia.type === "video" : false,
      mediaURL: pendingMedia ? pendingMedia.url : null,
      mediaType: pendingMedia ? pendingMedia.type : null,
    };

    const savedPosts = JSON.parse(localStorage.getItem("kulineran_posts") || "[]");
    savedPosts.unshift(newPost);
    localStorage.setItem("kulineran_posts", JSON.stringify(savedPosts));

    posts.unshift(newPost);
    activeFilter = "semua";
    [...filterRow.querySelectorAll(".chip")].forEach((c) => {
      c.classList.toggle("is-active", c.dataset.filter === "semua");
      c.setAttribute("aria-selected", String(c.dataset.filter === "semua"));
    });
    renderFeed();
    bumpTotal();

    // reset form
    uploadForm.reset();
    pendingMedia = null;
    dropzoneEmpty.hidden = false;
    dropzonePreview.hidden = true;
    dropzonePreview.innerHTML = "";

    hideModal(uploadModal);
    showToast("Berhasil diposting! Makananmu udah nangkring di etalase 🎉");

    document.getElementById("feed").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function bumpTotal() {
    updateTotalPosts();
  }

  function updateTotalPosts() {
    totalPostsEl.textContent = posts.length.toLocaleString("id-ID");
  }

  // Update total posts on page load
  updateTotalPosts();

  // ---------- toast ----------
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  // ---------- mobile nav ----------
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---------- init ----------
  renderFeed();
})();