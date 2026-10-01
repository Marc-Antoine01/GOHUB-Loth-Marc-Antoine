#!/usr/bin/env python3
"""« Ville et Engagement » : proposition carte blanche, bâtie sur le nom du podcast.

Le motif suit la prosodie du titre, cinq syllabes chantées :
    VIL – (l')é – en – GAGE – MENT
    do     fa     sol   la     DO
La voix pose la question (elle finit sur la quinte), la cloche de la mairie répond sur la tonique.

Fa majeur, 120 BPM, accords suspendus (sus2, sus4, add9) : de l'espoir, mais posé.
Signatures sonores : la cloche de mairie, un coup de tampon, des applaudissements de groupe.

Réutilise les synthés, l'export MIDI et le mix de ../generate.py.
Usage : python3 generate_carte_blanche.py
"""

import os
import subprocess
import sys

import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import generate as gen  # noqa: E402
from generate import n, note, band, noise, adsr, hz, SR  # noqa: E402

gen.KEY = "F"
TAMPON, GROUP_CLAP = 37, 39  # side stick et clap en General MIDI
KICK, HAT = gen.KICK, gen.HAT

# Accords : main droite piano, cordes, fondamentale basse, arpège (non utilisé ici)
gen.CHORDS = {
    "Bbadd9": (["F3", "Bb3", "C4", "D4"], ["Bb2", "F3", "D4"], "Bb1", None),
    "Csus4": (["F3", "G3", "C4"], ["C3", "G3", "F4"], "C2", None),
    "C": (["E3", "G3", "C4"], ["C3", "G3", "E4"], "C2", None),
    "Dm7": (["F3", "A3", "C4"], ["D3", "A3", "F4"], "D2", None),
    "Gm7": (["F3", "Bb3", "D4"], ["G2", "D3", "Bb3"], "G1", None),
    "Fadd9": (["A3", "C4", "F4", "G4"], ["F2", "C3", "A3"], "F1", None),
}

VOICE = "Voix - Ville et Engagement"
gen.TRACKS = [
    (VOICE, 0, 52, 100, 64),
    ("Piano Melodie", 1, 0, 90, 56),
    ("Piano Accords", 2, 0, 86, 44),
    ("Cordes", 3, 48, 78, 80),
    ("Basse", 4, 33, 100, 64),
    ("Cloche de mairie", 5, 14, 100, 70),
    ("Batterie - Tampon - Mains", 9, 0, 105, 64),
]

SYLLABLES = ["Vil", "le et", "en", "ga", "ge-ment"]
VOWELS = ["i", "e", "an", "a", "an"]

# Formants des voyelles chantées : (fréquence, largeur de bande, gain)
FORMANTS = {
    "i": [(300, 80, 1.0), (2300, 150, 0.35), (3000, 200, 0.2)],
    "e": [(420, 90, 1.0), (2050, 140, 0.35), (2700, 180, 0.15)],
    "an": [(620, 110, 1.0), (1050, 120, 0.6), (2600, 200, 0.08)],
    "a": [(750, 120, 1.0), (1250, 130, 0.7), (2600, 200, 0.1)],
}


def name_motif(t0, vel=100, peak="C5"):
    """VIL (croche pointée) – é (double) – en – GAGE (croches) – MENT (longue, accentuée)."""
    rhythm = [(0, .75, "C4", 0), (.75, .25, "F4", -10), (1, .5, "G4", -6), (1.5, .5, "A4", -2), (2, 1.5, peak, 10)]
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in rhythm]


# --------------------------------------------------------------------------
# Sons signatures
# --------------------------------------------------------------------------
def inst_bell(p, dur, vel):
    """Cloche de mairie : partiels de cloche d'église (bourdon, fondamentale, tierce mineure, quinte, nominale…)."""
    f = hz(p)
    t = np.arange(int(4.5 * SR)) / SR
    partials = [(0.5, .35, 3.5), (1.0, .45, 2.4), (1.19, .4, 1.8), (1.5, .22, 1.4), (2.0, 1.0, 1.7),
                (2.52, .18, 1.0), (3.0, .25, .9), (4.0, .12, .6), (5.33, .06, .35)]
    out = np.zeros_like(t)
    for i, (r, a, dcy) in enumerate(partials):
        for det in (-0.25, 0.25):  # légers battements, comme une vraie cloche
            out += a * np.sin(2 * np.pi * (f / 2 * r + det) * t + i) * np.exp(-t / dcy)
    strike = band(noise(len(t)), 1800, 7000) * np.exp(-t / 0.008) * 0.6
    return (out / 3 + strike) * np.clip(t / 0.001, 0, 1)


def inst_tampon(vel):
    """Coup de tampon : choc sourd + claquement de papier."""
    t = np.arange(int(0.35 * SR)) / SR
    thud = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.06)
    knock = band(noise(len(t)), 400, 2500) * np.exp(-t / 0.025) * 0.8
    paper = band(noise(len(t)), 3000, 9000) * np.exp(-t / 0.012) * 0.25
    return np.tanh(1.5 * (thud + knock + paper))


def inst_group_clap(vel):
    """Applaudissements de groupe : six personnes, pas tout à fait ensemble, réparties en stéréo."""
    t = np.arange(int(0.35 * SR)) / SR
    out = np.zeros((len(t), 2))
    rng = np.random.default_rng(int(vel) * 7 + 3)
    for _ in range(6):
        off = int(rng.uniform(0, 0.02) * SR)
        center = rng.uniform(900, 2000)
        c = band(noise(len(t)), center * 0.6, center * 1.8) * np.exp(-t / rng.uniform(0.03, 0.06))
        c = np.concatenate([np.zeros(off), c[: len(t) - off]])
        theta = (rng.uniform(-0.8, 0.8) + 1) * np.pi / 4
        out[:, 0] += c * np.cos(theta)
        out[:, 1] += c * np.sin(theta)
    return out / 3


def inst_drums(p, dur, vel):
    if p == TAMPON:
        return inst_tampon(vel)
    if p == GROUP_CLAP:
        return inst_group_clap(vel)
    return gen.inst_drum(p, dur, vel)


def inst_voice(p, dur, vel, vowel):
    """Chœur chanté sur les voyelles du titre (sans consonnes : i – é – an – a – an)."""
    f = hz(p)
    t = np.arange(int((dur + 0.35) * SR)) / SR
    out = np.zeros((len(t), 2))
    for i, (det, panv, rate) in enumerate([(-0.004, -0.6, 5.1), (0.003, 0.6, 5.5), (-0.001, -0.2, 4.8), (0.005, 0.25, 5.8)]):
        vib = 0.003 * np.sin(2 * np.pi * rate * t + i * 1.7) * np.clip(t / 0.25, 0, 1)
        ff = f * (1 + det)
        phase = 2 * np.pi * np.cumsum(ff * (1 + vib)) / SR
        voice = np.zeros_like(t)
        for k in range(1, 40):
            fk = k * ff
            if fk > 4500:
                break
            gain = sum(g / np.sqrt(1 + ((fk - fc) / (bw / 2)) ** 2) for fc, bw, g in FORMANTS[vowel])
            voice += gain / k ** 0.7 * np.sin(k * phase)
        voice = (voice + band(noise(len(t)), 250, 1500) * 0.015) * adsr(len(t), dur, 0.03 + 0.008 * i, 0.4, 0.85, 0.3)
        theta = (panv + 1) * np.pi / 4
        out[:, 0] += voice * np.cos(theta)
        out[:, 1] += voice * np.sin(theta)
    return out / 4


gen.MIX = {
    VOICE: (None, 0.36, 0.0, 0.40),
    "Piano Melodie": (gen.inst_piano_melody, 0.14, -0.1, 0.28),
    "Piano Accords": (gen.inst_piano, 0.15, -0.3, 0.22),
    "Cordes": (gen.inst_strings, 0.16, 0.25, 0.45),
    "Basse": (gen.inst_bass, 0.11, 0.0, 0.0),
    "Cloche de mairie": (inst_bell, 0.22, 0.2, 0.45),
    "Batterie - Tampon - Mains": (inst_drums, 0.33, 0.0, 0.15),
}

_render_track = gen.render_track
CURRENT_VOWELS = {}


def render_track(name, notes, total_s):
    """Comme generate.render_track, mais la voix chante la voyelle de chaque syllabe."""
    if name != VOICE:
        return _render_track(name, notes, total_s)
    _, gain, _, send = gen.MIX[name]
    buf = np.zeros((int((total_s + 3) * SR), 2))
    for s, d, p, v in notes:
        x = inst_voice(p, d * gen.BEAT, v, CURRENT_VOWELS[s]) * (v / 127) ** 1.6 * gain
        i0 = int(round(s * gen.BEAT * SR))
        i1 = min(i0 + len(x), len(buf))
        buf[i0:i1] += x[: i1 - i0]
    wet = np.stack([gen.fftconvolve(buf[:, c], gen.IR[:, c])[: len(buf)] for c in range(2)], axis=1)
    return buf + wet * send * 0.25


gen.render_track = render_track


def voices(lead):
    """Voix aiguës à l'unisson, voix graves à l'octave inférieure."""
    return gen.transpose(lead, 0, 0.92) + gen.transpose(lead, -12, 0.8)


def groove(bar):
    d = [n(bar, .25, KICK, 112), n(bar + 1.5, .25, KICK, 92), n(bar + 2, .25, KICK, 108)]
    d += [n(bar + 1, .25, GROUP_CLAP, 100), n(bar + 3, .25, GROUP_CLAP, 104), n(bar + 3, .25, TAMPON, 110)]
    d += [n(bar + i * .5, .2, HAT, 64 if i % 2 == 0 else 44) for i in range(8)]
    return d


# --------------------------------------------------------------------------
# Les deux propositions
# --------------------------------------------------------------------------
def cue_logo():
    lead = name_motif(0, 104)
    changes = [(0, "Bbadd9", 1), (1, "Csus4", 1)]
    final = [(2, "Fadd9", 6)]
    drums = [n(0, .25, KICK, 104), n(1, .25, KICK, 96), n(1, .25, GROUP_CLAP, 90),
             n(2, .25, KICK, 120), n(2, .25, TAMPON, 118), n(2, .25, GROUP_CLAP, 104)]
    return dict(
        name="logo", title="Ville et Engagement - logo", length=5.0, fade=0.8,
        markers=[(0, "Ville et Engagement"), (2, "Cloche")],
        tracks={
            VOICE: voices(lead),
            "Piano Melodie": lead,
            "Piano Accords": gen.piano_part(changes + final, 82),
            "Cordes": gen.strings(changes + final, 70),
            "Basse": gen.bass_line(changes + final),
            "Cloche de mairie": [n(2, 4, "F4", 118), n(4, 4, "F4", 84)],
            "Batterie - Tampon - Mains": drums,
        })


def cue_jingle():
    lead = name_motif(0, 100) + name_motif(4, 102, "D5") + name_motif(8, 106)
    lead += [n(11.5, .25, "A4", 100), n(11.75, .25, "Bb4", 104), n(12, 3, "C5", 116)]
    changes = [(0, "Bbadd9", 2), (2, "Csus4", 1), (3, "C", 1), (4, "Dm7", 2), (6, "Bbadd9", 2),
               (8, "Gm7", 2), (10, "Csus4", 1), (11, "C", 1)]
    final = [(12, "Fadd9", 5)]
    drums = groove(0) + groove(4) + groove(8)
    drums += [n(11 + i * .25, .2, GROUP_CLAP, 70 + 10 * i) for i in range(4)]
    drums += [n(12, .25, KICK, 122), n(12, .25, TAMPON, 120), n(12, .25, GROUP_CLAP, 110)]
    return dict(
        name="jingle", title="Ville et Engagement - jingle", length=8.6, fade=0.8,
        markers=[(0, "Ville et Engagement"), (4, "Ville et Engagement (2)"), (8, "Ville et Engagement (3)"), (12, "Cloche")],
        tracks={
            VOICE: voices(lead),
            "Piano Melodie": lead,
            "Piano Accords": gen.piano_part(changes + final, 82),
            "Cordes": gen.strings(changes + final, 68),
            "Basse": gen.bass_line(changes + final),
            "Cloche de mairie": [n(12, 4, "F4", 120), n(14, 3, "F4", 86)],
            "Batterie - Tampon - Mains": drums,
        })


def syllable_map(lead):
    """Associe chaque note de la mélodie à sa syllabe ; les notes d'élan chantent « a », la note finale « -ment »."""
    offsets = {0: 0, .75: 1, 1: 2, 1.5: 3, 2: 4}
    starts = sorted({s for s, *_ in lead})
    words, vowels = {}, {}
    for s in starts:
        idx = offsets.get(s % 4)
        if s == starts[-1] and idx == 0:  # note tenue finale du jingle
            words[s], vowels[s] = "(ment)", "an"
        elif idx is None:
            words[s], vowels[s] = "a", "a"
        else:
            words[s], vowels[s] = SYLLABLES[idx], VOWELS[idx]
    return words, vowels


def add_lyrics(path, words):
    mid = mido.MidiFile(path)
    for tr in mid.tracks:
        if tr.name != VOICE:
            continue
        absolute, t = [], 0
        for msg in tr:
            t += msg.time
            absolute.append((t, msg))
        for beat, w in words.items():
            absolute.append((int(round(beat * gen.PPQ)), mido.MetaMessage("lyrics", text=w)))
        absolute.sort(key=lambda e: (e[0], 0 if e[1].type == "lyrics" else 1, e[1].type == "end_of_track"))
        tr.clear()
        last = 0
        for tick, msg in absolute:
            tr.append(msg.copy(time=tick - last))
            last = tick
    mid.save(path)


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle), 1):
        cue = gen.dedupe(build())
        lead = cue["tracks"]["Piano Melodie"]
        words, vowels = syllable_map(lead)
        CURRENT_VOWELS.clear()
        CURRENT_VOWELS.update(vowels)
        base = f"{i:02d}_VilleEtEngagement_{cue['name']}_{gen.BPM}bpm_F"
        mid_path = os.path.join(HERE, "midi", base + ".mid")
        gen.write_midi(cue, mid_path)
        add_lyrics(mid_path, words)
        mix, stems, lufs, peak = gen.render_cue(cue)
        sdir = os.path.join(HERE, "stems", base)
        os.makedirs(sdir, exist_ok=True)
        for j, (name, *_rest) in enumerate(gen.TRACKS, 1):
            fname = f"{j}_{name.replace(' - ', '_').replace(' ', '_')}.wav"
            gen.write_wav(os.path.join(sdir, fname), stems[name], 24)
        wav = os.path.join(HERE, "maquettes", base + ".wav")
        gen.write_wav(wav, mix, 24)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame",
                        "-b:a", "320k", wav[:-4] + ".mp3"], check=True)
        print(f"{base}: {cue['length']:.1f} s, {lufs:.1f} LUFS, crête {peak:.1f} dBFS")


if __name__ == "__main__":
    main()
