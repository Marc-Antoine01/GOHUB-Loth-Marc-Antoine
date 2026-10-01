# Logo sonore du podcast : engagement citoyen des élus et agents de mairie

Habillage sonore pop, **120 BPM**, **ré mineur**, en 4/4. L'ambiance se veut sérieuse mais conviviale :
un mode mineur et un registre grave pour le poids de l'engagement, une pulsation régulière pour le
dynamisme de la ville. Il se décline en trois versions bâties sur le même motif.

| Fichier | Durée | Rôle |
|---|---|---|
| `01_jingle_120bpm_Dm` | 8,6 s | Logo sonore principal (générique de début) |
| `02_virgule_120bpm_Dm` | 3,0 s | Virgule, pour la transition entre deux séquences |
| `03_outro_120bpm_Dm` | 15,0 s | Outro de fin d'épisode, qui peut passer sous les crédits |

## Contenu

```
midi/        MIDI multipistes (type 1), un fichier par déclinaison
stems/       une piste WAV par instrument (48 kHz, 24 bits), calées à 0 s
maquettes/   mix écoutable (WAV 48 kHz / 24 bits + MP3 320 kbit/s), -16 LUFS
generate.py  la partition et le moteur de rendu ; relancer pour tout regénérer
```

## Le motif

Le motif est une montée **la – ré – fa … mi – fa – LA**, dans le médium-grave (du la 2 au ré 4 en
notation française). La ligne monte, comme une ville en mouvement, mais elle reste posée et facile à retenir.

- **Jingle** : la grille Dm – C – Bb – C, un enchaînement pop en mineur, porte le motif, sa réponse,
  puis le motif qui monte (sol – la). Il se résout sur **ré mineur (add9)**, un accord ouvert : grave
  sans être triste. La résolution s'appuie sur une frappe de grosse caisse, de tom basse et de cymbale.
- **Virgule** : le motif tient en deux temps (la – ré – fa – la) sur Bb → C, puis frappe le ré final.
- **Outro** : il démarre plus léger, sans caisse claire, pour laisser de la place à la voix. Le motif
  revient ensuite en entier, avec une variation qui monte vers le do, puis il est rappelé une dernière fois.
  Un roulement de caisse claire et de toms sur Gm → Asus4 → A mène au ré final, qui s'éteint en fondu.

## Pistes (MIDI et stems)

| # | Piste | Canal | Son General MIDI | Rôle |
|---|---|---|---|---|
| 1 | Mélodie – Synth Lead | 1 | 82 Saw Lead | le motif, son chaud et filtré |
| 2 | Arpège Synth | 2 | 81 Square Lead | arpège en croches, en retrait : la pulsation urbaine |
| 3 | Piano | 3 | 1 Acoustic Grand | accords en croches régulières + octave grave |
| 4 | Cordes Graves | 4 | 49 String Ensemble | assise harmonique, registre grave |
| 5 | Basse Synth | 5 | 39 Synth Bass 1 | croches pulsées sur la fondamentale |
| 6 | Batterie | 10 | kit GM | kick, caisse claire + clap, charleston, toms, crash |

Les MIDI contiennent aussi le tempo (120 BPM), la mesure, la tonalité, des **marqueurs** (Motif, Réponse,
Final…) et le volume et le panoramique de chaque piste.

## Utilisation dans Adobe Audition

> ⚠️ Adobe Audition est un éditeur audio : **il n'importe ni ne lit les fichiers MIDI**. C'est pour cette
> raison que chaque déclinaison est aussi livrée en **stems audio**, qui s'importent directement dans la multipiste.

**Option A : les stems (recommandée)**
1. *Fichier › Nouveau › Session multipiste…*, à 48 000 Hz.
2. Faites glisser les 6 WAV de `stems/<déclinaison>/` sur 6 pistes, tous calés à **0:00.000**.
3. Ajustez le niveau, l'égalisation et les effets de chaque piste. Vous pouvez aussi couper une piste,
   par exemple la mélodie pour obtenir un fond sous la voix.
4. Utilisez *Multipiste › Mixer la session vers un nouveau fichier* pour l'export.

Les stems ont déjà le mix de la maquette : leur somme redonne la maquette, à l'adoucissement des crêtes près.

**Option B : de meilleurs sons à partir du MIDI**
Ouvrez les `.mid` dans un séquenceur (GarageBand, Logic, Ableton, FL Studio, Cubase, Reaper, MuseScore…).
Remplacez les sons GM par vos instruments virtuels, exportez chaque piste en WAV, puis importez ces WAV dans
Audition comme dans l'option A. Le tempo et les marqueurs sont lus automatiquement.

## Maquette

Les maquettes sont synthétisées par `generate.py`, sans échantillons, pour juger la composition, le tempo
et la structure. Elles sont normalisées à **-16 LUFS**, la norme podcast, avec des crêtes sous -1 dBFS.
Pour une version de diffusion, il vaut mieux refaire le rendu à partir des MIDI avec de vrais instruments
virtuels (option B).

## Regénérer

```bash
pip install numpy scipy mido pyloudnorm   # + ffmpeg pour le MP3
python3 generate.py
```

La partition (notes, accords, batterie) est entièrement décrite dans les fonctions `cue_jingle`,
`cue_virgule` et `cue_outro` de `generate.py`. Les réglages de mix sont dans `MIX`.
