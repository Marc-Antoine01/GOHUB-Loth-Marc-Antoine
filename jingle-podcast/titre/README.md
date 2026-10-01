# « Ville et Engagement » : essai centré sur le titre

Cet essai part **uniquement du titre**. Il n'utilise aucune cloche et aucune référence à la mairie (ni
cloche, ni tampon). Les autres versions restent inchangées.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_…_logo_140bpm_Fm-F` | 5,0 s | « Ville et », puis « en-ga-ge » qui monte et se pose en majeur sur « -MENT » |
| `02_…_jingle_140bpm_Fm-F` | 8,6 s | Le titre deux fois en mineur, puis la montée finale qui passe en majeur |
| `03_…_jingle-court_140bpm_Fm-F` | 3,6 s | Le titre une fois, qui s'éteint en fondu après « -MENT » |

## L'idée : le titre raconte un mouvement

- **« Ville »** : c'est la pulsation urbaine. Un groove trap à 140 BPM porte des **cuivres synthétiques**
  qui frappent les accords sur un rythme 3-3-2, comme le pouls d'une ville.
- **« Ville et »** est chanté en appel, sur une quarte qui monte (do – fa).
- **« Engagement »** monte **marche par marche** : *en – ga – ge – MENT* sur sol – lab – sib – **DO**.
  Chaque syllabe est un pas de plus.
- **« et »** fait le lien entre les deux mondes. Le morceau commence en **fa mineur** (la ville, le
  sérieux) et finit en **fa majeur** (l'engagement, l'espoir). Lors de la dernière montée, le la bémol
  devient **la bécarre** : c'est l'instant précis où la musique s'éclaire. La voix conclut elle-même
  sur l'accord majeur, sans cloche.

Grille : Fm – Eb – Db – C (deux fois), puis C7 → **F majeur**.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Voix – Ville et Engagement | 1 | 53 Choir Aahs (paroles intégrées au MIDI : Vil / le et / en / ga / ge / ment) |
| 2 | Piano (mélodie) | 2 | 1 Acoustic Grand (double la voix) |
| 3 | Cuivres synthé | 3 | 62 Synth Brass 1 |
| 4 | Nappe | 4 | 49 String Ensemble |
| 5 | 808 | 5 | 39 Synth Bass 1 (à remplacer par un vrai 808) |
| 6 | Batterie | 10 | kick 36, caisse claire 38, mains 39, charleston 42/46, crash 49 |

## Limites de la maquette

La voix est synthétique : elle chante les voyelles du titre, sans consonnes. C'est d'autant plus
important ici que **tout repose sur le titre** : une voix réelle (chantée ou scandée) qui prononce
« Ville et Engagement » fera vraiment exister l'idée. Les paroles sont dans le MIDI.

## Regénérer

```bash
python3 generate_titre.py   # réutilise ../generate.py, ../carte-blanche et ../trap (synthés, voix, 808)
```
