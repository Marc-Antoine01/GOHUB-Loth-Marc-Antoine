# Assets: La recherche au CHUV

Captured on 2026-10-04 from https://www.chuv.ch/fr/recherche-et-innovation/la-recherche-au-chuv
with `node films/chuv-research/capture.mjs` (Playwright). Element boxes and action targets are in `capture.json`.

## Brand

| What | Value | Source |
|---|---|---|
| Logo | `brand/logo.svg` (CHUV, 98×50 vector) | header `img.navbar-brand-logo-normal` |
| Partner logos | `brand/new-logo-unil.svg`, `brand/new-logo-unil-white.svg`, `brand/logo-vaud.svg` | hero, footer |
| Display face | **Sharp Grotesk** 400 (`fonts/Medium20.woff2`) | h1 52px, h2 38px |
| UI face | **Atlas Grotesk** 400 / 700 (`fonts/AtlasGrotesk-*.woff2`) | body 18px, nav 16px |
| Petrol blue (hero, buttons) | `#004664` rgb(0, 70, 100) | header and hero background |
| Cyan accent (active nav, hover) | `#62E8FF` rgb(98, 232, 255) | "Recherche et innovation" pill, burger, hover bar |
| Light cyan band | `#B8F0F9` rgb(184, 240, 249) | key figures section, trials page header |
| Text | `#212121` | headings and body text |
| Grey surface | `#F3F3F3` | support section |
| Lilac tags | `#C996F1` | "Cycle d'un projet de recherche" chips |
| Footer green | `#006144`, button `#6EFC8A` | footer |

Film palette: petrol blue as the ground, cyan as the **single accent**, white and `#212121` for type.
Fonts are the site's licensed webfonts and are used only to render this film. `fonts/` is git-ignored, so don't redistribute them.

## Published figures (candidates for the metric beat)

| Figure | Exact wording on the page |
|---|---|
| **800** | "800 Projets de recherche clinique" (key figures counter, `data-to="800"`) |
| **600** | "600 Projets initiés par le CHUV" (key figures counter) |
| 640 | "Quelque 640 cadres médicaux du CHUV sont également chercheur-euses et enseignant-e-s" |
| 22 | "Forte de 22 départements" (FBM) |
| 13'000 | "ses quelque 13'000 collaboratrices et collaborateurs" |

No count of clinical studies or publications is published on the page or its subpages
(soutien-aux-essais-cliniques, soutiens-a-la-recherche-clinique, innovation-office, cycle-dun-projet-de-recherche).

## Screens (`shots/`)

- `mobile-top.png`, `mobile-full.png`: 390 px viewport at 3x (1170 px wide), counters already at 800 / 600.
- `desktop-top.png`, `desktop-full.png`: 1440 px viewport at 2x.
- `m-menu-before/after.png`: mobile, burger tapped, menu open.

## Real interactions, desktop 1440 at 2x (`shots/d-*`): before, hover, after

1. **menu**: click "Recherche et innovation" → mega menu ("Lieu de recherche et d'innovation" / "Accompagnement à la recherche").
2. **trials**: click the "Essais cliniques / Centre de recherche clinique" card (cyan hover bar) → "Soutien aux essais cliniques" page.
3. **news**: click the "Actualités suivantes" arrow (cyan hover circle) → the carousel advances three cards.

Cursor targets (viewport CSS px) are in `capture.json → actions.*.target`.

## UI crops (`ui/`), with page boxes in `capture.json → ui`

Mobile: header, logo, burger, Urgences button, h1, intro paragraph, key figure cards (800, 600), section headings, trials card.
Desktop: "Recherche et innovation" pill, key figures band, support cards grid, trials card.

## Photos (`photos/`)

Three hero photos (culture plates, pipette, clinical research room) and the news card thumbnails, all from the page.
They are copyrighted by CHUV, so use them only in this film.

## Client-supplied (earlier session, before site access)

| File | Notes |
|---|---|
| `raw-01-hero-mobile.png` | Client's iPhone screenshot of the page (1206×2622, with Safari/iOS chrome). Kept as the original. |
| `01-hero-mobile.png` | Crop of raw-01: logo, title, "Unil." block, intro paragraph, top of the lab photo. |
| `logo-crop-mobile.png` | Low-resolution logo crop, superseded by `brand/logo.svg`. |

That session sampled its palette from the screenshot (`#1B4562`, `#88E6FC`). iOS colour management shifts those values,
so the site's own CSS values above are the reference.
