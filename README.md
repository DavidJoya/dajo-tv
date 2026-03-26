# 📺 Dajo TV — Addon para Stremio

Canales de televisión gratuitos para México y Latinoamérica en Stremio.

## 🚀 Instalación

### Requisitos
- [Node.js](https://nodejs.org) v16 o superior
- [Stremio](https://www.stremio.com/downloads) instalado

### Pasos

```bash
# 1. Entrar a la carpeta
cd dajo-tv

# 2. Instalar dependencias
npm install

# 3. Iniciar el addon
npm start
```

### Instalar en Stremio

Una vez corriendo, abre Stremio y ve a:

**Addons → Instalar desde URL** y pega:
```
http://localhost:7000/manifest.json
```

O abre esta URL en tu navegador:
```
stremio://localhost:7000/manifest.json
```

---

## 📡 Catálogos incluidos

| Catálogo | Contenido |
|---|---|
| 🇲🇽 México | Canales mexicanos gratuitos |
| 🌎 Latinoamérica | AR, CO, CL, PE, VE, EC, BO, PY, UY, GT, CR |
| 📡 Todos | México + LATAM combinados |

Los canales se actualizan automáticamente desde [iptv-org/iptv](https://github.com/iptv-org/iptv).

---

## ⚙️ Configuración

### Cambiar puerto
```bash
PORT=8080 npm start
```

### Modo desarrollo (auto-reload)
```bash
npm run dev
```

---

## 🌐 Deploy (acceso desde internet)

Para usar el addon desde fuera de tu red local:

### Railway (gratis)
1. Sube el proyecto a GitHub
2. Ve a [railway.app](https://railway.app)
3. Conecta tu repo y despliega
4. Usa la URL pública como dirección del addon

### Render (gratis)
1. Ve a [render.com](https://render.com)
2. Nuevo Web Service → conecta tu repo
3. Build command: `npm install`
4. Start command: `npm start`

---

## 📦 Fuentes de canales

- **México**: `https://iptv-org.github.io/iptv/countries/mx.m3u`
- **LATAM**: listas por país de `iptv-org/iptv`

Todos los canales son de transmisión pública y gratuita.
