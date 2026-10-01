#!/usr/bin/env python3
"""Logo sonore du podcast « engagement citoyen des élus et agents de mairie ».

Une seule partition (ci-dessous) sert à produire :
  - les fichiers MIDI multipistes (type 1) ;
  - les stems audio WAV par instrument (pour la multipiste d'Adobe Audition) ;
  - les maquettes mixées (WAV 24 bits + MP3).

Trois déclinaisons, toutes à 100 BPM en ré mineur, sur le même motif :
  - jingle  : logo sonore principal (9,8 s)
  - virgule : transition courte (3,0 s)
  - outro   : fin d'épisode (15,0 s)

Dépendances : numpy, scipy, mido, pyloudnorm, ffmpeg (pour le MP3).
Usage : python3 generate.py
"""

import os
import re
import subprocess

import mido
import numpy as np
import pyloudnorm
from scipy.signal import butter, fftconvolve, sosfilt

BPM = 100
BEAT = 60.0 / BPM  # 0,6 s
SR = 48000
PPQ = 480
KEY = "Dm"
OUT = os.path.dirname(os.path.abspath(__file__))
RNG = np.random.default_rng(2026)

_STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def note(name):
    """« Bb2 », « C#4 »… -> numéro MIDI (C4 = 60)."""
    letter, acc, octave = re.fullmatch(r"([A-G])([#b]?)(-?\d)", name).groups()
    return 12 * (int(octave) + 1) + _STEPS[letter] + {"#": 1, "b": -1, "": 0}[acc]


# Accords : main droite du piano, cordes graves, fondamentale de la basse, motif d'arpège
CHORDS = {
    "Dm": (["A3", "D4", "F4"], ["D3", "A3", "F4"], "D2", ["A4", "D5", "F5", "D5"]),
    "C": (["G3", "C4", "E4"], ["C3", "G3", "E4"], "C2", ["G4", "C5", "E5", "C5"]),
    "Bb": (["F3", "Bb3", "D4"], ["Bb2", "F3", "D4"], "Bb1", ["F4", "Bb4", "D5", "Bb4"]),
    "Gm": (["G3", "Bb3", "D4"], ["G2", "D3", "Bb3"], "G1", ["G4", "Bb4", "D5", "Bb4"]),
    "Asus4": (["A3", "D4", "E4"], ["A2", "E3", "D4"], "A1", ["A4", "D5", "E5", "D5"]),
    "A": (["A3", "C#4", "E4"], ["A2", "E3", "C#4"], "A1", ["A4", "C#5", "E5", "C#5"]),
    "Dm9": (["F3", "A3", "D4", "E4"], ["D3", "A3", "F4"], "D2", ["A4", "D5", "E5", "F5"]),
}

# Pistes : nom, canal MIDI, programme General MIDI, volume (CC7), pan (CC10)
TRACKS = [
    ("Melodie - Synth Lead", 0, 81, 100, 64),
    ("Arpege Synth", 1, 80, 76, 88),
    ("Piano", 2, 0, 92, 48),
    ("Cordes Graves", 3, 48, 80, 76),
    ("Basse Synth", 4, 38, 100, 64),
    ("Batterie", 9, 0, 105, 64),
]

# Batterie (General MIDI)
KICK, SNARE, CLAP, HAT, CRASH, FLOOR_TOM, LOW_TOM = 36, 38, 39, 42, 49, 41, 45


def n(start, dur, pitch, vel):
    return (float(start), float(dur), note(pitch) if isinstance(pitch, str) else pitch, int(vel))


# --------------------------------------------------------------------------
# Motif : montée la – ré – fa, puis mi – fa – LA ; la « signature » du podcast
# --------------------------------------------------------------------------
def motif(t0, vel=100, end=("A4", 1)):
    return [n(t0, .5, "A3", vel - 8), n(t0 + .5, .5, "D4", vel - 4),
            n(t0 + 1, 1, "F4", vel), n(t0 + 2, .5, "E4", vel - 10),
            n(t0 + 2.5, .5, "F4", vel - 6), n(t0 + 3, end[1], end[0], vel + 6)]


def answer(t0, vel=96):
    return [n(t0, .5, "F4", vel), n(t0 + .5, .5, "D4", vel - 8),
            n(t0 + 1, 1, "F4", vel), n(t0 + 2, .5, "G4", vel - 4),
            n(t0 + 2.5, .5, "F4", vel - 8), n(t0 + 3, 1, "E4", vel)]


def piano_part(changes, vel=80):
    """Croches régulières à la main droite (pulsation), octave de basse à la main gauche."""
    out = []
    for start, name, length in changes:
        rh, _, root, _ = CHORDS[name]
        r = note(root)
        out += [n(start, length, r, vel - 6), n(start, length, r + 12, vel - 12)]
        steps = int(length * 2) if length <= 2 else 1
        for i in range(steps):
            dur = .45 if length <= 2 else length
            v = vel - (0 if i % 2 == 0 else 18) - (6 if i % 4 == 2 else 0)
            out += [n(start + i * .5, dur, p, v) for p in rh]
    return out


def strings(changes, vel=72):
    return [n(s, l, p, vel) for s, name, l in changes for p in CHORDS[name][1]]


def bass_line(changes, vel=100):
    out = []
    for start, name, length in changes:
        root = note(CHORDS[name][2])
        if length <= 2:
            out += [n(start + i * .5, .42, root, vel - (0 if i % 2 == 0 else 20)) for i in range(int(length * 2))]
        else:
            out.append(n(start, length, root, vel + 8))
    return out


def arpeggio(changes, vel=70):
    out = []
    for start, name, length in changes:
        pat = CHORDS[name][3]
        out += [n(start + i * .5, .4, pat[i % 4], vel - (0 if i % 2 == 0 else 12)) for i in range(int(length * 2))]
    return out


def groove(bar_start, full=True):
    """Kick 1 / 2,5 / 3, caisse claire + clap sur 2 et 4, charleston en doubles croches discrètes."""
    d = [n(bar_start, .25, KICK, 112), n(bar_start + 1.5, .25, KICK, 90), n(bar_start + 2, .25, KICK, 108)]
    if full:
        d += [n(bar_start + 1, .25, SNARE, 104), n(bar_start + 3, .25, SNARE, 108),
              n(bar_start + 1, .25, CLAP, 80), n(bar_start + 3, .25, CLAP, 84)]
    d += [n(bar_start + i * .25, .2, HAT, 72 if i % 2 == 0 else 46) for i in range(16)]
    return d


def build_roll(start, beats, v0=56, v1=118):
    """Roulement caisse claire en doubles croches + toms graves en croches."""
    steps = int(beats * 4)
    d = [n(start + i * .25, .25, SNARE, v0 + (v1 - v0) * i / max(steps - 1, 1)) for i in range(steps)]
    d += [n(start + i * .5, .5, LOW_TOM if i % 2 == 0 else FLOOR_TOM, 90 + 6 * i) for i in range(int(beats * 2))]
    return d


def impact(t, length=4, vel=120):
    return [n(t, .25, KICK, vel), n(t, 1, FLOOR_TOM, vel - 10), n(t, length, CRASH, vel - 6)]


# --------------------------------------------------------------------------
# Les trois déclinaisons
# --------------------------------------------------------------------------
def dedupe(cue):
    """Une seule frappe par (temps, note) : garde la vélocité la plus forte."""
    for name, notes in cue["tracks"].items():
        best = {}
        for s, d, p, v in notes:
            if (s, p) not in best or v > best[(s, p)][3]:
                best[(s, p)] = (s, d, p, v)
        cue["tracks"][name] = sorted(best.values())
    return cue


def cue_jingle():
    changes = [(0, "Dm", 2), (2, "C", 2), (4, "Bb", 2), (6, "C", 2), (8, "Dm", 2), (10, "C", 2)]
    final = [(12, "Dm9", 4)]
    lead = motif(0) + answer(4) + motif(8, 104, end=("G4", .5)) + [n(11.5, .5, "A4", 104), n(12, 4, "D5", 112)]
    drums = impact(0, 2, 108) + groove(0) + groove(4) + groove(8) + build_roll(11, 1, 70, 116) + impact(12)
    return dict(
        name="jingle", title="Logo sonore", length=9.8, fade=0.6,
        markers=[(0, "Motif"), (4, "Reponse"), (8, "Motif (montee)"), (12, "Final")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Arpege Synth": arpeggio(changes),
            "Piano": piano_part(changes + final),
            "Cordes Graves": strings(changes + final),
            "Basse Synth": bass_line(changes + final),
            "Batterie": drums,
        })


def cue_virgule():
    changes = [(0, "Bb", 1), (1, "C", 1)]
    final = [(2, "Dm9", 2.5)]
    lead = [n(0, .5, "A3", 96), n(.5, .5, "D4", 100), n(1, .5, "F4", 104),
            n(1.5, .5, "A4", 108), n(2, 2.5, "D5", 112)]
    drums = [n(0, .25, KICK, 110), n(1, .25, KICK, 100)] + [n(i * .25, .2, HAT, 64 if i % 2 == 0 else 40) for i in range(4)]
    drums += build_roll(1, 1, 64, 112) + impact(2, 2.5)
    return dict(
        name="virgule", title="Virgule", length=3.0, fade=0.5,
        markers=[(0, "Motif"), (2, "Resolution")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Arpege Synth": arpeggio(changes, 66),
            "Piano": piano_part(changes + final, 84),
            "Cordes Graves": strings(changes + final, 70),
            "Basse Synth": bass_line(changes + final),
            "Batterie": drums,
        })


def cue_outro():
    changes = [(0, "Dm", 2), (2, "C", 2), (4, "Bb", 2), (6, "C", 2),
               (8, "Dm", 2), (10, "C", 2), (12, "Bb", 2), (14, "C", 2),
               (16, "Gm", 2), (18, "Asus4", 1), (19, "A", 1)]
    final = [(20, "Dm9", 4)]
    lead = motif(0, 88) + answer(4, 86) + motif(8, 102) + [
        n(12, .5, "F4", 100), n(12.5, .5, "G4", 94), n(13, 1, "A4", 100),
        n(14, .5, "G4", 96), n(14.5, .5, "A4", 100), n(15, 1, "C5", 106),
        n(16, .5, "Bb4", 100), n(16.5, .5, "A4", 94), n(17, 1, "G4", 98),
        n(18, .5, "A3", 96), n(18.5, .5, "D4", 100), n(19, .5, "E4", 104), n(19.5, .5, "A4", 108),
        n(20, 4, "D5", 112)]
    drums = groove(0, full=False) + groove(4, full=False) + impact(8, 2, 104) + groove(8) + groove(12)
    drums += [n(16, .25, KICK, 110), n(17, .25, SNARE, 100), n(17, .25, CLAP, 80), n(17.5, .25, KICK, 96)]
    drums += [n(16 + i * .25, .2, HAT, 66 if i % 2 == 0 else 42) for i in range(8)]
    drums += build_roll(18, 2, 52, 120) + impact(20)
    return dict(
        name="outro", title="Outro", length=15.0, fade=1.2,
        markers=[(0, "Motif (leger)"), (8, "Motif (plein)"), (16, "Montee"), (20, "Final")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Arpege Synth": arpeggio(changes),
            "Piano": piano_part(changes[:8], 70) + piano_part(changes[8:] + final, 84),
            "Cordes Graves": strings(changes + final, 68),
            "Basse Synth": bass_line(changes + final),
            "Batterie": drums,
        })


# --------------------------------------------------------------------------
# Export MIDI (type 1, une piste par instrument + piste tempo/marqueurs)
# --------------------------------------------------------------------------
def write_midi(cue, path):
    mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)
    conductor = mido.MidiTrack()
    conductor += [mido.MetaMessage("track_name", name=f"Podcast - {cue['title']}", time=0),
                  mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0),
                  mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0),
                  mido.MetaMessage("key_signature", key=KEY, time=0)]
    last = 0
    for beat, label in cue["markers"]:
        tick = int(beat * PPQ)
        conductor.append(mido.MetaMessage("marker", text=label, time=tick - last))
        last = tick
    mid.tracks.append(conductor)

    for name, ch, prog, vol, panv in TRACKS:
        tr = mido.MidiTrack()
        tr += [mido.MetaMessage("track_name", name=name, time=0),
               mido.Message("control_change", channel=ch, control=7, value=vol, time=0),
               mido.Message("control_change", channel=ch, control=10, value=panv, time=0)]
        if ch != 9:
            tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
        events = []
        for s, d, p, v in cue["tracks"][name]:
            events.append((int(round(s * PPQ)), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
            events.append((int(round((s + d) * PPQ)) - 1, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))
        events.sort(key=lambda e: (e[0], e[1]))
        last = 0
        for tick, _, msg in events:
            tr.append(msg.copy(time=tick - last))
            last = tick
        tr.append(mido.MetaMessage("end_of_track", time=0))
        mid.tracks.append(tr)
    mid.save(path)


# --------------------------------------------------------------------------
# Synthèse (instruments maison pour la maquette et les stems)
# --------------------------------------------------------------------------
def hz(p):
    return 440.0 * 2 ** ((p - 69) / 12)


def adsr(nsamp, held, a, d, s, r):
    t = np.arange(nsamp) / SR
    env = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = t > held
    level_at_release = np.interp(held, t, env) if held < t[-1] else s
    env[rel] = level_at_release * np.exp(-(t[rel] - held) / max(r / 4, 1e-4))
    return env


def additive(freq, t, amp_fn, n_harm, vib=None):
    phase = 2 * np.pi * np.cumsum(freq * (1 + (vib if vib is not None else 0))) / SR
    out = np.zeros_like(t)
    for k in range(1, n_harm + 1):
        if k * freq > SR * 0.45:
            break
        out += amp_fn(k) * np.sin(k * phase)
    return out


def lowpass_weight(k, freq, fc, order=2):
    return 1.0 / np.sqrt(1 + (k * freq / fc) ** (2 * order))


def inst_lead(p, dur, vel):
    """Synthé chaud : trois dents de scie légèrement désaccordées, filtre assez fermé."""
    f = hz(p)
    total = dur + 0.4
    t = np.arange(int(total * SR)) / SR
    vib = 0.0025 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.3) / 0.3, 0, 1)
    out = 0
    for det in (-0.005, 0.0, 0.006):
        ff = f * (1 + det)
        out = out + additive(ff, t, lambda k: (1 / k) * lowpass_weight(k, ff, 1900), 40, vib)
    out = out + 0.5 * np.sin(np.pi * np.cumsum(np.full_like(t, f)) / SR)  # octave grave, pour l'assise
    return out * adsr(len(t), dur, 0.014, 0.3, 0.8, 0.35) / 3


def inst_arp(p, dur, vel):
    """Pluck synthé feutré : la pulsation de la ville, en retrait."""
    f = hz(p)
    t = np.arange(int((dur + 0.3) * SR)) / SR
    fc = 500 + 2200 * np.exp(-t / 0.045)
    phase = 2 * np.pi * f * t
    out = np.zeros_like(t)
    for k in range(1, 30):
        if k * f > SR * 0.45:
            break
        out += (1 / k) / np.sqrt(1 + (k * f / fc) ** 4) * np.sin(k * phase)
    return out * np.exp(-t / 0.2) * np.clip(t / 0.002, 0, 1)


def inst_piano(p, dur, vel):
    f = hz(p)
    total = dur + 0.4
    t = np.arange(int(total * SR)) / SR
    bright = 0.45 + 0.4 * vel / 127
    out = np.zeros_like(t)
    for k in range(1, 16):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > SR * 0.45:
            break
        out += (bright ** k) / k ** 1.1 * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.5 * k))
    hammer = sosfilt(butter(2, [600, 4000], "bandpass", fs=SR, output="sos"),
                     RNG.standard_normal(len(t))) * np.exp(-t * 120) * 0.1
    env = np.clip(t / 0.003, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.08), 1)
    return (out + hammer) * env


def inst_strings(p, dur, vel):
    f = hz(p)
    total = dur + 0.7
    t = np.arange(int(total * SR)) / SR
    vib = 0.003 * np.sin(2 * np.pi * 4.6 * t)
    out = 0
    for det in (-0.008, -0.002, 0.003, 0.009):
        ff = f * (1 + det)
        out = out + additive(ff, t, lambda k: (1 / k) * lowpass_weight(k, ff, 1300), 30, vib)
    return out * adsr(len(t), dur, 0.18, 0.6, 0.85, 0.6) / 4


def inst_bass(p, dur, vel):
    f = hz(p)
    total = dur + 0.08
    t = np.arange(int(total * SR)) / SR
    phase = 2 * np.pi * f * t
    fc = 320 + 1100 * np.exp(-t / 0.06)
    out = np.zeros_like(t)
    for k in range(1, 40):
        if k * f > 6000:
            break
        out += (1 / k) / np.sqrt(1 + (k * f / fc) ** 4) * np.sin(k * phase)
    out += 0.8 * np.sin(phase)  # sub
    return out * adsr(len(t), dur, 0.004, 0.2, 0.7, 0.06)


def noise(nsamp):
    return RNG.standard_normal(nsamp)


def band(x, lo=None, hi=None):
    if lo and hi:
        sos = butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
    elif lo:
        sos = butter(2, lo, "highpass", fs=SR, output="sos")
    else:
        sos = butter(2, hi, "lowpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def inst_drum(p, dur, vel):
    if p == KICK:
        t = np.arange(int(0.5 * SR)) / SR
        f = 46 + 105 * np.exp(-t / 0.035)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25)
        click = band(noise(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.3
        return np.tanh(1.6 * (body + click))
    if p == SNARE:
        t = np.arange(int(0.35 * SR)) / SR
        tone = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.06) * 0.7
        nz = band(noise(len(t)), 1000, 7000) * np.exp(-t / 0.1)
        return tone + nz
    if p == CLAP:
        t = np.arange(int(0.4 * SR)) / SR
        env = np.exp(-t / 0.11)
        for off in (0.0, 0.011, 0.022):
            env = env + (t >= off) * np.exp(-np.clip(t - off, 0, None) / 0.004) * 1.4
        return band(noise(len(t)), 800, 3000) * env * 0.7
    if p == HAT:
        t = np.arange(int(0.1 * SR)) / SR
        return band(noise(len(t)), 7000) * np.exp(-t / 0.015) * 0.7
    if p in (FLOOR_TOM, LOW_TOM):
        f0 = 78 if p == FLOOR_TOM else 104
        t = np.arange(int(0.8 * SR)) / SR
        f = f0 * (1 + 0.5 * np.exp(-t / 0.03))
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
        return np.tanh(1.3 * (body + band(noise(len(t)), 200, 2000) * np.exp(-t / 0.02) * 0.3))
    if p == CRASH:
        t = np.arange(int(2.6 * SR)) / SR
        ring = sum(np.sin(2 * np.pi * fr * t) for fr in (2950, 4370, 5830)) * 0.04
        return (band(noise(len(t)), 3200, 11000) + band(ring, 2500)) * np.exp(-t / 0.8) * np.clip(t / 0.002, 0, 1) * 0.5
    return np.zeros(1)


# Réglages de mix par piste : instrument, gain, pan (-1..1), envoi réverbe
MIX = {
    "Melodie - Synth Lead": (inst_lead, 0.30, 0.0, 0.25),
    "Arpege Synth": (inst_arp, 0.29, 0.4, 0.35),
    "Piano": (inst_piano, 0.19, -0.3, 0.22),
    "Cordes Graves": (inst_strings, 0.16, 0.25, 0.45),
    "Basse Synth": (inst_bass, 0.14, 0.0, 0.0),
    "Batterie": (inst_drum, 0.33, 0.0, 0.12),
}

HAT_PANS = {HAT: 0.3, CRASH: -0.25, LOW_TOM: -0.15, FLOOR_TOM: 0.15}


def reverb_ir():
    t = np.arange(int(2.0 * SR)) / SR
    env = np.exp(-t / 0.45) * np.clip(t / 0.01, 0, 1)
    ir = np.stack([band(noise(len(t)), 250, 7000) * env, band(noise(len(t)), 250, 7000) * env], axis=1)
    pre = int(0.022 * SR)
    ir = np.vstack([np.zeros((pre, 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR = reverb_ir()


def render_track(name, notes, total_s):
    fn, gain, pan, send = MIX[name]
    buf = np.zeros((int((total_s + 3) * SR), 2))
    for s, d, p, v in notes:
        x = fn(p, d * BEAT, v) * (v / 127) ** 1.6 * gain
        tp = HAT_PANS.get(p, pan) if name == "Batterie" else pan
        theta = (tp + 1) * np.pi / 4
        i0 = int(round(s * BEAT * SR))
        i1 = min(i0 + len(x), len(buf))
        buf[i0:i1, 0] += x[: i1 - i0] * np.cos(theta)
        buf[i0:i1, 1] += x[: i1 - i0] * np.sin(theta)
    if send:
        wet = np.stack([fftconvolve(buf[:, c], IR[:, c])[: len(buf)] for c in range(2)], axis=1)
        buf = buf + wet * send * 0.25
    return buf


def finish(buf, cue):
    n = int(cue["length"] * SR)
    buf = buf[:n].copy()
    fade = int(cue["fade"] * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    buf[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
    return buf


def write_wav(path, data, bits):
    data = np.clip(data, -1, 1) if bits == 24 else data.astype(np.float32)
    nch = data.shape[1]
    if bits == 24:
        ints = (data * (2 ** 23 - 1)).astype(np.int32)
        raw = np.zeros((ints.size, 3), dtype=np.uint8)
        flat = ints.reshape(-1)
        raw[:, 0] = flat & 0xFF
        raw[:, 1] = (flat >> 8) & 0xFF
        raw[:, 2] = (flat >> 16) & 0xFF
        payload, fmt, bps = raw.tobytes(), 1, 3
    else:
        payload, fmt, bps = data.tobytes(), 3, 4
    import struct
    hdr = struct.pack("<4sI4s4sIHHIIHH4sI", b"RIFF", 36 + len(payload), b"WAVE", b"fmt ", 16, fmt, nch,
                      SR, SR * nch * bps, nch * bps, bps * 8, b"data", len(payload))
    with open(path, "wb") as fh:
        fh.write(hdr + payload)


def bus_compress(x, thresh_db=-14, ratio=3.0):
    """Compresseur de bus simple (détection RMS ~10 ms), pour le « liant » pop."""
    lvl = np.sqrt(np.convolve(np.mean(x ** 2, axis=1), np.ones(480) / 480, mode="same") + 1e-12)
    db = 20 * np.log10(lvl)
    over = np.clip(db - thresh_db, 0, None)
    g = 10 ** (-(over - over / ratio) / 20)
    # lissage de la réduction de gain
    g = np.convolve(g, np.ones(960) / 960, mode="same")
    return x * g[:, None], g


def render_cue(cue):
    stems = {name: render_track(name, cue["tracks"][name], cue["length"]) for name, *_ in TRACKS}
    mix = sum(stems.values())
    mix, g = bus_compress(mix)
    stems = {k: v * g[:, None] for k, v in stems.items()}

    mix = finish(mix, cue)
    stems = {k: finish(v, cue) for k, v in stems.items()}

    # Normalisation podcast : -16 LUFS intégré, crête plafonnée à -1 dBFS (limiteur doux)
    meter = pyloudnorm.Meter(SR, block_size=0.4)
    gain = 10 ** ((-16 - meter.integrated_loudness(mix)) / 20)
    mix *= gain
    stems = {k: v * gain for k, v in stems.items()}
    ceiling = 10 ** (-1 / 20)
    peak = np.max(np.abs(mix))
    if peak > ceiling:  # soft clip seulement au-dessus de -1 dBFS sur le mix
        mix = np.where(np.abs(mix) > 0.7 * ceiling,
                       np.sign(mix) * (0.7 * ceiling + 0.3 * ceiling * np.tanh((np.abs(mix) - 0.7 * ceiling) / (0.3 * ceiling))),
                       mix)
    lufs = meter.integrated_loudness(mix)
    return mix, stems, lufs, 20 * np.log10(np.max(np.abs(mix)))


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(OUT, d), exist_ok=True)
    for i, build in enumerate((cue_jingle, cue_virgule, cue_outro), 1):
        cue = dedupe(build())
        base = f"{i:02d}_{cue['name']}_100bpm_{KEY}"
        write_midi(cue, os.path.join(OUT, "midi", base + ".mid"))
        mix, stems, lufs, peak = render_cue(cue)
        sdir = os.path.join(OUT, "stems", base)
        os.makedirs(sdir, exist_ok=True)
        for j, (name, *_rest) in enumerate(TRACKS, 1):
            fname = f"{j}_{name.replace(' - ', '_').replace(' ', '_')}.wav"
            write_wav(os.path.join(sdir, fname), stems[name], 24)
        wav = os.path.join(OUT, "maquettes", base + ".wav")
        write_wav(wav, mix, 24)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame",
                        "-b:a", "320k", wav[:-4] + ".mp3"], check=True)
        print(f"{base}: {cue['length']:.1f} s, {lufs:.1f} LUFS, crête {peak:.1f} dBFS")


if __name__ == "__main__":
    main()
