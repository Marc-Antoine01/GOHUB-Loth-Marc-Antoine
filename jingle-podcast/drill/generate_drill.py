#!/usr/bin/env python3
"""« Ville et Engagement », version drill.

Variante de la version trap (../trap), plus sombre et plus nerveuse :
  - 142 BPM, caisse claire sur le 3e temps + frappes décalées (doubles croches avant les temps) ;
  - charleston « drill » groupé par 3 (3-3-2 en doubles croches) avec des triolets ;
  - 808 qui glissent beaucoup, y compris à l'octave (glissando lent, ~90 ms) ;
  - fa mineur teinté de phrygien (solb) : Db – Eb – Fm – Gb – C ;
  - piano sombre et cordes au lieu de la cloche trap.
Le motif du nom, la cloche de mairie, le tampon et les applaudissements sont conservés.

Usage : python3 generate_drill.py
"""

import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
for sub in ("", "carte-blanche", "trap"):
    sys.path.insert(0, os.path.join(ROOT, sub))
import generate as gen  # noqa: E402
import generate_carte_blanche as cb  # noqa: E402
import generate_trap as trap  # noqa: E402
from generate import n, note, hz, SR  # noqa: E402

gen.BPM = 142
gen.BEAT = 60.0 / gen.BPM
gen.KEY = "Fm"

KICK, SNARE, HAT, OHAT, RISER = gen.KICK, gen.SNARE, gen.HAT, trap.OHAT, trap.RISER
TAMPON, GROUP_CLAP = cb.TAMPON, cb.GROUP_CLAP

VOICE = cb.VOICE
PIANO = "Piano Drill (melodie)"
STRINGS = "Cordes sombres"
B808 = "808 Drill"
TOWN_BELL = trap.TOWN_BELL
DRUMS = "Batterie Drill - Tampon - Mains"

gen.CHORDS = {
    "Db": (None, ["Db3", "F3", "Ab3"], "Db2", None),
    "Eb": (None, ["Eb3", "G3", "Bb3"], "Eb2", None),
    "Fm": (None, ["F3", "Ab3", "C4"], "F2", None),
    "Gb": (None, ["Gb2", "Db3", "Bb3"], "Gb2", None),
    "C": (None, ["C3", "E3", "G3"], "C2", None),
}

gen.TRACKS = [
    (VOICE, 0, 52, 100, 64),
    (PIANO, 1, 0, 96, 54),
    (STRINGS, 2, 48, 82, 78),
    (B808, 3, 38, 112, 64),
    (TOWN_BELL, 4, 14, 100, 70),
    (DRUMS, 9, 0, 110, 64),
]


def inst_piano_drill(p, dur, vel):
    """Piano sombre et résonant, typique des prods drill."""
    return gen.inst_piano(p, dur + 0.3, vel, bright_base=0.42, decay=0.6)


def render_808_drill(notes, total_s, gain):
    """808 drill : chaque note liée glisse lentement vers la suivante (octaves comprises)."""
    nsamp = int((total_s + 3) * SR)
    freq, amp = np.zeros(nsamp), np.zeros(nsamp)
    prev_f, prev_end = None, -1.0
    for s, d, p, v in sorted(notes):
        i0, i1 = int(s * gen.BEAT * SR), int((s + d) * gen.BEAT * SR)
        seg = np.arange(min(i1 + int(0.05 * SR), nsamp) - i0) / SR
        f = hz(p)
        if prev_f is not None and s - prev_end < 0.05:
            fcurve = f + (prev_f - f) * np.exp(-seg / 0.09)  # glissando lent, marque de fabrique de la drill
        else:
            fcurve = f * (1 + 0.6 * np.exp(-seg / 0.018))
        freq[i0:i0 + len(seg)] = fcurve
        held = d * gen.BEAT
        env = np.exp(-seg / 2.2) * np.clip(seg / 0.002, 0, 1)
        env = np.where(seg > held, env * np.exp(-(seg - held) / 0.02), env)
        amp[i0:i0 + len(seg)] = np.maximum(amp[i0:i0 + len(seg)], env * (v / 127) ** 1.2)
        prev_f, prev_end = f, s + d
    y = np.tanh(2.6 * np.sin(2 * np.pi * np.cumsum(freq) / SR)) * amp * gain
    return np.stack([y, y], axis=1)


gen.MIX = {
    VOICE: (None, 0.38, 0.0, 0.45),
    PIANO: (inst_piano_drill, 0.21, -0.25, 0.45),
    STRINGS: (gen.inst_strings, 0.18, 0.3, 0.55),
    B808: (None, 0.15, 0.0, 0.0),
    TOWN_BELL: (cb.inst_bell, 0.22, 0.15, 0.50),
    DRUMS: (trap.inst_drums, 0.30, 0.0, 0.10),
}

_render_track = gen.render_track


def render_track(name, notes, total_s):
    if name == B808:
        return render_808_drill(notes, total_s, gen.MIX[name][1])
    return _render_track(name, notes, total_s)


gen.render_track = render_track


# --------------------------------------------------------------------------
# Batterie drill
# --------------------------------------------------------------------------
HAT_STEPS = [0, 3, 6, 8, 11, 14]  # groupement 3-3-2-3-3-2 en doubles croches


def drill_hats(bar, roll=None, base=62):
    """Charleston drill : rebond 3-3-2 ; `roll` = (début, fin, pas) pour un triolet ou une rafale."""
    out = [n(bar + st / 4, .2, HAT, base + (10 if st in (0, 8) else 0)) for st in HAT_STEPS]
    if roll:
        a, b, step = roll
        out = [h for h in out if not (bar + a <= h[0] < bar + b)]
        t, i = bar + a, 0
        while t < bar + b - 1e-6:
            out.append(n(round(t, 4), .15, HAT, base + 6 + 4 * i))
            t += step
            i += 1
    return out


def drill_bar(bar, variant, roll=None):
    """Caisse claire sur le 3e temps + frappe décalée ; kick qui suit le 808."""
    d = [n(bar, .25, KICK, 116), n(bar + 2, .25, SNARE, 112), n(bar + 2, .25, GROUP_CLAP, 100)]
    if variant == "A":
        d += [n(bar + 2.75, .25, KICK, 98), n(bar + 3.75, .25, SNARE, 96)]
    else:
        d += [n(bar + 1.5, .25, KICK, 98), n(bar + 3.25, .25, SNARE, 100), n(bar + 3.25, .25, TAMPON, 96)]
    return d + drill_hats(bar, roll)


def final_hit(t):
    return [n(t, .25, KICK, 124), n(t, .25, TAMPON, 120), n(t, .25, GROUP_CLAP, 112)]


# --------------------------------------------------------------------------
# Les deux propositions
# --------------------------------------------------------------------------
def cue_logo():
    lead = trap.name_motif(0, 104, ment=3)
    changes = [(0, "Db", 2), (2, "Eb", 2)]
    final = [(4, "Fm", 7)]
    drums = [n(0, .25, KICK, 112), n(2, .25, SNARE, 110), n(2, .25, GROUP_CLAP, 98), n(3.25, .25, SNARE, 96)]
    drums += drill_hats(0, roll=(3, 4, 1 / 6)) + final_hit(4)
    bass = [n(0, .75, "Db2", 110), n(.75, .5, "Db3", 100), n(1.25, .75, "Db2", 108),
            n(2, .75, "Eb2", 110), n(2.75, .5, "Eb3", 100), n(3.25, .75, "Eb2", 108),
            n(4, 2, "F2", 122), n(6, 5, "F1", 116)]
    return dict(
        name="logo", title="Ville et Engagement (drill) - logo", length=5.0, fade=0.9,
        markers=[(0, "Ville et Engagement"), (4, "Cloche + 808")],
        tracks={
            VOICE: cb.voices(lead),
            PIANO: gen.transpose(lead, 12, 0.85),
            STRINGS: gen.strings(changes + final, 70),
            B808: bass,
            TOWN_BELL: [n(4, 4, "F4", 120), n(6, 4, "F4", 84)],
            DRUMS: drums,
        })


def cue_jingle():
    lead = trap.name_motif(0, 96, ment=2) + trap.name_motif(8, 106, ment=2)
    answer_1 = [n(6, .5, "Ab5", 96), n(6.5, .5, "Gb5", 90), n(7, .25, "F5", 92), n(7.25, .25, "Gb5", 96)]
    answer_2 = [n(14, .5, "Ab5", 100), n(14.5, .5, "Gb5", 94), n(15, .5, "E5", 98),
                n(15.5, .25, "G5", 100), n(15.75, .25, "E5", 104)]
    changes = [(0, "Db", 2), (2, "Eb", 2), (4, "Fm", 2), (6, "Gb", 1.5),
               (8, "Db", 2), (10, "Eb", 2), (12, "Fm", 2), (14, "Gb", 1), (15, "C", 1)]
    final = [(16, "Fm", 4)]

    drums = [h for h in drill_hats(0, base=40)] + drill_hats(4, roll=(6 - 4, 7.5 - 4, 1 / 6), base=50)
    drums += [n(4, .25, KICK, 104), n(4, .25, TAMPON, 104), n(4, 3.5, RISER, 100)]
    drums += drill_bar(8, "A", roll=(3, 3.5, 1 / 6)) + drill_bar(12, "B", roll=(3.5, 4, .125))
    drums += final_hit(16)

    bass = [n(4, 1.5, "F2", 104), n(5.5, .5, "F3", 96), n(6, 1.5, "F2", 102),
            n(8, .75, "Db2", 118), n(8.75, .5, "Db3", 104), n(9.25, .75, "Db2", 112),
            n(10, .75, "Eb2", 116), n(10.75, .5, "Eb2", 104), n(11.25, .75, "Gb2", 110),
            n(12, .75, "F2", 118), n(12.75, .25, "F3", 104), n(13, 1, "F2", 112),
            n(14, 1, "Gb2", 112), n(15, .75, "C2", 112), n(15.75, .25, "E2", 104),
            n(16, 2, "F2", 124), n(18, 2.5, "F1", 116)]
    return dict(
        name="jingle", title="Ville et Engagement (drill) - jingle", length=8.6, fade=0.9,
        mute=[(7.5, 8)],
        markers=[(0, "Intro"), (4, "Montee"), (8, "Drop"), (14, "Reponse piano"), (16, "Cloche + 808")],
        tracks={
            VOICE: cb.voices(lead),
            PIANO: gen.transpose(lead, 12, 0.85) + answer_1 + answer_2,
            STRINGS: gen.strings(changes + final, 68),
            B808: bass,
            TOWN_BELL: [n(16, 4, "F4", 122), n(18, 3, "F4", 86)],
            DRUMS: drums,
        })


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle), 1):
        cue = gen.dedupe(build())
        words, vowels = trap.syllable_map([x for x in cue["tracks"][VOICE] if x[2] >= note("C4")])
        cb.CURRENT_VOWELS.clear()
        cb.CURRENT_VOWELS.update(vowels)
        base = f"{i:02d}_VilleEtEngagement_drill_{cue['name']}_{gen.BPM}bpm_Fm"
        mid_path = os.path.join(HERE, "midi", base + ".mid")
        gen.write_midi(cue, mid_path)
        cb.add_lyrics(mid_path, words)
        mix, stems, lufs, peak = gen.render_cue(cue)
        for a, b in cue.get("mute", []):
            g = trap.mute_envelope(len(mix), a, b)
            mix = mix * g[:, None]
            stems = {k: v * g[:, None] for k, v in stems.items()}
        sdir = os.path.join(HERE, "stems", base)
        os.makedirs(sdir, exist_ok=True)
        for j, (name, *_rest) in enumerate(gen.TRACKS, 1):
            fname = f"{j}_{name.replace(' - ', '_').replace('(', '').replace(')', '').replace(' ', '_')}.wav"
            gen.write_wav(os.path.join(sdir, fname), stems[name], 24)
        wav = os.path.join(HERE, "maquettes", base + ".wav")
        gen.write_wav(wav, mix, 24)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame",
                        "-b:a", "320k", wav[:-4] + ".mp3"], check=True)
        print(f"{base}: {cue['length']:.1f} s, {lufs:.1f} LUFS, crête {peak:.1f} dBFS")


if __name__ == "__main__":
    main()
