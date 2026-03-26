// src/scrapers/tvScraper.js
// Descarga y parsea listas M3U públicas de iptv-org

const axios = require("axios");
const NodeCache = require("node-cache");

// Cache de 4 horas — las listas no cambian tan seguido
const cache = new NodeCache({ stdTTL: 14400 });

// ─── FUENTES M3U PÚBLICAS ─────────────────────────────────────
const SOURCES = {
  mx: "https://iptv-org.github.io/iptv/countries/mx.m3u",
  deportes: "https://iptv-org.github.io/iptv/categories/sports.m3u",
  latam: [
    "https://iptv-org.github.io/iptv/countries/ar.m3u", // Argentina
    "https://iptv-org.github.io/iptv/countries/co.m3u", // Colombia
    "https://iptv-org.github.io/iptv/countries/cl.m3u", // Chile
    "https://iptv-org.github.io/iptv/countries/pe.m3u", // Perú
    "https://iptv-org.github.io/iptv/countries/ve.m3u", // Venezuela
    "https://iptv-org.github.io/iptv/countries/ec.m3u", // Ecuador
    "https://iptv-org.github.io/iptv/countries/bo.m3u", // Bolivia
    "https://iptv-org.github.io/iptv/countries/py.m3u", // Paraguay
    "https://iptv-org.github.io/iptv/countries/uy.m3u", // Uruguay
    "https://iptv-org.github.io/iptv/countries/gt.m3u", // Guatemala
    "https://iptv-org.github.io/iptv/countries/cr.m3u", // Costa Rica
  ],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; DajoTV/1.0)",
};

// ─── PARSER M3U ───────────────────────────────────────────────
function parseM3U(text, countryCode = "") {
  const lines = text.split("\n");
  const channels = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      current = {};
      // Nombre del canal (después de la última coma)
      current.name = line.split(",").slice(1).join(",").trim();
      // Logo
      current.logo = (line.match(/tvg-logo="([^"]*)"/) || [])[1] || "";
      // Grupo/categoría
      current.group = (line.match(/group-title="([^"]*)"/) || [])[1] || "General";
      // ID del canal
      current.tvgId = (line.match(/tvg-id="([^"]*)"/) || [])[1] || "";
      // País
      current.country = countryCode || (line.match(/tvg-country="([^"]*)"/) || [])[1] || "";

    } else if ((line.startsWith("http") || line.startsWith("rtmp")) && current.name) {
      // Generar ID único y seguro
      const safeId = Buffer.from(current.name + line.slice(-20))
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 30);

      channels.push({
        id: `dajotv:${safeId}`,
        type: "tv",
        name: current.name,
        poster: current.logo || null,
        genres: [normalizeGenre(current.group)],
        country: current.country,
        streamUrl: line,
      });
      current = {};
    }
  }

  return channels;
}

// ─── NORMALIZAR GÉNEROS ───────────────────────────────────────
function normalizeGenre(group) {
  const g = group.toLowerCase();
  if (g.includes("news") || g.includes("notic")) return "Noticias";
  if (g.includes("sport") || g.includes("deport") || g.includes("futbol") || g.includes("fútbol")) return "Deportes";
  if (g.includes("entertain") || g.includes("entreten") || g.includes("variet")) return "Entretenimiento";
  if (g.includes("kids") || g.includes("infant") || g.includes("niños") || g.includes("cartoon")) return "Infantil";
  if (g.includes("music") || g.includes("música")) return "Música";
  if (g.includes("movie") || g.includes("pelícu") || g.includes("cine")) return "Cine";
  if (g.includes("doc")) return "Documentales";
  if (g.includes("religi") || g.includes("cathol") || g.includes("cristian")) return "Religión";
  if (g.includes("cook") || g.includes("cocina") || g.includes("food")) return "Cocina";
  if (g.includes("travel") || g.includes("viaje")) return "Viajes";
  return group || "General";
}

// ─── FETCH CON RETRY ──────────────────────────────────────────
async function fetchM3U(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      return res.data;
    } catch (err) {
      if (i === retries) {
        console.warn(`[DajoTV] No se pudo cargar: ${url} — ${err.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ─── CARGAR CANALES ───────────────────────────────────────────
async function loadChannels(catalogId) {
  const cacheKey = `channels:${catalogId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  console.log(`[DajoTV] Cargando canales para: ${catalogId}`);
  let channels = [];

  if (catalogId === "dajotv-deportes") {
    const text = await fetchM3U(SOURCES.deportes);
    if (text) channels.push(...parseM3U(text, ""));
  }

  if (catalogId === "dajotv-mx" || catalogId === "dajotv-all") {
    const text = await fetchM3U(SOURCES.mx);
    if (text) channels.push(...parseM3U(text, "MX"));
  }

  if (catalogId === "dajotv-latam" || catalogId === "dajotv-all") {
    // Cargar países LATAM en paralelo
    const results = await Promise.allSettled(
      SOURCES.latam.map(url => fetchM3U(url))
    );
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const countryCode = SOURCES.latam[i].match(/countries\/([a-z]+)\.m3u/)?.[1]?.toUpperCase() || "";
        channels.push(...parseM3U(r.value, countryCode));
      }
    });
  }

  // Eliminar duplicados por nombre+stream
  const seen = new Set();
  channels = channels.filter(ch => {
    const key = ch.name + ch.streamUrl;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[DajoTV] ${channels.length} canales cargados para ${catalogId}`);
  cache.set(cacheKey, channels);
  return channels;
}

// ─── API PÚBLICA ──────────────────────────────────────────────
async function getCatalog(catalogId, genre, search) {
  const all = await loadChannels(catalogId);

  let filtered = all;
  if (genre && genre !== "Todos") {
    filtered = filtered.filter(c => c.genres.includes(genre));
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
  }

  return filtered.map(({ id, type, name, poster, genres }) => ({
    id, type, name,
    poster: poster || `https://placehold.co/300x200/1a1a2e/00d4ff?text=${encodeURIComponent(name.slice(0, 12))}`,
    genres,
  }));
}

async function getMeta(id) {
  // Buscar en todos los catálogos
  for (const catalogId of ["dajotv-mx", "dajotv-deportes", "dajotv-latam"]) {
    const all = await loadChannels(catalogId);
    const ch = all.find(c => c.id === id);
    if (ch) {
      return {
        id: ch.id,
        type: "tv",
        name: ch.name,
        poster: ch.poster || `https://placehold.co/300x200/1a1a2e/00d4ff?text=${encodeURIComponent(ch.name.slice(0, 12))}`,
        background: `https://placehold.co/1280x720/0d0d1a/00d4ff?text=${encodeURIComponent(ch.name)}`,
        genres: ch.genres,
        description: `Canal en vivo — ${ch.genres.join(", ")} · ${ch.country}`,
      };
    }
  }
  return null;
}

async function getStream(id) {
  for (const catalogId of ["dajotv-mx", "dajotv-deportes", "dajotv-latam"]) {
    const all = await loadChannels(catalogId);
    const ch = all.find(c => c.id === id);
    if (ch && ch.streamUrl) {
      return [{
        title: `📺 ${ch.name}`,
        url: ch.streamUrl,
        behaviorHints: { notWebReady: false },
      }];
    }
  }
  return [];
}

module.exports = { getCatalog, getMeta, getStream };
