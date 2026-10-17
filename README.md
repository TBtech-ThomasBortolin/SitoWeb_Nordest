# Carrozzeria Nord Est di Greatti Ivan — sito web

Sito one-page statico (Vite + Three.js + GSAP + Lenis), ospitato su **Netsons** (hosting Apache/cPanel).

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

## Struttura

- `index.html` — contenuti, SEO, dati strutturati (schema.org AutoBodyShop)
- `src/scene.js` — scena WebGL: SUV in stile Stelvio modellato a codice, pedana girevole, laser, particelle
- `src/main.js` — smooth scroll, animazioni allo scroll, selettore vernice, form preventivo
- `src/style.css` — stile (font self-hosted, nessuna richiesta a Google Fonts)
- `public/` — immagini, favicon, `.htaccess` (Apache), robots, sitemap

## Pubblicazione su Netsons

### Prima volta (manuale, da cPanel)

1. `npm run build` (oppure usare lo zip già pronto in `release/`).
2. cPanel → **Gestione file** → `public_html/`.
   **Fare prima un backup del vecchio sito** (selezionare tutto → *Comprimi*, poi scaricare lo zip).
3. Cancellare i vecchi file, caricare `sito-carrozzeria-nordest-netsons.zip` ed *Estrarre* in `public_html/`.
   Attivare "Mostra file nascosti" per verificare che ci sia `.htaccess`.
4. cPanel → **SSL/TLS Status** (AutoSSL / Let's Encrypt): attivare il certificato per
   `carrozzerianordest.it` e `www.carrozzerianordest.it`. Il `.htaccess` forza HTTPS e il `www`.

### Aggiornamenti automatici (GitHub Actions → FTP)

Il workflow `.github/workflows/deploy-netsons.yml` compila e carica `dist/` a ogni push su `main`.
Resta disattivato finché non si impostano, in GitHub → *Settings → Secrets and variables → Actions*:

| Tipo | Nome | Valore |
|------|------|--------|
| Variable | `NETSONS_FTP_SERVER` | host FTP indicato da Netsons (es. `ftp.carrozzerianordest.it`) |
| Variable | `NETSONS_FTP_USERNAME` | utente FTP (meglio un account FTP dedicato da cPanel → *Account FTP*) |
| Variable | `NETSONS_FTP_DIR` | facoltativa, default `public_html/` (usare `/` se l'account FTP punta già lì) |
| Secret | `NETSONS_FTP_PASSWORD` | password dell'account FTP |

I vecchi indirizzi (`servizi.htm`, `contatti.htm`, `dovesiamo.htm`) sono reindirizzati con 301 dal `.htaccess`.

## Da completare

- [ ] Foto nuove in alta risoluzione (le attuali vengono dal vecchio sito, 300px).
- [ ] Verificare il CAP (33047) e gli orari di apertura, se si vogliono aggiungere.
