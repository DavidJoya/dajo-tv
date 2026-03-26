// src/index.js
const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const manifest = require("./manifest");
const { getCatalog, getMeta, getStream } = require("./scrapers/tvScraper");

const PORT = process.env.PORT || 7000;

const builder = new addonBuilder(manifest);

// ─── CATALOG ──────────────────────────────────────────────────
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const { genre, search } = extra || {};
  console.log(`[catalog] id=${id} genre=${genre || "-"} search=${search || "-"}`);

  try {
    const metas = await getCatalog(id, genre, search);
    return { metas };
  } catch (err) {
    console.error("[catalog] Error:", err.message);
    return { metas: [] };
  }
});

// ─── META ─────────────────────────────────────────────────────
builder.defineMetaHandler(async ({ type, id }) => {
  console.log(`[meta] id=${id}`);
  try {
    const meta = await getMeta(id);
    return { meta };
  } catch (err) {
    console.error("[meta] Error:", err.message);
    return { meta: null };
  }
});

// ─── STREAM ───────────────────────────────────────────────────
builder.defineStreamHandler(async ({ type, id }) => {
  console.log(`[stream] id=${id}`);
  try {
    const streams = await getStream(id);
    return { streams };
  } catch (err) {
    console.error("[stream] Error:", err.message);
    return { streams: [] };
  }
});

// ─── ARRANCAR ─────────────────────────────────────────────────
serveHTTP(builder.getInterface(), { port: PORT });

console.log(`
 ██████╗  █████╗      ██╗ ██████╗     ████████╗██╗   ██╗
 ██╔══██╗██╔══██╗     ██║██╔═══██╗    ╚══██╔══╝██║   ██║
 ██║  ██║███████║     ██║██║   ██║       ██║   ██║   ██║
 ██║  ██║██╔══██║██   ██║██║   ██║       ██║   ╚██╗ ██╔╝
 ██████╔╝██║  ██║╚█████╔╝╚██████╔╝       ██║    ╚████╔╝
 ╚═════╝ ╚═╝  ╚═╝ ╚════╝  ╚═════╝        ╚═╝     ╚═══╝

 🟢 Addon activo en puerto ${PORT}

 Instalar en Stremio:
 → stremio://localhost:${PORT}/manifest.json

 O desde la app:
 → http://localhost:${PORT}/manifest.json
`);
