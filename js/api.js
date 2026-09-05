const API = {
  async fetchModels() {
    const res = await fetch(
      `${CONFIG.supabase.url}/rest/v1/models?select=*&order=username.asc`,
      {
        headers: {
          apikey: CONFIG.supabase.anonKey,
          Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
        },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar modelos");
    return res.json();
  },

  async fetchFeedVideos(modelSlug = null, limit = 100, offset = 0) {
    let url = `${CONFIG.supabase.url}/rest/v1/feed_videos?select=*&order=added_at.desc&limit=${limit}&offset=${offset}`;
    if (modelSlug) url += `&model_slug=eq.${modelSlug}`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabase.anonKey,
        Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao buscar videos");
    return res.json();
  },

  async fetchFeedImages(modelSlug = null, limit = 200, offset = 0) {
    let url = `${CONFIG.supabase.url}/rest/v1/feed_videos?select=*&post_type=eq.image&order=added_at.desc&limit=${limit}&offset=${offset}`;
    if (modelSlug) url += `&model_slug=eq.${modelSlug}`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabase.anonKey,
        Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao buscar imagens");
    return res.json();
  },

  async fetchCarousels(modelSlug = null, limit = 200, offset = 0) {
    let url = `${CONFIG.supabase.url}/rest/v1/feed_videos?select=*&post_type=eq.carousel&order=added_at.desc&limit=${limit}&offset=${offset}`;
    if (modelSlug) url += `&model_slug=eq.${modelSlug}`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabase.anonKey,
        Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao buscar carrosseis");
    return res.json();
  },

  getModelAvatar(slug) {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/profile.jpg`;
  },

  getMediaUrl(slug, shortcode, type = "videos", ext = "mp4") {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/${type}/${shortcode}.${ext}`;
  },

  getPosterUrl(slug, shortcode) {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/posters/${shortcode}.jpg`;
  },
};
