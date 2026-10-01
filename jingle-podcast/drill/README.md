# « Ville et Engagement » : version drill

C'est une variante de la version trap (`../trap`), plus sombre et plus nerveuse. Le motif calqué sur le
nom, la cloche de mairie, le coup de tampon et les applaudissements de groupe sont conservés.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_VilleEtEngagement_drill_logo_142bpm_Fm` | 5,0 s | Le nom sur des 808 qui glissent, puis la cloche et un 808 qui descend d'une octave |
| `02_VilleEtEngagement_drill_jingle_142bpm_Fm` | 8,6 s | Intro, montée, **silence**, drop drill, réponse du piano, cloche finale |

## Ce qui change par rapport à la trap

| | Trap | Drill |
|---|---|---|
| Tempo | 140 BPM | **142 BPM** |
| Caisse claire | 3e temps | 3e temps + **frappes décalées** (double croche avant le temps, en alternance) |
| Charleston | croches et roulements | **rebond 3-3-2** en doubles croches, triolets |
| 808 | glissando court | **glissandos lents** (~90 ms), sauts d'**octave** (ré♭2 ↔ ré♭3), chute finale fa2 → fa1 |
| Harmonie | Db – Eb – Fm | Db – Eb – Fm – **Gb** – C : le **sol bémol** (couleur phrygienne) apporte la tension |
| Mélodie | cloche trap (FM) | **piano sombre** et cordes |

Le piano double la voix une octave plus haut. Il répond au nom par une phrase descendante
(lab – solb – fa), puis remonte par mi – sol vers la cloche finale.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Voix – Ville et Engagement | 1 | 53 Choir Aahs (paroles intégrées au MIDI) |
| 2 | Piano Drill (mélodie) | 2 | 1 Acoustic Grand |
| 3 | Cordes sombres | 3 | 49 String Ensemble |
| 4 | 808 Drill | 4 | 39 Synth Bass 1 (à remplacer par un 808 avec glide de 80 à 100 ms) |
| 5 | Cloche de mairie | 5 | 15 Tubular Bells |
| 6 | Batterie Drill – Tampon – Mains | 10 | kick 36, caisse claire 38, **tampon 37**, **mains 39**, charleston 42, **montée 55** |

## Limites de la maquette

La voix est synthétique : elle chante les voyelles, sans consonnes. En drill, une voix **scandée, grave et
sèche** (« Ville et Engagement. »), éventuellement doublée d'une octave plus basse, serait idéale. Pour
le 808, un vrai échantillon avec un glide réglé entre 80 et 100 ms sonnera plus rond que la synthèse.

## Regénérer

```bash
python3 generate_drill.py   # réutilise ../generate.py, ../carte-blanche et ../trap
```
