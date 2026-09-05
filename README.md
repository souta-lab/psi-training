# PSI Training

Cognitive training app for **PSI (Processing Speed Index)** — inspired by WAIS-style subtests.

Two game modes: **Symbol-Match** and **Coding**, with PSI scoring, stats, and charts.

## Modes

| Mode | Description |
|------|-------------|
| **Symbol-Match** | Match symbols under time pressure |
| **Coding** | Symbol-digit coding task |

- Time limits: 30s / 60s / 120s / endless
- PSI score calculated from rate, accuracy, and elapsed time (40–160)
- Stats & history with Recharts

## Stack

- React 19 + Vite + TypeScript
- motion, Recharts, lucide-react
- Capacitor (mobile build)

## Getting Started

```bash
npm install
npm run dev      # Vite dev server on :3000
npm run build    # production build
```

No API key required — fully local.

## Screenshots

_Coming soon — PRs with game screenshots/GIFs welcome._

## PWA

Installable: `public/manifest.json` + `public/sw.js` provide basic offline support (app shell cached on install). Icons are local (`public/icon-192.png`, `public/icon-512.png`).

## Android (Capacitor)

```bash
npm run build
npx cap add android   # first time only
npx cap sync android
```

App ID: `com.psitraining.app`. CI builds the APK on pushes to `master` (`.github/workflows/build-apk.yml`).

## License

MIT

## Demo

https://souta-lab.github.io/psi-training/
