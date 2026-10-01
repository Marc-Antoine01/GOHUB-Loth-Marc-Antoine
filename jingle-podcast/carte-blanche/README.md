# « Ville et Engagement » : proposition carte blanche

C'est une proposition alternative, bâtie sur le **nom du podcast**. La version validée (dossier parent)
reste inchangée.

| Fichier | Durée | Rôle |
|---|---|---|
| `01_VilleEtEngagement_logo_120bpm_F` | 5,0 s | Logo sonore : le nom chanté, puis la cloche |
| `02_VilleEtEngagement_jingle_120bpm_F` | 8,6 s | Jingle : le nom trois fois, puis une montée vers la cloche |

## Le principe

**Le motif, c'est le titre.** Ses cinq notes suivent les syllabes de « Ville et Engagement », avec
l'accent du français sur *VIL* et sur *-MENT* :

```
VIL    – l'é  – en  – GA  – GE-MENT
do       fa     sol   la    DO
croche   double croche  croche   croche   longue
pointée
```

La voix finit sur la quinte (do) : c'est une **question**, un appel. La **cloche de la mairie** lui
**répond** sur la tonique (fa) et conclut. La ville répond à l'engagement.

**Les signatures sonores sont des sons municipaux :**
- **La cloche de mairie** : la note finale, solennelle et civique. Elle est synthétisée ici.
  L'idéal serait d'enregistrer la vraie cloche de votre mairie.
- **Le coup de tampon** : il frappe le contretemps du 4e temps et la note finale. C'est un clin d'œil
  convivial au quotidien des agents (« c'est validé »).
- **Des applaudissements de groupe** : six personnes, pas tout à fait ensemble. Ce sont des humains,
  pas une boîte à rythmes.

**L'harmonie** est en fa majeur, avec des accords suspendus (Bb add9 – Csus4 – Dm7 – Gm7 → F add9).
L'accord majeur porte l'espoir, et les suspensions lui donnent du sérieux sans naïveté. Le tempo est
de 120 BPM.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Voix – Ville et Engagement | 1 | 53 Choir Aahs (paroles intégrées au MIDI) |
| 2 | Piano Mélodie | 2 | 1 Acoustic Grand |
| 3 | Piano Accords | 3 | 1 Acoustic Grand |
| 4 | Cordes | 4 | 49 String Ensemble |
| 5 | Basse | 5 | 34 Fingered Bass |
| 6 | Cloche de mairie | 6 | 15 Tubular Bells |
| 7 | Batterie – Tampon – Mains | 10 | kick 36, **tampon = 37** (side stick), **mains = 39** (clap), charleston 42 |

La piste de voix du MIDI contient les **paroles** (Vil / le et / en / ga / ge-ment). Elles s'affichent
dans GarageBand, Logic ou MuseScore et peuvent guider des chanteurs.

## Limites de la maquette

La voix est faite par synthèse de formants : elle chante les **voyelles** du titre (i – é – an – a – an),
mais sans consonnes, donc on ne comprend pas les mots. Pour la version finale, l'idéal est
**d'enregistrer des élus et des agents qui chantent ou scandent « Ville et Engagement »** sur le motif,
et la vraie cloche de la mairie. On les place ensuite dans Audition à la place des stems 1 et 6.

## Regénérer

```bash
python3 generate_carte_blanche.py   # réutilise les synthés et le mix de ../generate.py
```
