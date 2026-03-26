// src/manifest.js
module.exports = {
  id: "tv.dajo.addon",
  version: "1.0.0",
  name: "Dajo TV",
  description: "Canales de televisión gratuitos — México y Latinoamérica",
  logo: "https://i.imgur.com/placeholder.png",
  background: "https://i.imgur.com/placeholder-bg.png",

  types: ["tv"],

  catalogs: [
    {
      type: "tv",
      id: "dajotv-mx",
      name: "🇲🇽 México",
      extra: [
        { name: "search", isRequired: false },
        { name: "genre", isRequired: false },
      ],
    },
    {
      type: "tv",
      id: "dajotv-latam",
      name: "🌎 Latinoamérica",
      extra: [
        { name: "search", isRequired: false },
        { name: "genre", isRequired: false },
      ],
    },
    {
      type: "tv",
      id: "dajotv-all",
      name: "📡 Todos los canales",
      extra: [
        { name: "search", isRequired: false },
        { name: "genre", isRequired: false },
      ],
    },
  ],

  resources: ["catalog", "meta", "stream"],
  idPrefixes: ["dajotv:"],

  behaviorHints: {
    adult: false,
    p2p: false,
  },
};
