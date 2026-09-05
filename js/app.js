const App = {
  modelMap: {},
  modelList: [],
  carousel: { active: false, photos: [], index: 0, slug: "" },
  modelPage: false,

  async init() {
    try {
      document.getElementById("grid").innerHTML = Array(8).fill("").map(() => '<div class="skeleton-card"></div>').join("");
      const [models, photos] = await Promise.all([API.fetchModels(), API.fetchPhotos()]);
      this.modelMap = API.buildModelMap(models, photos);
      this.modelList = Object.values(this.modelMap)
        .filter(m => m.photos.length > 0)
        .sort((a, b) => b.photos.length - a.photos.length);
      this.renderHome();
      this.handleRoute();
      window.addEventListener("popstate", () => this.handleRoute());
    } catch (e) {
      document.getElementById("grid").innerHTML = `<div class="empty">Erro: ${e.message}</div>`;
    }
  },

  handleRoute() {
    const params = new URLSearchParams(location.search);
    const slug = params.get("modelo");
    if (slug && this.modelMap[slug]) {
      this.openModel(slug);
    } else {
      this.closeModel();
    }
  },

  renderHome() {
    document.getElementById("stats").textContent = `${this.modelList.length} modelos · ${this.modelList.reduce((s, m) => s + m.photos.length, 0)} imagens`;
    const grid = document.getElementById("grid");
    grid.innerHTML = this.modelList.map(m => {
      const photos = m.photos.slice(0, 5);
      return `
      <div class="card">
        <div class="card-header">
          <img class="card-avatar" src="${m.avatar || API.getModelAvatar(m.slug)}" 
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 36 36%22><rect fill=%22%23222%22 width=%2236%22 height=%2236%22/><text x=%2250%25%22 y=%2256%25%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2214%22>${(m.name||"?")[0]}</text></svg>'">
          <div class="card-info">
            <div class="card-name">${m.name}</div>
            <div class="card-username">@${m.username || m.slug} · ${m.photos.length} post${m.photos.length!==1?"s":""}</div>
          </div>
          <button class="btn-site" onclick="window.open('https://facility2024.github.io/FastfotosHot/?modelo=${m.slug}','_blank')">Site</button>
          <button class="btn-coconudi" onclick="event.stopPropagation()">COCONUDI</button>
        </div>
        <div class="card-photos">
          ${photos.map((p, i) => {
            const url = p.media?.[0]?.url || API.getMediaUrl(m.slug, p.shortcode);
            return `<div class="card-photo" onclick="App.openCarousel('${m.slug}', ${i})">
              <img src="${url}" loading="lazy" onerror="this.parentElement.style.display='none'">
              ${p.media?.length > 1 ? `<span class="photo-badge">${p.media.length}</span>` : ""}
              ${p.cta_enabled && p.cta_url ? `<a href="${p.cta_url}" target="_blank" rel="noopener" class="photo-cta" onclick="event.stopPropagation()">${p.cta_label || "CTA"}</a>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;
    }).join("");
  },

  openModel(slug) {
    const m = this.modelMap[slug];
    if (!m) return;
    this.modelPage = true;
    history.pushState(null, "", `?modelo=${slug}`);
    document.getElementById("home-page").style.display = "none";
    const modal = document.getElementById("model-modal");
    const avatar = m.avatar || API.getModelAvatar(slug);
    modal.innerHTML = `
      <div class="modal-header">
        <a href="index.html" class="back-link">&larr; Modelos</a>
        <span class="modal-title">${m.name}</span>
        <div style="width:80px"></div>
      </div>
      <div class="modal-body">
        <div class="profile">
          <img class="profile-avatar" src="${avatar}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23222%22 width=%2280%22 height=%2280%22/><text x=%2250%25%22 y=%2256%25%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2228%22>${(m.name||"?")[0]}</text></svg>'">
          <div class="profile-info">
            <h2>${m.name}</h2>
            <div class="profile-username">@${m.username || slug}</div>
            <div class="profile-actions">
              <button class="btn-follow">Seguir</button>
              <button class="btn-message">Mensagem</button>
            </div>
            <div class="profile-stats"><strong>${m.photos.length}</strong> posts</div>
            ${m.bio ? `<div class="profile-bio">${m.bio}</div>` : ""}
          </div>
        </div>
        <div class="profile-grid">
          ${m.photos.map((p, i) => {
            const url = p.media?.[0]?.url || API.getMediaUrl(slug, p.shortcode);
            return `<div class="profile-photo" onclick="App.openCarousel('${slug}', ${i})">
              <img src="${url}" loading="lazy">
              ${p.media?.length > 1 ? `<span class="photo-badge">${p.media.length}</span>` : ""}
              ${p.cta_enabled && p.cta_url ? `<a href="${p.cta_url}" target="_blank" rel="noopener" class="photo-cta" onclick="event.stopPropagation()">${p.cta_label || "CTA"}</a>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;
    modal.classList.add("active");
  },

  closeModel() {
    this.modelPage = false;
    document.getElementById("model-modal").classList.remove("active");
    document.getElementById("home-page").style.display = "";
  },

  openCarousel(slug, index) {
    const m = this.modelMap[slug];
    if (!m) return;
    this.carousel = { active: true, photos: m.photos, index, slug };
    this.renderCarousel();
    document.getElementById("carousel").classList.add("active");
  },

  closeCarousel() {
    this.carousel.active = false;
    document.getElementById("carousel").classList.remove("active");
  },

  renderCarousel() {
    const { photos, index, slug } = this.carousel;
    const p = photos[index];
    const url = p.media?.[0]?.url || API.getMediaUrl(slug, p.shortcode);
    const content = document.getElementById("carousel-content");
    const info = document.getElementById("carousel-info");

    if (p.media?.length > 1) {
      content.innerHTML = `<div class="carousel-multi">${p.media.map(item =>
        `<img src="${item.url}" loading="lazy">`
      ).join("")}</div>`;
    } else {
      content.innerHTML = `<img src="${url}">`;
    }

    const m = this.modelMap[slug];
    info.innerHTML = `
      <div class="carousel-model">
        <img src="${m?.avatar || API.getModelAvatar(slug)}" onerror="this.style.display='none'">
        <span>${m?.name || slug}</span>
      </div>
      ${p.cta_enabled && p.cta_url ? `<a href="${p.cta_url}" target="_blank" rel="noopener" class="carousel-cta">${p.cta_label || "Ver mais"}</a>` : ""}
      <div class="carousel-counter">${index + 1} / ${photos.length}</div>`;

    document.getElementById("carousel-prev").style.display = index > 0 ? "" : "none";
    document.getElementById("carousel-next").style.display = index < photos.length - 1 ? "" : "none";
  },

  carouselPrev() { if (this.carousel.index > 0) { this.carousel.index--; this.renderCarousel(); } },
  carouselNext() { if (this.carousel.index < this.carousel.photos.length - 1) { this.carousel.index++; this.renderCarousel(); } },
};

document.addEventListener("DOMContentLoaded", () => App.init());
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { App.closeCarousel(); App.closeModel(); }
  if (App.carousel.active) {
    if (e.key === "ArrowLeft") App.carouselPrev();
    if (e.key === "ArrowRight") App.carouselNext();
  }
});
