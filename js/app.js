const App = {
  currentPage: "feed",
  models: [],
  feedData: [],
  filteredModels: [],
  currentModelFilter: null,
  pagination: { page: 1, perPage: 20 },
  lightbox: { active: false, items: [], index: 0 },
  feedView: { active: false, items: [], index: 0 },
  modelModal: { active: false, model: null },

  async init() {
    this.bindEvents();
    await this.loadData();
  },

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeLightbox();
        this.closeFeedView();
        this.closeModelModal();
      }
      if (this.lightbox.active) {
        if (e.key === "ArrowLeft") this.lightboxPrev();
        if (e.key === "ArrowRight") this.lightboxNext();
      }
    });
  },

  async loadData() {
    try {
      this.showLoading();
      const [models, videos] = await Promise.all([
        API.fetchModels(),
        API.fetchFeedVideos(),
      ]);
      this.models = models;
      this.feedData = videos;
      this.buildModelMap();
      this.render();
    } catch (err) {
      this.showToast("Erro ao carregar dados: " + err.message, "error");
    }
  },

  buildModelMap() {
    this.modelMap = {};
    for (const v of this.feedData) {
      if (!this.modelMap[v.model_slug]) {
        this.modelMap[v.model_slug] = {
          slug: v.model_slug,
          name: v.model_name,
          posts: [],
          videoCount: 0,
          imageCount: 0,
        };
      }
      this.modelMap[v.model_slug].posts.push(v);
      if (v.post_type === "video") this.modelMap[v.model_slug].videoCount++;
      else this.modelMap[v.model_slug].imageCount++;
    }
    for (const m of this.models) {
      if (!this.modelMap[m.username]) {
        const slug = m.slug || m.username;
        this.modelMap[slug] = {
          slug,
          name: m.full_name || m.username,
          username: m.username,
          bio: m.bio,
          avatar: m.profile_pic_url,
          posts: [],
          videoCount: 0,
          imageCount: 0,
        };
      } else {
        const entry = this.modelMap[m.slug || m.username];
        entry.username = m.username;
        entry.bio = m.bio;
        entry.avatar = m.profile_pic_url;
      }
    }
    this.filteredModels = Object.values(this.modelMap);
  },

  render() {
    this.updateStats();
    this.renderFeedPage();
  },

  updateStats() {
    const totalModels = this.filteredModels.length;
    const totalPosts = this.feedData.length;
    const el = document.getElementById("stats");
    if (el) el.innerHTML = `${totalModels} modelos &middot; ${totalPosts} posts`;
  },

  renderFeedPage() {
    const grid = document.getElementById("models-grid");
    if (!grid) return;

    const start = (this.pagination.page - 1) * this.pagination.perPage;
    const pageModels = this.filteredModels.slice(start, start + this.pagination.perPage);

    if (pageModels.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-secondary)">Nenhum modelo encontrado</div>`;
      return;
    }

    grid.innerHTML = pageModels
      .map(
        (m) => `
      <div class="model-card" onclick="App.openModelModal('${m.slug}')">
        <div class="model-card-header">
          <div class="model-card-info">
            <img class="model-avatar" src="${m.avatar || API.getModelAvatar(m.slug)}" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23333%22 width=%2240%22 height=%2240%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2216%22>${(m.name || m.slug)[0]}</text></svg>'" alt="">
            <div>
              <div class="model-name">${m.name || m.slug}</div>
              <div class="model-username">@${m.username || m.slug}</div>
            </div>
          </div>
          <div class="model-card-actions">
            ${m.videoCount > 0 ? `<span class="badge badge-green"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>${m.videoCount}</span>` : ""}
            ${m.imageCount > 0 ? `<span class="badge badge-blue"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>${m.imageCount}</span>` : ""}
          </div>
        </div>
        <div class="media-grid">
          ${m.posts
            .slice(0, 6)
            .map((p, i) => {
              const mediaUrl = p.media?.[0]?.url || p.cdn_url || API.getPosterUrl(m.slug, p.shortcode);
              const isVideo = p.post_type === "video" || p.media?.[0]?.type === "video";
              const poster = p.poster_url || API.getPosterUrl(m.slug, p.shortcode);
              return `
              <div class="media-item" onclick="event.stopPropagation(); App.openFeedView('${m.slug}', ${i})">
                ${isVideo ? `<video src="${mediaUrl}" muted preload="metadata" poster="${poster}"></video>` : `<img src="${mediaUrl}" loading="lazy" onerror="this.parentElement.style.display='none'">`}
                ${p.media?.length > 1 ? `<div class="media-badge">${p.media.length}</div>` : ""}
                <div class="media-overlay">
                  ${isVideo ? `<span class="media-stat"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>` : `<span class="media-stat"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/></svg></span>`}
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </div>`
      )
      .join("");

    this.renderPagination();
  },

  renderPagination() {
    const el = document.getElementById("pagination");
    if (!el) return;
    const total = Math.ceil(this.filteredModels.length / this.pagination.perPage);
    if (total <= 1) {
      el.innerHTML = "";
      return;
    }

    let html = `<button onclick="App.goPage(${this.pagination.page - 1})" ${this.pagination.page === 1 ? "disabled" : ""}>&larr; Anterior</button>`;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - this.pagination.page) <= 2) {
        html += `<button onclick="App.goPage(${i})" class="${i === this.pagination.page ? "active" : ""}">${i}</button>`;
      } else if (Math.abs(i - this.pagination.page) === 3) {
        html += `<button disabled>...</button>`;
      }
    }
    html += `<button onclick="App.goPage(${this.pagination.page + 1})" ${this.pagination.page === total ? "disabled" : ""}>Proxima &rarr;</button>`;
    el.innerHTML = html;
  },

  goPage(page) {
    const total = Math.ceil(this.filteredModels.length / this.pagination.perPage);
    if (page < 1 || page > total) return;
    this.pagination.page = page;
    this.renderFeedPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  filterByModel(slug) {
    this.currentModelFilter = slug;
    this.pagination.page = 1;
    if (slug) {
      const m = this.modelMap[slug];
      this.filteredModels = m ? [m] : [];
    } else {
      this.filteredModels = Object.values(this.modelMap);
    }
    this.render();
  },

  openModelModal(slug) {
    const m = this.modelMap[slug];
    if (!m) return;
    this.modelModal = { active: true, model: m };
    const modal = document.getElementById("model-modal");
    if (!modal) return;

    const avatar = m.avatar || API.getModelAvatar(m.slug);
    const videoPosts = m.posts.filter((p) => p.post_type === "video");
    const imagePosts = m.posts.filter((p) => p.post_type !== "video");

    modal.innerHTML = `
      <div class="model-modal-header">
        <button onclick="App.closeModelModal()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer">&larr;</button>
        <span style="font-weight:600">${m.name || m.slug}</span>
        <button onclick="App.openFeedView('${m.slug}', 0)" class="btn btn-sm btn-gradient">Ver Feed</button>
      </div>
      <div class="model-profile">
        <img class="model-profile-avatar" src="${avatar}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23333%22 width=%2280%22 height=%2280%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2228%22>${(m.name || m.slug)[0]}</text></svg>'" alt="">
        <div class="model-profile-info">
          <h2>${m.name || m.slug}</h2>
          <div class="username">@${m.username || m.slug}</div>
          ${m.bio ? `<div class="bio">${m.bio}</div>` : ""}
          <div class="stats">
            <span><strong>${m.posts.length}</strong> posts</span>
            <span><strong>${m.videoCount}</strong> videos</span>
            <span><strong>${m.imageCount}</strong> imagens</span>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="media-grid" style="max-width:935px;margin:0 auto">
          ${m.posts
            .map((p, i) => {
              const mediaUrl = p.media?.[0]?.url || p.cdn_url || API.getPosterUrl(m.slug, p.shortcode);
              const isVideo = p.post_type === "video" || p.media?.[0]?.type === "video";
              const poster = p.poster_url || API.getPosterUrl(m.slug, p.shortcode);
              return `
              <div class="media-item" onclick="App.openFeedView('${m.slug}', ${i})">
                ${isVideo ? `<video src="${mediaUrl}" muted preload="metadata" poster="${poster}"></video>` : `<img src="${mediaUrl}" loading="lazy">`}
                ${p.media?.length > 1 ? `<div class="media-badge">${p.media.length}</div>` : ""}
                <div class="media-overlay">
                  ${isVideo ? `<span class="media-stat"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>` : `<span class="media-stat"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/></svg></span>`}
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </div>`;
    modal.classList.add("active");
  },

  closeModelModal() {
    this.modelModal.active = false;
    const modal = document.getElementById("model-modal");
    if (modal) modal.classList.remove("active");
  },

  openFeedView(slug, startIndex = 0) {
    const m = this.modelMap[slug];
    if (!m) return;
    this.feedView = { active: true, items: m.posts, index: startIndex, slug };
    const view = document.getElementById("feed-view");
    if (!view) return;

    const p = m.posts[startIndex];
    const mediaUrl = p.media?.[0]?.url || p.cdn_url;
    const isVideo = p.post_type === "video" || p.media?.[0]?.type === "video";
    const poster = p.poster_url || API.getPosterUrl(slug, p.shortcode);
    const avatar = m.avatar || API.getModelAvatar(slug);

    view.innerHTML = `
      <button class="feed-close" onclick="App.closeFeedView()">&times;</button>
      <button class="feed-mute" onclick="App.toggleMute()">&#128263;</button>
      <div class="feed-container" id="feed-container">
        ${m.posts
          .map((post, i) => {
            const url = post.media?.[0]?.url || post.cdn_url;
            const vid = post.post_type === "video" || post.media?.[0]?.type === "video";
            const img = post.poster_url || API.getModelAvatar(slug);
            return `
          <div class="feed-item" data-index="${i}">
            ${vid ? `<video src="${url}" poster="${img}" loop playsinline preload="metadata" ${i === startIndex ? "autoplay" : ""}></video>` : `<img src="${url}" loading="lazy">`}
            <div class="feed-sidebar">
              <div class="model-info">
                <img src="${avatar}" onerror="this.style.display='none'" alt="">
                <span>${m.name || m.slug}</span>
              </div>
            </div>
          </div>`;
          })
          .join("")}
      </div>`;
    view.classList.add("active");

    setTimeout(() => this.setupFeedObserver(), 100);
  },

  setupFeedObserver() {
    const container = document.getElementById("feed-container");
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target.querySelector("video");
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll(".feed-item").forEach((item) => observer.observe(item));
  },

  toggleMute() {
    const container = document.getElementById("feed-container");
    if (!container) return;
    const videos = container.querySelectorAll("video");
    const anyPlaying = [...videos].some((v) => !v.muted);
    videos.forEach((v) => (v.muted = anyPlaying));
  },

  closeFeedView() {
    this.feedView.active = false;
    const view = document.getElementById("feed-view");
    if (view) {
      view.querySelectorAll("video").forEach((v) => v.pause());
      view.classList.remove("active");
    }
  },

  openLightbox(items, index) {
    this.lightbox = { active: true, items, index };
    this.renderLightbox();
    document.getElementById("lightbox").classList.add("active");
  },

  closeLightbox() {
    this.lightbox.active = false;
    document.getElementById("lightbox").classList.remove("active");
  },

  renderLightbox() {
    const { items, index } = this.lightbox;
    const item = items[index];
    const content = document.getElementById("lightbox-content");
    const info = document.getElementById("lightbox-info");

    if (item.media?.[0]?.type === "video" || item.post_type === "video") {
      content.innerHTML = `<video src="${item.media?.[0]?.url || item.cdn_url}" controls autoplay style="max-width:100%;max-height:85vh;border-radius:4px"></video>`;
    } else {
      content.innerHTML = `<img src="${item.media?.[0]?.url || item.cdn_url}" style="max-width:100%;max-height:85vh;border-radius:4px">`;
    }

    info.innerHTML = `
      <div class="model-name">${item.model_name}</div>
      <div class="post-date">${new Date(item.added_at).toLocaleDateString("pt-BR")}</div>`;

    document.getElementById("lightbox-prev").style.display = index > 0 ? "block" : "none";
    document.getElementById("lightbox-next").style.display = index < items.length - 1 ? "block" : "none";
  },

  lightboxPrev() {
    if (this.lightbox.index > 0) {
      this.lightbox.index--;
      this.renderLightbox();
    }
  },

  lightboxNext() {
    if (this.lightbox.index < this.lightbox.items.length - 1) {
      this.lightbox.index++;
      this.renderLightbox();
    }
  },

  showLoading() {
    const grid = document.getElementById("models-grid");
    if (grid) {
      grid.innerHTML = Array(6)
        .fill("")
        .map(() => '<div class="skeleton skeleton-card"></div>')
        .join("");
    }
  },

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 3000);
  },

  handleExtract() {
    const textarea = document.getElementById("link-input");
    if (!textarea) return;
    const links = textarea.value.trim().split("\n").filter(Boolean);
    if (links.length === 0) {
      this.showToast("Cole pelo menos um link do Instagram", "error");
      return;
    }
    this.showToast(`${links.length} link(s) enviado(s) para processamento`);
    textarea.value = "";
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
