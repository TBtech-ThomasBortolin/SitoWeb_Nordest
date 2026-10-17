# Carrozzeria Nord Est di Greatti Ivan — sito web

Sito one-page statico (Vite + Three.js + GSAP + Lenis) per Azure Static Web Apps.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

## Struttura

- `index.html` — contenuti, SEO, dati strutturati (schema.org AutoBodyShop)
- `src/scene.js` — scena WebGL: goccia di vernice con clearcoat, anelli cromati, laser, particelle
- `src/main.js` — smooth scroll, animazioni allo scroll, selettore vernice, form preventivo
- `src/style.css` — stile (font self-hosted, nessuna richiesta a Google Fonts)
- `public/` — immagini, favicon, `staticwebapp.config.json`, robots, sitemap

## Deploy su Azure Static Web Apps

1. Portale Azure → *Crea risorsa* → **Static Web App** (piano Free).
2. Origine: **GitHub**, repo `SitoWeb_Nordest`, branch `main`.
3. Preset di build: **Custom** — App location `/`, Output location `dist`.
   Azure crea il secret `AZURE_STATIC_WEB_APPS_API_TOKEN` nel repo.
   Se Azure genera un suo workflow, tenere solo uno dei due file in `.github/workflows/`.
4. Dominio: *Domini personalizzati* → aggiungere `www.carrozzerianordest.it`
   (record CNAME presso il registrar del dominio).

I vecchi indirizzi (`servizi.htm`, `contatti.htm`, `dovesiamo.htm`) sono reindirizzati con 301.

## Da completare

- [ ] **Partita IVA** nel footer (`index.html`, cerca `P.IVA [da inserire]`) — obbligatoria per legge.
- [ ] Foto nuove in alta risoluzione (le attuali vengono dal vecchio sito, 300px).
- [ ] Verificare il CAP (33047) e gli orari di apertura, se si vogliono aggiungere.
