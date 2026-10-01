#!/usr/bin/env python3
"""« Ville et Engagement », version « petite conversation » : ludique, rapide, complice.

Dans l'esprit des formats d'interview web décontractés (sans reprendre aucune musique existante) :
  - 118 BPM, groove funk léger avec un peu de swing sur les doubles croches ;
  - mélodie sifflée, nouvelle : sept notes bavardes sur le rythme du titre
    « Vil-le et en-ga-ge-MENT » (do – la – do – ré – FA – mi – do) ;
  - guitare funky (accords secs + grattés étouffés), clavinet, basse funky avec approches chromatiques ;
  - batterie sèche, claquements de doigts, shaker ; fin sur un accord court et pétillant (F6/9).
Aucune cloche, aucune percussion métallique, pas de chœur.

Usage : python3 generate_small_talk.py
"""

import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
for sub in ("", "carte-blanche"):
    sys.path.insert(0, os.path.join(ROOT, sub))
import generate as gen  # noqa: E402
import generate_carte_blanche as cb  # noqa: E402  (pour les paroles dans le MIDI)
from generate import n, note, band, noise, hz, SR  # noqa: E402

gen.BPM = 118
gen.BEAT = 60.0 / gen.BPM
gen.KEY = "F"

WHISTLE = "Sifflement (melodie)"
GUITAR = "Guitare funky"
CLAV = "Clavinet"
BASS = "Basse funky"
DRUMS = "Batterie - Claquements - Shaker"

KICK, SNARE, SNAP, SHAKER = 36, 38, 39, 70  # 39 = claquement (hand clap en GM), 70 = maracas
SCRATCH_VEL = 30  # en dessous : accord gratté étouffé (convention guitare)
SWING = 0.035  # retard des doubles croches « faibles », en temps

gen.TRACKS = [
    (WHISTLE, 0, 78, 100, 64),
    (GUITAR, 1, 28, 92, 84),
    (CLAV, 2, 7, 88, 40),
    (BASS, 3, 36, 104, 64),
    (DRUMS, 9, 0, 104, 64),
]

# Accords : guitare (médium-aigu), clavinet (médium), fondamentale de la basse, quinte
CHORDS = {
    "Fmaj7": (["E4", "A4", "C5"], ["A3", "C4", "E4"], "F2", "C3"),
    "Dm7": (["F4", "A4", "C5"], ["F3", "A3", "C4"], "D2", "A2"),
    "Gm7": (["F4", "Bb4", "D5"], ["F3", "Bb3", "D4"], "G2", "D3"),
    "C7": (["E4", "G4", "Bb4"], ["E3", "G3", "Bb3"], "C2", "G2"),
    "F69": (["F4", "A4", "D5", "G5"], ["A3", "D4", "G4"], "F2", "C3"),
}

HOOK_WORDS = ["Vil", "le", "et", "en", "ga", "ge", "ment"]


# --------------------------------------------------------------------------
# Mélodie sifflée (début, durée, note, vélocité)
# --------------------------------------------------------------------------
def hook(t0, vel=100):
    """Vil-le et en-ga-ge-MENT : do – la – do – ré – FA – mi – do, en doubles croches bavardes."""
    cells = [(0, .4, "C5", 0), (.75, .2, "A4", -14), (1, .2, "C5", -8), (1.5, .2, "D5", -6),
             (1.75, .6, "F5", 8), (2.5, .2, "E5", -8), (3, .7, "C5", 4)]
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in cells]


def answer(t0, vel=94):
    """Petite réponse sifflée sur Gm7 – C7, qui relance vers fa."""
    cells = [(.5, .2, "Bb4", 0), (.75, .2, "A4", -6), (1, .4, "G4", 2),
             (2, .2, "E4", -4), (2.25, .2, "G4", -2), (2.5, .2, "Bb4", 0), (2.75, .2, "C5", 2), (3, .4, "E5", 6)]
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in cells]


def climb(t0, vel=100):
    """Variante finale : la réponse monte jusqu'au sol, pour retomber sur le fa."""
    cells = [(0, .2, "Bb4", -6), (.25, .2, "D5", -4), (.5, .4, "F5", 4), (1, .2, "E5", -6), (1.25, .2, "D5", -8),
             (1.5, .4, "Bb4", 0), (2, .2, "G4", -4), (2.25, .2, "Bb4", -2), (2.5, .2, "C5", 0), (2.75, .2, "E5", 2),
             (3, .45, "G5", 8)]
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in cells]


# --------------------------------------------------------------------------
# Instruments
# --------------------------------------------------------------------------
def render_whistle(notes, total_s, gain, send):
    """Sifflement : sinusoïde pure + souffle, petits glissés entre notes liées, vibrato léger sur les notes tenues."""
    nsamp = int((total_s + 3) * SR)
    freq, amp = np.zeros(nsamp), np.zeros(nsamp)
    prev_f, prev_end = None, -9.0
    for s, d, p, v in sorted(notes):
        i0 = int(s * gen.BEAT * SR)
        held = d * gen.BEAT
        seg = np.arange(min(i0 + int((held + 0.08) * SR), nsamp) - i0) / SR
        f = hz(p)
        if prev_f is not None and s - prev_end < 0.35:
            fcurve = f + (prev_f - f) * np.exp(-seg / 0.018)  # glissé entre deux notes rapprochées
        else:
            fcurve = f * (1 - 0.03 * np.exp(-seg / 0.03))  # petite attaque par en dessous
        vib = 1 + 0.006 * np.sin(2 * np.pi * 6 * seg) * np.clip((seg - 0.18) / 0.1, 0, 1)
        freq[i0:i0 + len(seg)] = fcurve * vib
        env = np.clip(seg / 0.012, 0, 1) * np.where(seg > held, np.exp(-(seg - held) / 0.025), 1)
        amp[i0:i0 + len(seg)] = np.maximum(amp[i0:i0 + len(seg)], env * (v / 127) ** 1.3)
        prev_f, prev_end = f, s + d
    phase = 2 * np.pi * np.cumsum(freq) / SR
    tone = np.sin(phase) + 0.04 * np.sin(2 * phase)
    breath = band(noise(nsamp), 1500, 5000) * 0.05
    y = (tone + breath) * amp * gain
    buf = np.stack([y, y], axis=1)
    wet = np.stack([gen.fftconvolve(buf[:, c], gen.IR[:, c])[: len(buf)] for c in range(2)], axis=1)
    return buf + wet * send * 0.25


def karplus(f, total, damping):
    period = max(int(round(SR / f - 0.5)), 2)
    y = np.zeros(total + period)
    y[:period] = band(noise(period * 4), hi=5000)[-period:]
    k = period
    while k < total:
        prev = y[k - period:k]
        shifted = np.concatenate([[y[k - period - 1] if k - period - 1 >= 0 else 0.0], prev[:-1]])
        y[k:k + period] = 0.5 * (prev + shifted) * damping
        k += period
    ratio = (SR / (period + 0.5)) / f
    return np.interp(np.arange(total) / ratio, np.arange(len(y)), y, right=0.0)


def inst_guitar(p, dur, vel):
    """Guitare électrique claire, jeu funk : notes courtes, étouffées par la main droite."""
    if vel < SCRATCH_VEL:  # gratté étouffé : juste le bruit des cordes
        t = np.arange(int(0.05 * SR)) / SR
        return band(noise(len(t)), 1200, 5000) * np.exp(-t / 0.012) * 0.6
    total = int((dur + 0.08) * SR)
    t = np.arange(total) / SR
    y = karplus(hz(p), total, 0.994)
    return y * np.where(t > dur, np.exp(-(t - dur) / 0.015), 1)


def inst_clav(p, dur, vel):
    """Clavinet : onde pulsée étroite, filtre qui claque à l'attaque, son percussif."""
    f = hz(p)
    t = np.arange(int((dur + 0.06) * SR)) / SR
    fc = 900 + 3500 * np.exp(-t / 0.03)
    phase = 2 * np.pi * f * t
    out = np.zeros_like(t)
    for k in range(1, 40):
        if k * f > SR * 0.45:
            break
        out += np.sin(np.pi * k * 0.2) / k / np.sqrt(1 + (k * f / fc) ** 4) * np.sin(k * phase)
    env = np.exp(-t / 0.25) * np.clip(t / 0.001, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.01), 1)
    return out * env


def inst_bass(p, dur, vel):
    """Basse funky : attaque claquée (filtre très rapide), son rond ensuite."""
    f = hz(p)
    t = np.arange(int((dur + 0.05) * SR)) / SR
    fc = 260 + 2600 * np.exp(-t / 0.022)
    phase = 2 * np.pi * f * t
    out = np.zeros_like(t)
    for k in range(1, 40):
        if k * f > 7000:
            break
        out += (1 / k) / np.sqrt(1 + (k * f / fc) ** 4) * np.sin(k * phase)
    out += 0.6 * np.sin(phase)
    env = np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.5) * np.where(t > dur, np.exp(-(t - dur) / 0.012), 1)
    return out * env


def inst_drums(p, dur, vel):
    if p == KICK:  # grosse caisse sèche et ronde
        t = np.arange(int(0.3 * SR)) / SR
        f = 55 + 120 * np.exp(-t / 0.018)
        return np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11))
    if p == SNARE:  # caisse claire serrée
        t = np.arange(int(0.2 * SR)) / SR
        return np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.03) * 0.6 + band(noise(len(t)), 1800, 9000) * np.exp(-t / 0.06)
    if p == SNAP:  # claquement de doigts : clic sec + petit souffle aigu
        t = np.arange(int(0.12 * SR)) / SR
        click = band(noise(len(t)), 1800, 4500) * np.exp(-t / 0.006) * 1.4
        tail = band(noise(len(t)), 3500, 9000) * np.exp(-t / 0.025) * 0.4
        return click + tail
    if p == SHAKER:
        t = np.arange(int(0.09 * SR)) / SR
        env = np.clip(t / 0.012, 0, 1) * np.exp(-t / 0.03)
        return band(noise(len(t)), 4500, 11000) * env * 0.6
    return np.zeros(1)


gen.MIX = {
    WHISTLE: (None, 0.30, 0.0, 0.35),
    GUITAR: (inst_guitar, 0.72, 0.45, 0.20),
    CLAV: (inst_clav, 0.40, -0.45, 0.15),
    BASS: (inst_bass, 0.29, 0.0, 0.0),
    DRUMS: (inst_drums, 0.79, 0.0, 0.08),
}
DRUM_PANS = {SHAKER: 0.35, SNAP: -0.15}

_render_track = gen.render_track


def render_track(name, notes, total_s):
    if name == WHISTLE:
        _, gain, _, send = gen.MIX[name]
        return render_whistle(notes, total_s, gain, send)
    if name == DRUMS:  # comme generate.render_track, avec un panoramique par élément
        buf = np.zeros((int((total_s + 3) * SR), 2))
        for s, d, p, v in notes:
            x = inst_drums(p, d * gen.BEAT, v) * (v / 127) ** 1.6 * gen.MIX[name][1]
            theta = (DRUM_PANS.get(p, 0.0) + 1) * np.pi / 4
            i0 = int(round(s * gen.BEAT * SR))
            i1 = min(i0 + len(x), len(buf))
            buf[i0:i1, 0] += x[: i1 - i0] * np.cos(theta)
            buf[i0:i1, 1] += x[: i1 - i0] * np.sin(theta)
        wet = np.stack([gen.fftconvolve(buf[:, c], gen.IR[:, c])[: len(buf)] for c in range(2)], axis=1)
        return buf + wet * gen.MIX[name][3] * 0.25
    return _render_track(name, notes, total_s)


gen.render_track = render_track


# --------------------------------------------------------------------------
# Accompagnement
# --------------------------------------------------------------------------
def guitar_part(changes, vel=90):
    """Accords secs sur les contretemps, grattés étouffés sur les doubles croches autour."""
    out = []
    for start, name, length in changes:
        voicing = CHORDS[name][0]
        if length >= 4:
            out += [n(start + i * .02, .6, p, vel + 6) for i, p in enumerate(voicing)]  # accord final, légèrement arpégé
            continue
        for b in range(int(length)):
            out += [n(start + b + .5, .18, p, vel - (0 if b % 2 else 8)) for p in voicing]
            out += [n(start + b + off, .05, p, v) for off, v in ((.25, 24), (.75, 20)) for p in voicing[:1]]
    return out


def clav_part(changes, vel=86):
    out = []
    for start, name, length in changes:
        voicing = CHORDS[name][1]
        hits = [(0, .2), (.75, .15), (1.25, .2)] if length == 2 else [(0, .5)]
        for off, d in hits:
            out += [n(start + off, d, p, vel - (10 if off else 0)) for p in voicing]
    return out


def bass_part(changes, vel=104):
    """Fondamentale, octave qui saute, quinte, et approche chromatique vers l'accord suivant."""
    out = []
    for idx, (start, name, length) in enumerate(changes):
        root, fifth = note(CHORDS[name][2]), note(CHORDS[name][3])
        if length >= 4:
            out.append(n(start, .5, root, vel + 8))
            continue
        nxt = note(CHORDS[changes[idx + 1][1]][2]) if idx + 1 < len(changes) else root
        out += [n(start, .3, root, vel), n(start + .5, .2, root, vel - 18), n(start + .75, .2, root + 12, vel - 6),
                n(start + 1.25, .2, fifth, vel - 12), n(start + 1.5, .25, root, vel - 8),
                n(start + 1.75, .2, nxt - 1, vel - 14)]
    return out


def groove(bar, fill=False):
    d = [n(bar, .25, KICK, 112), n(bar + 1.75, .25, KICK, 92), n(bar + 2.5, .25, KICK, 100)]
    d += [n(bar + 1, .25, SNARE, 100), n(bar + 3, .25, SNARE, 104), n(bar + 1, .25, SNAP, 96), n(bar + 3, .25, SNAP, 100)]
    d += [n(bar + i * .25, .1, SHAKER, 70 if i % 2 == 0 else 50) for i in range(16)]
    if fill:  # petite relance de caisse claire
        d += [n(bar + 3.5, .25, SNARE, 84), n(bar + 3.75, .25, SNARE, 96)]
    return d


def final_stab(t):
    return [n(t, .25, KICK, 120), n(t, .25, SNARE, 106), n(t, .25, SNAP, 104)]


def swing(cue):
    """Léger swing : les doubles croches faibles (0,25 et 0,75 de chaque temps) arrivent un peu en retard."""
    for name, notes in cue["tracks"].items():
        cue["tracks"][name] = [(s + SWING if abs((s * 4) % 2 - 1) < 1e-6 else s, d, p, v) for s, d, p, v in notes]
    return cue


# --------------------------------------------------------------------------
# Les trois formats
# --------------------------------------------------------------------------
def cue_logo():
    changes = [(0, "Fmaj7", 2), (2, "Dm7", 2), (4, "Gm7", 2), (6, "C7", 2)]
    final = [(8, "F69", 4)]
    lead = hook(0, 102) + answer(4) + [n(8, .6, "F5", 108)]
    drums = groove(0) + groove(4, fill=True) + final_stab(8)
    return dict(
        name="logo", title="Ville et Engagement (petite conversation) - logo", length=5.0, fade=0.5,
        markers=[(0, "Vil-le et en-ga-ge-ment"), (4, "Reponse"), (8, "Final")],
        tracks={WHISTLE: lead, GUITAR: guitar_part(changes + final), CLAV: clav_part(changes + final),
                BASS: bass_part(changes + final), DRUMS: drums},
        words=HOOK_WORDS)


def cue_jingle():
    changes = [(0, "Fmaj7", 2), (2, "Dm7", 2), (4, "Gm7", 2), (6, "C7", 2),
               (8, "Fmaj7", 2), (10, "Dm7", 2), (12, "Gm7", 2), (14, "C7", 2)]
    final = [(16, "F69", 4)]
    lead = hook(0, 100) + answer(4) + hook(8, 104) + climb(12) + [n(16, .6, "F5", 110)]
    drums = groove(0) + groove(4) + groove(8) + groove(12, fill=True) + final_stab(16)
    return dict(
        name="jingle", title="Ville et Engagement (petite conversation) - jingle", length=8.6, fade=0.4,
        markers=[(0, "Vil-le et en-ga-ge-ment"), (4, "Reponse"), (8, "Vil-le et en-ga-ge-ment (2)"),
                 (12, "Montee"), (16, "Final")],
        tracks={WHISTLE: lead, GUITAR: guitar_part(changes + final), CLAV: clav_part(changes + final),
                BASS: bass_part(changes + final), DRUMS: drums},
        words=HOOK_WORDS)


def cue_court():
    """Le motif une fois, puis un fondu juste après « -MENT »."""
    cue = cue_jingle()
    cut = 4
    for name, notes in cue["tracks"].items():
        cue["tracks"][name] = [x for x in notes if x[0] < cut]
    cue.update(name="jingle-court", title="Ville et Engagement (petite conversation) - jingle court en fondu",
               length=cut * gen.BEAT + 0.9, fade=1.0, markers=[(0, "Vil-le et en-ga-ge-ment"), (cut, "Fondu")])
    return cue


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle, cue_court), 1):
        cue = swing(gen.dedupe(build()))
        hook_starts = sorted(s for s, *_ in cue["tracks"][WHISTLE])
        words = {s: w for s, w in zip(hook_starts[:7], HOOK_WORDS)}  # paroles sur le premier énoncé du motif
        base = f"{i:02d}_VilleEtEngagement_petite-conversation_{cue['name']}_{gen.BPM}bpm_F"
        mid_path = os.path.join(HERE, "midi", base + ".mid")
        gen.write_midi(cue, mid_path)
        cb.VOICE = WHISTLE  # add_lyrics cible la piste de mélodie
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
