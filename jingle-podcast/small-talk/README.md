# « Ville et Engagement » : version « petite conversation »

C'est une proposition **ludique, rapide et complice**, dans l'esprit des formats d'interview web
décontractés (type *Small Talk* de Konbini). La mélodie et les instruments sont **entièrement nouveaux**.
Aucune musique existante n'est reprise. Il n'y a **ni cloche, ni percussion métallique, ni chœur**.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_…_logo_118bpm_F` | 5,0 s | Le motif, la réponse, puis l'accord final pétillant |
| `02_…_jingle_118bpm_F` | 8,6 s | Le motif, la réponse, le motif, une réponse qui monte, puis l'accord final |
| `03_…_jingle-court_118bpm_F` | 2,9 s | Le motif une fois, puis un fondu |
| `04_…_virgule-1-motif_118bpm_F` | 2,9 s | **Virgule « motif »** : la signature complète, puis l'accord pétillant |
| `05_…_virgule-2-montee_118bpm_F` | 1,9 s | **Virgule « montée »** : un arpège sifflé qui grimpe, puis l'accord. Pour **ouvrir** une séquence |
| `06_…_virgule-3-descente_118bpm_F` | 2,4 s | **Virgule « descente »** : une phrase qui redescend et se pose en douceur. Pour **refermer** une séquence |
| `07_…_virgule-4-conclusion_118bpm_F` | 6,0 s | **Virgule « conclusion »** : une longue descente qui ralentit et se pose sur un accord tenu. Pour **finir l'épisode** |

## Les virgules

Ce sont des transitions, avec les mêmes instruments, le même tempo et la même tonalité, pour
rythmer l'épisode :

1. **Motif** (2,9 s) : *Vil-le et en-ga-ge-MENT* en entier (Fmaj7 → C7), relance de caisse claire, puis
   l'accord F6/9. C'est la virgule « signature », à placer entre deux grandes parties.
2. **Montée** (1,9 s) : un arpège sifflé qui grimpe sur C7 (mi – sol – sib – do – mi – SOL), un
   roulement de caisse claire, puis le fa. Elle est énergique, pour lancer une nouvelle question ou
   une nouvelle rubrique.
3. **Descente** (2,4 s) : sib – la – sol… do – sib – sol – mi, qui se pose sur un **fa grave tenu**,
   avec peu de batterie. Elle est plus douce, pour refermer un moment ou laisser respirer.
4. **Conclusion** (6,0 s) : c'est la descente en version longue, sur quatre accords qui descendent
   (Bbmaj7 – Am7 – Gm7 – C7). Le sifflement part du **fa aigu** et redescend jusqu'au **fa grave**, avec
   des notes de plus en plus longues (effet de ralenti). La batterie s'allège peu à peu, puis l'accord
   final F6/9 est **tenu** et s'éteint en fondu. Elle sert à conclure l'épisode.

## La mélodie (nouvelle)

Elle est **sifflée** : c'est humain, léger, et ça évoque quelqu'un de détendu qui discute. Ses sept
notes, bavardes, suivent le rythme du titre dit vite :

```
Vil – le – et – en – GA – ge – MENT
do    la   do   ré   FA   mi   do
```

Une **réponse** (sib – la – sol… mi – sol – sib – do – MI) relance vers le motif. Dans le jingle, la
seconde réponse **monte jusqu'au sol** et retombe sur le fa final.

## Le groove

- **118 BPM**, funk léger, avec un peu de **swing** sur les doubles croches.
- Grille jazz-pop **Fmaj7 – Dm7 – Gm7 – C7**, puis un accord final **F6/9**, court et pétillant.
- **Guitare funky** : accords secs sur les contretemps, grattés étouffés autour.
- **Clavinet** : petites frappes syncopées.
- **Basse funky** : fondamentale, octave qui saute, quinte, et **approche chromatique** vers l'accord suivant.
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
