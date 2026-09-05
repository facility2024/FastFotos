const API = {
  async fetchModels() {
    const res = await fetch(
      `${CONFIG.supabase.url}/rest/v1/models?select=*&order=username.asc`,
      { headers: { apikey: CONFIG.supabase.anonKey, Authorization: `Bearer ${CONFIG.supabase.anonKey}` } }
    );
    if (!res.ok) throw new Error("Erro ao buscar modelos");
    return res.json();
  },

  async fetchPhotos(modelSlug = null, limit = 500, offset = 0) {
    let url = `${CONFIG.supabase.url}/rest/v1/feed_videos?select=*&post_type=in.(image,carousel)&order=added_at.desc&limit=${limit}&offset=${offset}`;
    if (modelSlug) url += `&model_slug=eq.${modelSlug}`;
    const res = await fetch(url, {
      headers: { apikey: CONFIG.supabase.anonKey, Authorization: `Bearer ${CONFIG.supabase.anonKey}` },
    });
    if (!res.ok) throw new Error("Erro ao buscar fotos");
    return res.json();
  },

  getModelAvatar(slug) {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/profile.jpg`;
  },

  getMediaUrl(slug, shortcode, filename) {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/images/${filename || shortcode + ".jpg"}`;
  },

  getPosterUrl(slug, shortcode) {
    return `${CONFIG.bunny.pullZoneHost}/modelos-oficiais-coconudi/${slug}/posters/${shortcode}.jpg`;
  },

  buildModelMap(models, photos) {
    const map = {};
    for (const p of photos) {
      if (!map[p.model_slug]) {
        map[p.model_slug] = { slug: p.model_slug, name: p.model_name, photos: [] };
      }
      map[p.model_slug].photos.push(p);
    }
    for (const m of models) {
      const slug = m.slug || m.username;
      if (!map[slug]) {
        map[slug] = { slug, name: m.full_name || m.username, photos: [], bio: m.bio, avatar: m.profile_pic_url };
      } else {
        map[slug].username = m.username;
        map[slug].bio = m.bio;
        map[slug].avatar = m.profile_pic_url;
      }
    }
    return map;
  },
};
