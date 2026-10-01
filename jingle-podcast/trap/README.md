# « Ville et Engagement » : version trap

C'est la proposition carte blanche (`../carte-blanche`), habillée en **trap**. Le motif calqué sur le nom,
la cloche de mairie, le coup de tampon et les applaudissements de groupe sont conservés. Tout le reste change.

| Fichier | Durée | Déroulé |
|---|---|---|
| `01_VilleEtEngagement_trap_logo_140bpm_Fm` | 5,0 s | Le nom chanté sur des roulements de charleston, puis la cloche et le 808 |
| `02_VilleEtEngagement_trap_jingle_140bpm_Fm` | 8,6 s | Groove continu : le nom, puis le nom (plus dense), puis la cloche finale |
| `03_VilleEtEngagement_trap_jingle-coupe_140bpm_Fm` | 3,6 s | Le nom chanté sur le groove, qui s'éteint **en fondu** juste après « GE-MENT » (temps 6) |

## Ce qui en fait de la trap

- **140 BPM en « half-time »** : la caisse claire, doublée des applaudissements, frappe le 3e temps.
  Le morceau est rapide, mais on le ressent posé et lourd.
- **Basse 808** : une basse tenue et saturée, qui **glisse** d'une note à l'autre (Db → Eb → F).
- **Charleston en roulements** : croches, doubles croches, triolets et quadruples croches, qui accélèrent avant les temps forts.
- **Fa mineur** sur la grille épique Db – Eb – Fm (VI – VII – i). Le ton est grave et déterminé.
- **Mélodie de cloche trap** : un son métallique et brillant (synthèse FM) qui double la voix une octave
  plus haut.
- **Une montée sans coupure** : le 808 et la batterie jouent dès la première mesure. La densité augmente
  par paliers (mains, tampon, roulements de charleston de plus en plus serrés) jusqu'à la cloche finale.

## Le motif

On retrouve le même nom, la même idée de question et de réponse, en mineur et en valeurs doublées :

```
VIL     – l'é – en  – GA   | GE-MENT
do        fa    sol   lab  | DO   (sur le temps fort suivant, avec le 808)
```

La cloche de mairie frappe toujours la tonique (fa) pour conclure.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI |
|---|---|---|---|
| 1 | Voix – Ville et Engagement | 1 | 53 Choir Aahs (paroles intégrées au MIDI) |
| 2 | Cloche Trap (mélodie) | 2 | 113 Tinkle Bell |
| 3 | Nappe sombre | 3 | 90 Warm Pad |
| 4 | 808 | 4 | 39 Synth Bass 1 (à remplacer par un vrai 808, avec glide/portamento) |
| 5 | Cloche de mairie | 5 | 15 Tubular Bells |
| 6 | Batterie Trap – Tampon – Mains | 10 | kick 36, caisse claire 38, **tampon 37**, **mains 39**, charleston 42/46 |

## Limites de la maquette

Comme pour la carte blanche, la voix est synthétique : elle chante les voyelles, sans consonnes. En trap,
une **voix parlée ou scandée** (« Ville et Engagement ! »), un peu traitée (pitch, delay), fonctionnerait
très bien. Le plus efficace serait de l'enregistrer avec des élus ou des agents. Pour le 808, un vrai
échantillon 808 avec du glide sonnera plus rond.

## Regénérer

```bash
python3 generate_trap.py   # réutilise ../generate.py et ../carte-blanche/generate_carte_blanche.py
```
