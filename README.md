# Fastener Tracker

A fully static web app for managing hardware fasteners, organising them into physical storage boxes, and printing precise 50×15mm PDF label tags.

**No server. No database setup. No installation required.**

Data is stored in your browser's `localStorage`. PDFs are generated entirely in-browser with jsPDF.

## Live URL

Once GitHub Pages is enabled:
```
https://rhzuccarelli.github.io/Fasteners_Tags/
```

## Enable GitHub Pages (one-time setup)

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the workflow auto-builds and deploys

## Run locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Features

- **Standards Library** — DIN 912, DIN 7991, ISO 7046, DIN 7051, DIN 7997, ISO 4035, DIN 6796 pre-seeded. Upload PNG/JPG drawings per standard (stored locally).
- **Fastener Library** — CRUD with metric/standard/tool filter. Out-of-stock warnings.
- **Box Organiser** — Small (270×110mm) / Large (360×150mm) boxes, 1–4 slot divisions, SVG slot visualiser, click-to-assign fasteners, Suggest Grouping heuristic.
- **Print Tags** — 50×15mm tags (single fastener or box label) exported as A4 PDF, 3-up grid layout, generated in-browser.

## Data storage

All data lives in `localStorage` under keys `ft_standards`, `ft_fasteners`, `ft_boxes`. To back up or transfer data, open browser DevTools → Application → Local Storage and export the values.
