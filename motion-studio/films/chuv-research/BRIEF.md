# Brief: La recherche au CHUV (20 s, 120 BPM)

Source: https://www.chuv.ch/fr/recherche-et-innovation/la-recherche-au-chuv
Language on screen: French.

## Decisions (validated by the client)
- **CTA:** « Découvrir la recherche au CHUV » + the page URL.
- **Metric:** a figure published verbatim on chuv.ch, with its source page recorded in `assets/ASSETS.md`.
  Preference order: (1) clinical studies in progress, (2) scientific publications per year,
  (3) researchers / active projects. If none is published on the site, there is no number; never invent one.
  Propose the chosen figure to the client before animating.

## Story (sections in film.json)
1. hook 0–3 s: the problem in 5 words of huge kinetic type.
2. service 3–6 s: the research page assembles itself piece by piece (real screenshots, cropped).
3. feature1–3 6–15 s: three UI moments, each with a cursor doing a real action captured on the site.
4. metric 15–17.5 s: the number.
5. lockup 17.5–20 s: real logo + CTA.

## Status
- Done: timeline, 120 BPM score (sound.mjs), beats.json, multi-format rendering (9x16, 1x1, 16x9).
- Done: assets captured (assets/ASSETS.md, capture.json). Chromium needs the proxy CA in its NSS store:
  `certutil -A -d sql:$HOME/.pki/nssdb -n ccr-agent-proxy -t "C,," -i /root/.ccr/agent-proxy-ca.crt` (package libnss3-tools).
  Fonts are git-ignored: rerun capture.mjs to fetch them.
- Proposed metric (awaiting client OK): **800 projets de recherche clinique** (published key figure).
- Next: build -> contact-sheet loop until every score >= 8 -> show the sheet -> full render in all three formats.
