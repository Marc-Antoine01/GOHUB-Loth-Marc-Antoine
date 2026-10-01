#!/usr/bin/env python3
"""Logo sonore du podcast « engagement citoyen des élus et agents de mairie ».

Une seule partition (ci-dessous) sert à produire :
  - les fichiers MIDI multipistes (type 1) ;
  - les stems audio WAV par instrument (pour la multipiste d'Adobe Audition) ;
  - les maquettes mixées (WAV 24 bits + MP3).

Trois déclinaisons, toutes à 100 BPM en ré majeur, sur le même motif :
  - jingle  : logo sonore principal (9,8 s)
  - virgule : transition courte (3,0 s)
  - outro   : fin d'épisode (15,0 s)

Dépendances : numpy, scipy, mido, pyloudnorm, ffmpeg (pour le MP3).
Usage : python3 generate.py
"""

import os
import subprocess

import mido
import numpy as np
import pyloudnorm
from scipy.signal import butter, fftconvolve, sosfilt

BPM = 100
BEAT = 60.0 / BPM  # 0,6 s
SR = 48000
PPQ = 480
OUT = os.path.dirname(os.path.abspath(__file__))
RNG = np.random.default_rng(2026)

# Notes MIDI utiles
N = {
    "E1": 28, "G1": 31, "A1": 33, "B1": 35, "D2": 38, "E2": 40,
    "D4": 62, "E4": 64, "F#4": 66, "G4": 67, "A4": 69, "B4": 71, "C#5": 73,
    "D5": 74, "E5": 76, "F#5": 78, "G5": 79, "A5": 81, "B5": 83, "C#6": 85,
    "D6": 86, "F#6": 90, "A6": 93, "D7": 98,
}

# Accords (voicing piano/pad, fondamentale basse)
CHORDS = {
    "D": (["D4", "F#4", "A4", "D5"], "D2"),
    "A": (["C#5", "E4", "A4", "E5"], "A1"),
    "Asus4": (["D4", "E4", "A4", "D5"], "A1"),
    "Bm": (["D4", "F#4", "B4", "D5"], "B1"),
    "G": (["D4", "G4", "B4", "D5"], "G1"),
    "Em7": (["E4", "G4", "B4", "D5"], "E2"),
}

# Pistes : nom, canal MIDI, programme General MIDI, volume (CC7), pan (CC10)
TRACKS = [
    ("Melodie - Synth Lead", 0, 80, 100, 64),
    ("Glockenspiel", 1, 9, 80, 84),
    ("Piano Pop", 2, 0, 92, 50),
    ("Nappe Cordes", 3, 48, 72, 78),
    ("Basse Synth", 4, 38, 100, 64),
    ("Batterie", 9, 0, 105, 64),
]

# Batterie (General MIDI)
KICK, SNARE, CLAP, HAT, OHAT, CRASH = 36, 38, 39, 42, 46, 49


def n(start, dur, note, vel):
    return (float(start), float(dur), N[note] if isinstance(note, str) else note, vel)


# --------------------------------------------------------------------------
# Motif : montée A4-D5-F#5 puis réponse E5-F#5-A5 ; la « signature » du podcast
# --------------------------------------------------------------------------
def motif(t0, vel=100, end=("A5", 1)):
    return [n(t0, .5, "A4", vel - 8), n(t0 + .5, .5, "D5", vel - 4),
            n(t0 + 1, 1, "F#5", vel), n(t0 + 2, .5, "E5", vel - 10),
            n(t0 + 2.5, .5, "F#5", vel - 6), n(t0 + 3, end[1], end[0], vel + 6)]


def answer(t0, vel=96):
    return [n(t0, .5, "F#5", vel), n(t0 + .5, .5, "D5", vel - 8),
            n(t0 + 1, 1, "F#5", vel), n(t0 + 2, .5, "G5", vel - 4),
            n(t0 + 2.5, .5, "F#5", vel - 8), n(t0 + 3, 1, "E5", vel)]


def octave_up(notes, vel_scale=0.8):
    return [(s, d, p + 12, int(v * vel_scale)) for s, d, p, v in notes]


def piano_comp(changes, vel=84):
    """Stabs pop syncopés (0 / 0,75 / 1,5 temps) pour chaque accord de 2 temps."""
    out = []
    for start, name, length in changes:
        voicing, _ = CHORDS[name]
        hits = [(0, .7, vel), (.75, .6, vel - 14), (1.5, .45, vel - 8)] if length == 2 else [(0, length, vel)]
        for off, dur, v in hits:
            out += [n(start + off, dur, p, v) for p in voicing]
    return out


def pad(changes, vel=70):
    out = []
    for start, name, length in changes:
        out += [n(start, length, p, vel) for p in CHORDS[name][0][:3]]
    return out


def bass_line(changes, vel=100):
    out = []
    for start, name, length in changes:
        root = N[CHORDS[name][1]]
        if length == 2:
            pattern = [(0, root, vel), (.5, root, vel - 18), (1, root + 12, vel - 6), (1.5, root, vel - 14)]
            out += [n(start + o, .45, p, v) for o, p, v in pattern]
        elif length == 1:
            out += [n(start, .45, root, vel), n(start + .5, .45, root, vel - 16)]
        else:
            out.append(n(start, length, root, vel))
    return out


def groove(bar_start, full=True, open_hat=True):
    """Un temps fort pop : kick 1 / 2,5 / 3, clap+caisse claire 2 et 4, hats en croches."""
    d = [n(bar_start, .25, KICK, 112), n(bar_start + 1.5, .25, KICK, 92), n(bar_start + 2, .25, KICK, 108)]
    if full:
        d += [n(bar_start + 1, .25, SNARE, 104), n(bar_start + 3, .25, SNARE, 108),
              n(bar_start + 1, .25, CLAP, 96), n(bar_start + 3, .25, CLAP, 100)]
    for i in range(8):
        if open_hat and i == 7:
            d.append(n(bar_start + 3.5, .5, OHAT, 78))
        else:
            d.append(n(bar_start + i * .5, .25, HAT, 76 if i % 2 else 58))
    return d


def snare_roll(start, beats, v0=60, v1=118):
    steps = int(beats * 4)
    return [n(start + i * .25, .25, SNARE, int(v0 + (v1 - v0) * i / max(steps - 1, 1))) for i in range(steps)]


def sparkle(t0, vel=88):
    return [n(t0 + i * .25, 3 - i * .25, p, vel - i * 4) for i, p in enumerate(["D6", "F#6", "A6", "D7"])]


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
    changes = [(0, "D", 2), (2, "A", 2), (4, "Bm", 2), (6, "G", 2), (8, "D", 2), (10, "A", 2)]
    final = [(12, "D", 4)]
    lead = motif(0) + answer(4) + motif(8, 104, end=("A5", .5)) + [n(11.5, .5, "C#6", 104), n(12, 4, "D6", 112)]
    drums = groove(0) + groove(4) + groove(8, open_hat=False)
    drums += snare_roll(11, 1, 70, 116)[:]
    drums += [n(0, 2, CRASH, 100), n(12, 4, CRASH, 118), n(12, .25, KICK, 120), n(12, .25, CLAP, 90)]
    return dict(
        name="jingle", title="Logo sonore", length=9.8, fade=0.6,
        markers=[(0, "Motif"), (4, "Reponse"), (8, "Motif (montee)"), (12, "Final")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Glockenspiel": octave_up(motif(0) + motif(8, end=("A5", .5)), .7) + sparkle(12),
            "Piano Pop": piano_comp(changes + final),
            "Nappe Cordes": pad(changes + final),
            "Basse Synth": bass_line(changes) + [n(12, 4, "D2", 112)],
            "Batterie": drums,
        })


def cue_virgule():
    lead = [n(0, .5, "A4", 96), n(.5, .5, "D5", 100), n(1, .5, "F#5", 104),
            n(1.5, .5, "A5", 108), n(2, 2.5, "D6", 112)]
    changes = [(0, "G", 1), (1, "A", 1), (2, "D", 2.5)]
    drums = [n(0, .25, KICK, 110), n(0, .25, HAT, 70), n(.5, .25, HAT, 60), n(1, .25, KICK, 100)]
    drums += snare_roll(1, 1, 64, 112)
    drums += [n(2, .25, KICK, 120), n(2, .25, CLAP, 96), n(2, 2.5, CRASH, 112)]
    return dict(
        name="virgule", title="Virgule", length=3.0, fade=0.5,
        markers=[(0, "Motif"), (2, "Resolution")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Glockenspiel": octave_up(lead[:4], .7) + sparkle(2, 84),
            "Piano Pop": [n(s, l if l < 2 else 2.5, p, 88) for s, name, l in changes for p in CHORDS[name][0]],
            "Nappe Cordes": pad(changes, 66),
            "Basse Synth": [n(0, .45, "G1", 104), n(.5, .45, "G1", 88), n(1, .45, "A1", 104),
                            n(1.5, .45, "A1", 92), n(2, 2.5, "D2", 112)],
            "Batterie": drums,
        })


def cue_outro():
    changes = [(0, "D", 2), (2, "A", 2), (4, "Bm", 2), (6, "G", 2),
               (8, "D", 2), (10, "A", 2), (12, "Bm", 2), (14, "G", 2),
               (16, "Em7", 2), (18, "Asus4", 1), (19, "A", 1)]
    final = [(20, "D", 4)]
    lead = motif(0, 88) + answer(4, 86) + motif(8, 102) + [
        n(12, .5, "B5", 100), n(12.5, .5, "A5", 94), n(13, 1, "F#5", 100),
        n(14, .5, "G5", 96), n(14.5, .5, "A5", 100), n(15, 1, "B5", 106),
        n(16, .5, "G5", 100), n(16.5, .5, "F#5", 94), n(17, 1, "E5", 98),
        n(18, .5, "A4", 96), n(18.5, .5, "D5", 100), n(19, .5, "F#5", 104), n(19.5, .5, "A5", 108),
        n(20, 4, "D6", 112)]
    drums = groove(0, full=False) + groove(4, full=False) + groove(8) + groove(12)
    drums += [n(16, .25, KICK, 110), n(17, .25, SNARE, 100), n(17, .25, CLAP, 92), n(17.5, .25, KICK, 96)]
    drums += [n(16 + i * .5, .25, HAT, 70) for i in range(4)]
    drums += snare_roll(18, 2, 56, 120)
    drums += [n(8, 2, CRASH, 100), n(20, 4, CRASH, 120), n(20, .25, KICK, 122), n(20, .25, CLAP, 92)]
    return dict(
        name="outro", title="Outro", length=15.0, fade=1.2,
        markers=[(0, "Motif (leger)"), (8, "Motif (plein)"), (16, "Montee"), (20, "Final")],
        tracks={
            "Melodie - Synth Lead": lead,
            "Glockenspiel": octave_up(motif(8, 102) + lead[-5:-1], .7) + sparkle(20),
            "Piano Pop": piano_comp(changes[:10]) + [n(18, 1, p, 84) for p in CHORDS["Asus4"][0]]
            + [n(19, 1, p, 88) for p in CHORDS["A"][0]] + [n(20, 4, p, 96) for p in CHORDS["D"][0]],
            "Nappe Cordes": pad(changes + final, 66),
            "Basse Synth": bass_line(changes) + [n(20, 4, "D2", 112)],
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
                  mido.MetaMessage("key_signature", key="D", time=0)]
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
    f = hz(p)
    total = dur + 0.35
    t = np.arange(int(total * SR)) / SR
    vib = 0.0035 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    out = 0
    for det in (-0.006, 0.0, 0.007):
        ff = f * (1 + det)
        out = out + additive(ff, t, lambda k: (1 / k) * lowpass_weight(k, ff, 3200), 40, vib)
        # un peu de carré pour la rondeur
        out = out + 0.5 * additive(ff, t, lambda k: (1 / k if k % 2 else 0) * lowpass_weight(k, ff, 2400), 30, vib)
    return out * adsr(len(t), dur, 0.008, 0.25, 0.75, 0.3) / 3


def inst_glock(p, dur, vel):
    f = hz(p)
    t = np.arange(int(1.8 * SR)) / SR
    out = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dcy)
              for r, a, dcy in [(1, 1, 2.6), (2.76, .35, 7), (5.40, .16, 12), (8.93, .06, 18)])
    return out * np.clip(t / 0.002, 0, 1)


def inst_piano(p, dur, vel):
    f = hz(p)
    total = dur + 0.4
    t = np.arange(int(total * SR)) / SR
    bright = 0.6 + 0.6 * vel / 127
    out = np.zeros_like(t)
    for k in range(1, 16):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > SR * 0.45:
            break
        out += (bright ** k) / k ** 1.1 * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.2 + 0.55 * k))
    hammer = sosfilt(butter(2, [800, 6000], "bandpass", fs=SR, output="sos"),
                     RNG.standard_normal(len(t))) * np.exp(-t * 120) * 0.15
    env = np.clip(t / 0.003, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.08), 1)
    return (out + hammer) * env


def inst_pad(p, dur, vel):
    f = hz(p)
    total = dur + 0.6
    t = np.arange(int(total * SR)) / SR
    trem = 1 + 0.0025 * np.sin(2 * np.pi * 4.8 * t)
    out = 0
    for det in (-0.009, -0.003, 0.004, 0.01):
        ff = f * (1 + det)
        out = out + additive(ff, t, lambda k: (1 / k) * lowpass_weight(k, ff, 1700), 30, trem - 1)
    return out * adsr(len(t), dur, 0.22, 0.6, 0.85, 0.55) / 4


def inst_bass(p, dur, vel):
    f = hz(p)
    total = dur + 0.08
    t = np.arange(int(total * SR)) / SR
    phase = 2 * np.pi * f * t
    fc = 380 + 1500 * np.exp(-t / 0.07)
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
        f = 48 + 110 * np.exp(-t / 0.035)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
        click = band(noise(len(t)), 1500, 8000) * np.exp(-t / 0.004) * 0.4
        return np.tanh(1.6 * (body + click))
    if p == SNARE:
        t = np.arange(int(0.35 * SR)) / SR
        tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.6
        nz = band(noise(len(t)), 1200, 9000) * np.exp(-t / 0.09)
        return tone + nz
    if p == CLAP:
        t = np.arange(int(0.4 * SR)) / SR
        env = np.exp(-t / 0.11)
        for off in (0.0, 0.011, 0.022):
            env = env + (t >= off) * np.exp(-np.clip(t - off, 0, None) / 0.004) * 1.4
        return band(noise(len(t)), 900, 3500) * env * 0.8
    if p in (HAT, OHAT):
        length = 0.06 if p == HAT else 0.32
        t = np.arange(int((length + 0.05) * SR)) / SR
        return band(noise(len(t)), 7000) * np.exp(-t / (length / 3)) * 0.8
    if p == CRASH:
        t = np.arange(int(2.6 * SR)) / SR
        ring = sum(np.sin(2 * np.pi * fr * t) for fr in (3150, 4870, 6230, 7710)) * 0.05
        return (band(noise(len(t)), 4500) + band(ring, 3000)) * np.exp(-t / 0.75) * np.clip(t / 0.002, 0, 1) * 0.6
    return np.zeros(1)


# Réglages de mix par piste : instrument, gain, pan (-1..1), envoi réverbe
MIX = {
    "Melodie - Synth Lead": (inst_lead, 0.30, 0.0, 0.22),
    "Glockenspiel": (inst_glock, 0.24, 0.35, 0.35),
    "Piano Pop": (inst_piano, 0.17, -0.3, 0.18),
    "Nappe Cordes": (inst_pad, 0.16, 0.3, 0.40),
    "Basse Synth": (inst_bass, 0.17, 0.0, 0.0),
    "Batterie": (inst_drum, 0.42, 0.0, 0.08),
}

HAT_PANS = {HAT: 0.3, OHAT: 0.3, CRASH: -0.25}


def reverb_ir():
    t = np.arange(int(1.6 * SR)) / SR
    env = np.exp(-t / 0.35) * np.clip(t / 0.01, 0, 1)
    ir = np.stack([band(noise(len(t)), 300, 9000) * env, band(noise(len(t)), 300, 9000) * env], axis=1)
    pre = int(0.018 * SR)
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
        base = f"{i:02d}_{cue['name']}_100bpm_Dmaj"
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
