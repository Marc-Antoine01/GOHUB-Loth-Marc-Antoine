# « Ville et Engagement » : version « petite conversation »

C'est une proposition **ludique, rapide et complice**, dans l'esprit des formats d'interview web
décontractés (type *Small Talk* de Konbini). La mélodie et les instruments sont **entièrement nouveaux**.
Aucune musique existante n'est reprise. Il n'y a **ni cloche, ni percussion métallique, ni chœur**.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_…_logo_118bpm_F` | 5,0 s | Le motif, la réponse, puis l'accord final pétillant |
| `02_…_jingle_118bpm_F` | 8,6 s | Le motif, la réponse, le motif, une réponse qui monte, puis l'accord final |
| `03_…_jingle-court_118bpm_F` | 2,9 s | Le motif une fois, puis un fondu |

## La mélodie (nouvelle)

Elle est **sifflée** : c'est humain, léger, et ça évoque quelqu'un de détendu qui discute. Elle est
**liée et posée** : peu de doubles croches, des notes qui durent jusqu'à la suivante, des appuis sur les
temps et des intervalles serrés. Ses sept notes suivent le rythme du titre :

```
Vil – le – et – en – GA – ge – MENT
la    do   do   ré   FA   mi   DO
```

Une **réponse** (sib – la – sol… sib – do – mi) relance doucement vers le motif. Dans le jingle, la
seconde réponse **monte** (sib – ré – FA…) vers le fa final, tenu.

## Le groove

- **118 BPM**, funk léger, avec un soupçon de **swing**.
- Grille jazz-pop **Fmaj7 – Dm7 – Gm7 – C7**, puis un accord final **F6/9**, court et pétillant.
- **Guitare funky** : accords secs sur les contretemps, grattés étouffés autour.
- **Clavinet** : petites frappes syncopées.
- **Basse funky** : fondamentale, quinte, et **approche chromatique** vers l'accord suivant (sans saut d'octave).
- **Batterie sèche + claquements de doigts** sur 2 et 4, **shaker** en doubles croches.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Sifflement (mélodie) | 1 | 79 Whistle (paroles du titre intégrées au MIDI) |
| 2 | Guitare funky | 2 | 29 Electric Guitar (muted). Les grattés étouffés sont des notes de vélocité < 30 |
| 3 | Clavinet | 3 | 8 Clavinet |
| 4 | Basse funky | 4 | 37 Slap Bass 1 |
| 5 | Batterie – Claquements – Shaker | 10 | kick 36, caisse claire 38, claquements 39 (hand clap), shaker 70 |

## Limites de la maquette

Le sifflement est synthétique. Un **vrai sifflement**, enregistré au smartphone par quelqu'un de l'équipe,
renforcerait beaucoup le côté complice. Une vraie guitare et une vraie basse funk donneront plus de
mordant que la synthèse.

## Regénérer

```bash
python3 generate_small_talk.py
```
