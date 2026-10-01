# « Ville et Engagement » : trap chaleureuse

C'est une proposition plus chaleureuse, construite comme la version trap retenue (`../trap`, inchangée) :
groove continu, nom chanté deux fois, cloche de mairie finale, et une version courte en fondu.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_…_logo_130bpm_F` | 5,0 s | Le nom chanté, puis la cloche de mairie |
| `02_…_jingle_130bpm_F` | 9,6 s | Groove continu : le nom, le nom (plus dense), puis la cloche finale |
| `03_…_jingle-court_130bpm_F` | 3,8 s | Le nom, qui s'éteint en fondu juste après « GE-MENT » |

## Ce qui la rend plus chaleureuse

| | Trap (retenue) | Trap chaleureuse |
|---|---|---|
| Tonalité | fa mineur (Db – Eb – Fm) | **fa majeur**, accords enrichis : Bbmaj7 – C6/9 – Fmaj9 – Am7 – Dm9 |
| Mélodie | cloche FM métallique | **guitare pincée**, qui double la voix une octave plus haut |
| Accords | nappe sombre | **piano électrique** (type Rhodes), avec un léger trémolo, et une nappe chaude |
| 808 | saturé, glissandos | **rond**, peu saturé, glissandos courts |
| Batterie | caisse claire + mains, roulements serrés | **mains** sur le 3e temps (sans caisse claire), charleston feutré |
| Tempo | 140 BPM | **130 BPM**, plus posé |
| Espace | réverbération modérée | réverbération plus large |

Le motif du nom (VIL – l'é – en – GA – GE-MENT sur do – fa – sol – **la** – DO), la cloche de mairie,
le tampon et les applaudissements de groupe sont conservés.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Voix – Ville et Engagement | 1 | 53 Choir Aahs (paroles intégrées au MIDI) |
| 2 | Guitare (mélodie) | 2 | 25 Nylon Guitar |
| 3 | Piano électrique | 3 | 5 Electric Piano 1 |
| 4 | Nappe chaude | 4 | 49 String Ensemble |
| 5 | 808 rond | 5 | 39 Synth Bass 1 (à remplacer par un 808 doux) |
| 6 | Cloche de mairie | 6 | 15 Tubular Bells |
| 7 | Batterie douce – Tampon – Mains | 10 | kick 36, **tampon 37**, **mains 39**, charleston 42 |

## Limites de la maquette

La voix est synthétique : elle chante les voyelles, sans consonnes. Une voix réelle, chantée doucement
ou parlée avec le sourire, renforcerait encore la chaleur. Un vrai Rhodes et une vraie guitare (ou de
bons instruments virtuels) donneront plus de rondeur que la synthèse.

## Regénérer

```bash
python3 generate_trap_chaleureux.py   # réutilise ../generate.py, ../carte-blanche et ../trap
```
