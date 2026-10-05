# Assets: Formations au CHUV

Captured 2026-10-05 from https://www.chuv.ch/fr/formation/formations-au-chuv (Playwright, 1440 px at 2x).
`page.json` holds the computed colors and the download list. `shots/desktop-full.png` is the whole page.

## Brand: the Formation section's own colorway

The site gives each section its own colors. Recherche is petrol and cyan; **Formation is green and mint**.

| Token | Value | Where on the page |
|---|---|---|
| Forest green | `#006144` | hero and header background, primary buttons ("Voir les offres de formation") |
| Signal green (accent) | `#6EFC8A` | active nav pill "Formation", text black |
| Mint | `#B8F9E5` | intro and category bands |
| Grey surface | `#F3F3F3` | apprenticeship and continuing-education bands |
| Lilac | `#C996F1` | secondary buttons (FBM, Centre des formations) |
| White | `#FFFFFF` | list rows with arrow |
| Ink | `#212121` | text |
| Display face | Sharp Grotesk 400 | h1/h2 |
| UI face | Atlas Grotesk 400/700 | body, rows, buttons |
| Logo | `brand/logo.svg` (white) | header |

Fonts are the site's licensed webfonts, copied from the research film (`fonts/`, git-ignored).

## Real copy (verbatim)

- H1: **Formations au CHUV**
- Intro: "Très attaché à sa mission de formation, le CHUV entretient des liens privilégiés avec les universités et les multiples écoles, tout en organisant ses propres programmes de formation. Au cœur de nombreux réseaux nationaux et internationaux, il réunit des conditions uniques pour apprendre et progresser professionnellement."
- Buttons: **Voir les offres de formation** · Faculté de biologie et de médecine · Centre des formations du CHUV
- "Catégories professionnelles", 7 categories and their rows (read from the page; the scripted grouping in page.json is wrong):
  - Professions médicales universitaires: Pharmacien-ne · Médecin · Ecole de formation postgraduée médicale · Formation continue · Ecole doctorale: MD, MD-PhD
  - Soins: Bachelor HES · Apprentissage ASSC · Stages dans la santé · Formation continue
  - Administration: Apprentissages · Formation continue
  - Médico-technique et thérapeutique: Diplômes et Bachelor · Apprentissages · Stages dans la santé · Formations postgraduées de spécialiste · Formation continue
  - Psycho-social: Pré-grade: Master · Stages · Formations postgraduées de spécialiste · Formation continue
  - Logistique: Apprentissages · Formation continue
  - Management et cadres: Formation continue
- Sections: Stages d'observation · Apprentissages · Les offres de formation continue · Formation en ligne ("Apprendre grâce à nos cours, conférences et vidéos en ligne")
- Apprenticeship CFC rows: Assistant-e en soins et santé communautaire CFC · Cuisinier-ère CFC · Employé-e de commerce CFC · Laborantin, option chimie CFC

## Published figures

| Figure | Wording |
|---|---|
| **260+** | "Depuis août 2024, plus de 260 apprenti-es suivent une formation pour obtenir un certificat fédéral…" |
| **30** | "…l'encadrement de formateur-trices dans 30 métiers très variés…" |
| **13 000** | "Pour développer les compétences des quelque 13 000 collaboratrices et collaborateurs du CHUV…" |
| 12 mois | "places de stage d'une durée de 12 mois" (maturité professionnelle commerciale 3+1) |

The hook "Des formations reconnues internationalement" is the client's line. The page supports it with
"Au cœur de nombreux réseaux nationaux et internationaux", but it publishes no ranking or accreditation.

## Photos (`photos/`)

- `csm_chuv-formation-simulation_*.webp`: infant resuscitation on a simulation mannequin
- `csm_chuv-formation-apprenties_*.webp`: two trainees in gowns at an ICU bedside
- `csm_chuv-formation-e-learning_*.webp`: top-down view of four people on laptops linked by coloured lines
- News thumbnails (the other `csm_*` files)

Brief: don't use photos as they are. Rebuild them as UI elements (cards, masks, panels). They are copyrighted by CHUV, so use them only in this film.
