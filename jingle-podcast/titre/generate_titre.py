#!/usr/bin/env python3
"""« Ville et Engagement » : essai centré uniquement sur le titre (sans cloche, sans référence à la mairie).

Le titre raconte un mouvement :
  - « Ville »       : la pulsation urbaine, un groove trap à 140 BPM, des cuivres synthétiques en 3-3-2 ;
  - « Engagement »  : une montée marche par marche, en – ga – ge – MENT sur sol – lab – sib – DO ;
  - « et »          : le lien, du mineur (fa mineur, la ville, le sérieux) au majeur (fa majeur, l'espoir).
La voix conclut elle-même : le dernier « -MENT » se pose sur l'accord de fa majeur.

Usage : python3 generate_titre.py
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
from generate import n, hz, SR  # noqa: E402

gen.BPM = 140
gen.BEAT = 60.0 / gen.BPM
gen.KEY = "Fm"

KICK, SNARE, HAT, OHAT, CRASH = gen.KICK, gen.SNARE, gen.HAT, trap.OHAT, gen.CRASH
CLAP = cb.GROUP_CLAP

VOICE = cb.VOICE
PIANO = "Piano (melodie)"
BRASS = "Cuivres synthe"
PAD = "Nappe"
B808 = trap.B808  # « 808 », rendu par la version trap
DRUMS = "Batterie"

# Accords : cuivres (médium), nappe, fondamentale du 808
CHORDS = {
    "Fm": (["F3", "Ab3", "C4"], ["F2", "C3", "Ab3"], "F2"),
    "Eb": (["Eb3", "G3", "Bb3"], ["Eb2", "Bb2", "G3"], "Eb2"),
    "Db": (["Db3", "F3", "Ab3"], ["Db2", "Ab2", "F3"], "Db2"),
    "C": (["C3", "E3", "G3"], ["C2", "G2", "E3"], "C2"),
    "C7": (["C3", "E3", "Bb3"], ["C2", "G2", "E3"], "C2"),
    "F": (["F3", "A3", "C4"], ["F2", "C3", "A3"], "F2"),  # le majeur final : l'espoir
}
gen.CHORDS = {k: (None, v[1], v[2], None) for k, v in CHORDS.items()}

gen.TRACKS = [
    (VOICE, 0, 52, 100, 64),
    (PIANO, 1, 0, 88, 56),
    (BRASS, 2, 61, 96, 46),
    (PAD, 3, 48, 76, 80),
    (B808, 4, 38, 108, 64),
    (DRUMS, 9, 0, 108, 64),
]

VOWEL_OF = {"Vil": "i", "le et": "e", "en": "an", "ga": "a", "ge": "e", "ment": "an"}


# --------------------------------------------------------------------------
# Le motif du titre : (début, durée, note, vélocité, syllabe)
# --------------------------------------------------------------------------
def ville_et(t0, vel=100):
    """« Vil-le et » : appel sur la quarte (do – fa)."""
    return [(t0, 1.5, "C4", vel, "Vil"), (t0 + 1.5, .5, "F4", vel - 10, "le et")]


def engagement(t0, vel=100, notes=("G4", "Ab4", "Bb4", "C5"), ment=1.5):
    """« en-ga-ge-MENT » : quatre marches qui montent, la dernière accentuée."""
    en, ga, ge, ment_note = notes
    return [(t0, .5, en, vel - 8, "en"), (t0 + .5, .5, ga, vel - 6, "ga"),
            (t0 + 1, .5, ge, vel - 2, "ge"), (t0 + 1.5, ment, ment_note, vel + 10, "ment")]


def split(lead):
    notes = [n(s, d, p, v) for s, d, p, v, _ in lead]
    words = {float(s): w for s, d, p, v, w in lead}
    vowels = {float(s): VOWEL_OF[w] for s, d, p, v, w in lead}
    return notes, words, vowels


# --------------------------------------------------------------------------
# Cuivres synthétiques
# --------------------------------------------------------------------------
def inst_brass(p, dur, vel):
    """Cuivres synthé : dents de scie, filtre qui s'ouvre à l'attaque (« bwah »), puis se referme un peu."""
    f = hz(p)
    t = np.arange(int((dur + 0.25) * SR)) / SR
    fc = 500 + (1200 + 1800 * vel / 127) * np.clip(t / 0.04, 0, 1) * (0.55 + 0.45 * np.exp(-t / 0.25))
    out = 0
    for det in (-0.004, 0.0, 0.004):
        ff = f * (1 + det)
        phase = 2 * np.pi * ff * t
        for k in range(1, 30):
            if k * ff > SR * 0.45:
                break
            out = out + (1 / k) / np.sqrt(1 + (k * ff / fc) ** 4) * np.sin(k * phase)
    return out / 3 * gen.adsr(len(t), dur, 0.018, 0.15, 0.75, 0.12)


def brass_part(changes, vel=92):
    """Rythme urbain 3-3-2 : frappes sur 0, 0,75 et 1,5 de chaque accord de 2 temps."""
    out = []
    for start, name, length in changes:
        voicing = CHORDS[name][0]
        hits = [(0, .45, vel), (.75, .45, vel - 14), (1.5, .4, vel - 6)] if length == 2 else [(0, length, vel + 6)]
        for off, d, v in hits:
            out += [n(start + off, d, p, v) for p in voicing]
    return out


gen.MIX = {
    VOICE: (None, 0.34, 0.0, 0.45),
    PIANO: (gen.inst_piano_melody, 0.13, -0.15, 0.35),
    BRASS: (inst_brass, 0.15, -0.3, 0.30),
    PAD: (gen.inst_strings, 0.18, 0.3, 0.55),
    B808: (None, 0.13, 0.0, 0.0),
    DRUMS: (trap.inst_drums, 0.30, 0.0, 0.10),
}


def bar_groove(bar, roll=None, full=True):
    d = [n(bar, .25, KICK, 116), n(bar + 1.5, .25, KICK, 94)]
    if full:
        d += trap.snare(bar + 2, 108)
    d += trap.hats(bar, bar + (roll[0] if roll else 4), .5, 56)
    if roll:
        d += trap.hats(bar + roll[0], bar + 4, roll[1], 62, 104)
    return d


def final_hit(t, length):
    return [n(t, .25, KICK, 124), n(t, .25, SNARE, 110), n(t, .25, CLAP, 108), n(t, length, CRASH, 104)]


# --------------------------------------------------------------------------
# Les trois formats
# --------------------------------------------------------------------------
def cue_logo():
    lead = ville_et(0, 102) + engagement(2, 102, ("G4", "A4", "Bb4", "C5"), ment=0)[:3]
    lead += [(4, 3, "C5", 114, "ment")]
    changes = [(0, "Fm", 2), (2, "C7", 2)]
    final = [(4, "F", 7)]
    drums = [n(0, .25, KICK, 112), n(1.5, .25, KICK, 92)] + trap.snare(2, 104)
    drums += trap.hats(0, 3, .5, 54) + trap.hats(3, 4, .125, 62, 104) + final_hit(4, 6)
    bass = [n(0, 2, "F2", 108), n(2, 2, "C2", 108), n(4, 6, "F2", 120)]
    return lead, dict(
        name="logo", title="Ville et Engagement (titre) - logo", length=5.0, fade=1.0,
        markers=[(0, "Ville et"), (2, "Engagement"), (4, "Fa majeur")],
        tracks={
            BRASS: brass_part(changes + final),
            PAD: gen.strings(changes + final, 66),
            B808: bass,
            DRUMS: drums,
        })


def cue_jingle():
    lead = ville_et(0, 98) + engagement(2, 100, ment=2.5)               # MENT tenu sur Db
    lead += ville_et(8, 104) + engagement(10, 106, ment=2.5)
    lead += engagement(14, 108, ("G4", "A4", "Bb4", "C5"), ment=0)[:3]  # la montée passe au majeur (la bécarre)
    lead += [(16, 3.5, "C5", 118, "ment")]
    changes = [(0, "Fm", 2), (2, "Eb", 2), (4, "Db", 2), (6, "C", 2),
               (8, "Fm", 2), (10, "Eb", 2), (12, "Db", 2), (14, "C7", 2)]
    final = [(16, "F", 4)]
    drums = bar_groove(0, full=False) + bar_groove(4, roll=(3, 1 / 6), full=False)
    drums += [n(4, .25, SNARE, 90)]
    drums += bar_groove(8) + bar_groove(12, roll=(3, .125)) + [n(13.5, .5, OHAT, 74)]
    drums += final_hit(16, 4)
    bass = [n(0, 1.5, "F2", 108), n(1.5, .5, "F2", 94), n(2, 2, "Eb2", 108),
            n(4, 2, "Db2", 108), n(6, 1.5, "C2", 106), n(7.5, .5, "C2", 96),
            n(8, 1.5, "F2", 116), n(9.75, .25, "F2", 100), n(10, 1.5, "Eb2", 114), n(11.5, .5, "Eb2", 102),
            n(12, 2, "Db2", 116), n(14, 1.5, "C2", 114), n(15.5, .5, "E2", 104),
            n(16, 4, "F2", 124)]
    return lead, dict(
        name="jingle", title="Ville et Engagement (titre) - jingle", length=8.6, fade=1.0,
        markers=[(0, "Ville et"), (2, "Engagement"), (8, "Ville et (2)"), (10, "Engagement (2)"),
                 (14, "Montee en majeur"), (16, "Fa majeur")],
        tracks={
            BRASS: brass_part(changes + final),
            PAD: gen.strings(changes + final, 64),
            B808: bass,
            DRUMS: drums,
        })


def cue_jingle_court():
    """Le jingle, qui s'éteint en fondu après le premier « -MENT » (temps 6)."""
    lead, cue = cue_jingle()
    cut = 6
    lead = [x for x in lead if x[0] < cut]
    for name, notes in cue["tracks"].items():
        cue["tracks"][name] = [x for x in notes if x[0] < cut]
    cue.update(name="jingle-court", title="Ville et Engagement (titre) - jingle court en fondu",
               length=cut * gen.BEAT + 1.0, fade=1.2,
               markers=[(0, "Ville et"), (2, "Engagement"), (cut, "Fondu")])
    return lead, cue


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle, cue_jingle_court), 1):
        lead, cue = build()
        notes, words, vowels = split(lead)
        cue["tracks"][VOICE] = cb.voices(notes)
        cue["tracks"][PIANO] = notes
        cue = gen.dedupe(cue)
        cb.CURRENT_VOWELS.clear()
        cb.CURRENT_VOWELS.update(vowels)
        base = f"{i:02d}_VilleEtEngagement_titre_{cue['name']}_{gen.BPM}bpm_Fm-F"
        mid_path = os.path.join(HERE, "midi", base + ".mid")
        gen.write_midi(cue, mid_path)
        cb.add_lyrics(mid_path, words)
        mix, stems, lufs, peak = gen.render_cue(cue)
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
