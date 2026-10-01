#!/usr/bin/env python3
"""« Ville et Engagement », trap chaleureuse.

Même construction que la version trap retenue (../trap) : groove continu, le nom chanté deux fois,
cloche de mairie finale, et une version courte qui s'éteint en fondu après « GE-MENT ».
Ce qui la rend plus chaleureuse :
  - fa majeur et accords enrichis (Bbmaj7 – C6/9 – Fmaj9 – Am7 – Dm9) au lieu de fa mineur ;
  - piano électrique (type Rhodes) et guitare pincée au lieu de la cloche FM métallique ;
  - 808 rond (peu saturé, glissandos courts), batterie douce : mains au lieu de la caisse claire ;
  - 130 BPM, un peu plus posé ; plus de réverbération.

Usage : python3 generate_trap_chaleureux.py
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
from generate import n, note, band, noise, hz, SR  # noqa: E402

gen.BPM = 130
gen.BEAT = 60.0 / gen.BPM
gen.KEY = "F"

KICK, HAT = gen.KICK, gen.HAT
TAMPON, GROUP_CLAP = cb.TAMPON, cb.GROUP_CLAP

VOICE = cb.VOICE
GUITAR = "Guitare (melodie)"
RHODES = "Piano electrique"
PAD = "Nappe chaude"
B808 = "808 rond"
TOWN_BELL = trap.TOWN_BELL
DRUMS = "Batterie douce - Tampon - Mains"

# Accords : main droite du piano électrique, nappe, fondamentale du 808
CHORDS = {
    "Bbmaj7": (["D3", "F3", "A3", "C4"], ["Bb2", "F3", "A3"], "Bb1"),
    "C69": (["E3", "G3", "A3", "D4"], ["C3", "G3", "E4"], "C2"),
    "Fmaj9": (["A3", "C4", "E4", "G4"], ["F2", "C3", "A3"], "F2"),
    "Am7": (["G3", "C4", "E4"], ["A2", "E3", "C4"], "A1"),
    "Dm9": (["F3", "A3", "C4", "E4"], ["D3", "A3", "F4"], "D2"),
}
gen.CHORDS = {k: (None, v[1], v[2], None) for k, v in CHORDS.items()}

gen.TRACKS = [
    (VOICE, 0, 52, 100, 64),
    (GUITAR, 1, 24, 92, 80),
    (RHODES, 2, 4, 96, 48),
    (PAD, 3, 48, 76, 76),
    (B808, 4, 38, 106, 64),
    (TOWN_BELL, 5, 14, 96, 70),
    (DRUMS, 9, 0, 100, 64),
]

NAME_RHYTHM = [(0, 1.5, "C4", 0), (1.5, .5, "F4", -10), (2, 1, "G4", -6), (3, 1, "A4", -2)]


def name_motif(t0, vel=100, ment=2.0):
    """VIL – l'é – en – GA, puis GE-MENT sur le temps fort suivant (fa majeur)."""
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in NAME_RHYTHM] + [n(t0 + 4, ment, "C5", vel + 10)]


# --------------------------------------------------------------------------
# Sons chaleureux
# --------------------------------------------------------------------------
def inst_rhodes(p, dur, vel):
    """Piano électrique : lame FM douce + petite « cloche » d'attaque, trémolo léger."""
    f = hz(p)
    t = np.arange(int((dur + 0.6) * SR)) / SR
    index = (0.4 + 1.1 * vel / 127) * np.exp(-t / 0.35)
    tone = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    tine = 0.12 * np.sin(2 * np.pi * 7.1 * f * t) * np.exp(-t / 0.05)
    trem = 1 + 0.07 * np.sin(2 * np.pi * 4.5 * t)
    env = np.exp(-t / 1.6) * np.clip(t / 0.003, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.12), 1)
    return (tone + tine) * trem * env


def inst_guitar(p, dur, vel):
    """Guitare pincée (Karplus-Strong) : attaque douce, son boisé."""
    f = hz(p)
    period = max(int(round(SR / f - 0.5)), 2)
    total = int((dur + 1.2) * SR)
    y = np.zeros(total + period)
    y[:period] = band(noise(period * 4), hi=3500)[-period:] * 0.8
    k = period
    while k < total:
        prev = y[k - period:k]
        shifted = np.concatenate([[y[k - period - 1] if k - period - 1 >= 0 else 0.0], prev[:-1]])
        y[k:k + period] = 0.5 * (prev + shifted) * 0.996
        k += period
    # le retard entier (période + ½ échantillon du filtre) fausse la hauteur : on rééchantillonne pour la corriger
    ratio = (SR / (period + 0.5)) / f
    y = np.interp(np.arange(total) / ratio, np.arange(len(y)), y, right=0.0)
    t = np.arange(total) / SR
    return y * np.where(t > dur + 0.25, np.exp(-(t - dur - 0.25) / 0.1), 1)


def render_808_round(notes, total_s, gain):
    """808 rond : peu de saturation, glissandos courts entre notes liées."""
    nsamp = int((total_s + 3) * SR)
    freq, amp = np.zeros(nsamp), np.zeros(nsamp)
    prev_f, prev_end = None, -1.0
    for s, d, p, v in sorted(notes):
        i0, i1 = int(s * gen.BEAT * SR), int((s + d) * gen.BEAT * SR)
        seg = np.arange(min(i1 + int(0.06 * SR), nsamp) - i0) / SR
        f = hz(p)
        if prev_f is not None and s - prev_end < 0.05:
            fcurve = f + (prev_f - f) * np.exp(-seg / 0.03)
        else:
            fcurve = f * (1 + 0.3 * np.exp(-seg / 0.015))
        freq[i0:i0 + len(seg)] = fcurve
        held = d * gen.BEAT
        env = np.exp(-seg / 1.8) * np.clip(seg / 0.004, 0, 1)
        env = np.where(seg > held, env * np.exp(-(seg - held) / 0.03), env)
        amp[i0:i0 + len(seg)] = np.maximum(amp[i0:i0 + len(seg)], env * (v / 127) ** 1.2)
        prev_f, prev_end = f, s + d
    y = np.tanh(1.2 * np.sin(2 * np.pi * np.cumsum(freq) / SR)) * amp * gain
    return np.stack([y, y], axis=1)


def inst_drums(p, dur, vel):
    if p == KICK:  # grosse caisse ronde, sans clic
        t = np.arange(int(0.45 * SR)) / SR
        f = 50 + 80 * np.exp(-t / 0.03)
        return np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2))
    if p == HAT:  # charleston feutré
        t = np.arange(int(0.12 * SR)) / SR
        return band(noise(len(t)), 5000, 11000) * np.exp(-t / 0.02) * 0.5
    return cb.inst_drums(p, dur, vel)


gen.MIX = {
    VOICE: (None, 0.30, 0.0, 0.50),
    GUITAR: (inst_guitar, 0.62, 0.35, 0.45),
    RHODES: (inst_rhodes, 0.10, -0.3, 0.45),
    PAD: (gen.inst_strings, 0.12, 0.2, 0.60),
    B808: (None, 0.13, 0.0, 0.0),
    TOWN_BELL: (cb.inst_bell, 0.20, 0.15, 0.55),
    DRUMS: (inst_drums, 0.28, 0.0, 0.15),
}

_render_track = gen.render_track


def render_track(name, notes, total_s):
    if name == B808:
        return render_808_round(notes, total_s, gen.MIX[name][1])
    return _render_track(name, notes, total_s)


gen.render_track = render_track


# --------------------------------------------------------------------------
# Parties
# --------------------------------------------------------------------------
def rhodes_part(changes, vel=78):
    """Accords tenus, relancés sur le contretemps : une pulsation souple."""
    out = []
    for start, name, length in changes:
        voicing = CHORDS[name][0]
        if length == 2:
            out += [n(start, 1.25, p, vel) for p in voicing] + [n(start + 1.5, .5, p, vel - 16) for p in voicing]
        else:
            out += [n(start, length, p, vel + 4) for p in voicing]
    return out


def soft_bar(bar, last_roll=False):
    """Kick souple, mains sur le 3e temps, charleston en croches, tampon discret."""
    d = [n(bar, .25, KICK, 108), n(bar + 1.5, .25, KICK, 88), n(bar + 2, .25, GROUP_CLAP, 100)]
    d += trap.hats(bar, bar + (3 if last_roll else 4), .5, 50)
    if last_roll:
        d += trap.hats(bar + 3, bar + 4, 1 / 6, 50, 76)
    return d


def final_hit(t):
    return [n(t, .25, KICK, 118), n(t, .25, TAMPON, 112), n(t, .25, GROUP_CLAP, 106)]


def cue_logo():
    lead = name_motif(0, 102, ment=3)
    changes = [(0, "Bbmaj7", 2), (2, "C69", 2)]
    final = [(4, "Fmaj9", 7)]
    drums = [n(0, .25, KICK, 108), n(2, .25, GROUP_CLAP, 98)] + trap.hats(0, 3, .5, 48)
    drums += trap.hats(3, 4, 1 / 6, 48, 74) + final_hit(4)
    bass = [n(0, 2, "Bb1", 104), n(2, 2, "C2", 104), n(4, 6, "F2", 116)]
    return dict(
        name="logo", title="Ville et Engagement (trap chaleureuse) - logo", length=5.0, fade=1.0,
        markers=[(0, "Ville et Engagement"), (4, "Cloche")],
        tracks={
            VOICE: cb.voices(lead),
            GUITAR: gen.transpose(lead, 12, 0.85),
            RHODES: rhodes_part(changes + final),
            PAD: gen.strings(changes + final, 66),
            B808: bass,
            TOWN_BELL: [n(4, 4, "F4", 112), n(6, 4, "F4", 80)],
            DRUMS: drums,
        })


def cue_jingle():
    lead = name_motif(0, 98, ment=2) + name_motif(8, 104, ment=2)
    changes = [(0, "Bbmaj7", 2), (2, "C69", 2), (4, "Fmaj9", 2), (6, "Am7", 2),
               (8, "Bbmaj7", 2), (10, "C69", 2), (12, "Dm9", 2), (14, "C69", 2)]
    final = [(16, "Fmaj9", 4)]
    drums = soft_bar(0) + soft_bar(4, last_roll=True) + soft_bar(8) + soft_bar(12, last_roll=True)
    drums += [n(4, .25, TAMPON, 92), n(11.5, .25, TAMPON, 96), n(13.5, .25, GROUP_CLAP, 80)]
    drums += final_hit(16)
    bass = [n(0, 1.5, "Bb1", 104), n(1.5, .5, "Bb1", 90), n(2, 2, "C2", 104),
            n(4, 1.75, "F2", 108), n(5.75, .25, "F2", 94), n(6, 2, "A1", 104),
            n(8, 1.5, "Bb1", 110), n(9.75, .25, "Bb1", 96), n(10, 1.5, "C2", 110), n(11.5, .5, "C2", 98),
            n(12, 2, "D2", 110), n(14, 1.5, "C2", 108), n(15.5, .5, "E2", 100),
            n(16, 4, "F2", 118)]
    return dict(
        name="jingle", title="Ville et Engagement (trap chaleureuse) - jingle", length=9.6, fade=1.2,
        markers=[(0, "Ville et Engagement"), (8, "Ville et Engagement (2)"), (16, "Cloche")],
        tracks={
            VOICE: cb.voices(lead),
            GUITAR: gen.transpose(lead, 12, 0.85),
            RHODES: rhodes_part(changes + final),
            PAD: gen.strings(changes + final, 64),
            B808: bass,
            TOWN_BELL: [n(16, 4, "F4", 114), n(18, 3, "F4", 82)],
            DRUMS: drums,
        })


def cue_jingle_court():
    """Le jingle, qui s'éteint en fondu juste après « GE-MENT » (temps 6), comme la version trap."""
    cue = cue_jingle()
    for name, notes in cue["tracks"].items():
        cue["tracks"][name] = [x for x in notes if x[0] < trap.CUT_BEAT]
    cue.update(name="jingle-court", title="Ville et Engagement (trap chaleureuse) - jingle court en fondu",
               length=trap.CUT_BEAT * gen.BEAT + 1.0, fade=1.2,
               markers=[(0, "Ville et Engagement"), (4, "GE-MENT"), (trap.CUT_BEAT, "Fondu")])
    return cue


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle, cue_jingle_court), 1):
        cue = gen.dedupe(build())
        words, vowels = trap.syllable_map([x for x in cue["tracks"][VOICE] if x[2] >= note("C4")])
        cb.CURRENT_VOWELS.clear()
        cb.CURRENT_VOWELS.update(vowels)
        base = f"{i:02d}_VilleEtEngagement_trap-chaleureuse_{cue['name']}_{gen.BPM}bpm_F"
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
