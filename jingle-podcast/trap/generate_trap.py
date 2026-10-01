#!/usr/bin/env python3
"""« Ville et Engagement », version trap.

Reprend la proposition carte blanche (le motif calqué sur le nom, la cloche de mairie, le tampon,
les applaudissements) et l'habille en trap :
  - 140 BPM, ressenti « half-time » (caisse claire sur le 3e temps) ;
  - fa mineur, grille épique Db – Eb – Fm (VI – VII – i) ;
  - basse 808 tenue avec glissandos, charleston en roulements (doubles, triples, quadruples croches) ;
  - mélodie de cloche trap (pluck métallique), nappe sombre, montée et silence avant le drop.

Le motif : VIL – l'é – en – GA – GE-MENT sur do – fa – sol – lab – DO.

Réutilise ../generate.py et ../carte-blanche/generate_carte_blanche.py.
Usage : python3 generate_trap.py
"""

import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "carte-blanche"))
import generate as gen  # noqa: E402
import generate_carte_blanche as cb  # noqa: E402
from generate import n, note, band, noise, hz, SR  # noqa: E402

gen.BPM = 140
gen.BEAT = 60.0 / gen.BPM
gen.KEY = "Fm"

KICK, SNARE, HAT = gen.KICK, gen.SNARE, gen.HAT
OHAT, RISER = 46, 55  # charleston ouvert ; montée (note « splash » en General MIDI)
TAMPON, GROUP_CLAP = cb.TAMPON, cb.GROUP_CLAP

VOICE = cb.VOICE
BELL_TRAP = "Cloche Trap (melodie)"
PAD = "Nappe sombre"
B808 = "808"
TOWN_BELL = "Cloche de mairie"
DRUMS = "Batterie Trap - Tampon - Mains"

gen.CHORDS = {
    "Db": (None, ["Db3", "F3", "Ab3"], "Db2", None),
    "Eb": (None, ["Eb3", "G3", "Bb3"], "Eb2", None),
    "Fm": (None, ["F3", "Ab3", "C4"], "F2", None),
    "C": (None, ["C3", "E3", "G3"], "C2", None),
}

gen.TRACKS = [
    (VOICE, 0, 52, 100, 64),
    (BELL_TRAP, 1, 112, 92, 76),
    (PAD, 2, 89, 80, 52),
    (B808, 3, 38, 110, 64),
    (TOWN_BELL, 4, 14, 100, 70),
    (DRUMS, 9, 0, 110, 64),
]


# --------------------------------------------------------------------------
# Motif (rythme du nom, en valeurs doublées pour le half-time)
# --------------------------------------------------------------------------
NAME_RHYTHM = [(0, 1.5, "C4", 0), (1.5, .5, "F4", -10), (2, 1, "G4", -6), (3, 1, "Ab4", -2)]


def name_motif(t0, vel=100, ment=2.0):
    """VIL – l'é – en – GA, puis GE-MENT sur le temps fort suivant."""
    return [n(t0 + o, d, p, vel + dv) for o, d, p, dv in NAME_RHYTHM] + [n(t0 + 4, ment, "C5", vel + 10)]


def syllable_map(lead):
    offsets = {0: 0, 1.5: 1, 2: 2, 3: 3}
    words, vowels = {}, {}
    for s, d, p, v in sorted(lead):
        idx = 4 if p == note("C5") and s % 4 == 0 else offsets.get(s % 4)
        if idx is not None:
            words[s], vowels[s] = cb.SYLLABLES[idx], cb.VOWELS[idx]
    return words, vowels


# --------------------------------------------------------------------------
# Sons trap
# --------------------------------------------------------------------------
def inst_bell_trap(p, dur, vel):
    """Cloche trap : synthèse FM (rapport 3,5), attaque métallique qui s'adoucit vite."""
    f = hz(p)
    t = np.arange(int((dur + 0.9) * SR)) / SR
    index = 2.4 * np.exp(-t / 0.12) + 0.3
    y = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / 0.55)
    y += 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
    return y * np.clip(t / 0.001, 0, 1)


def inst_pad_dark(p, dur, vel):
    return gen.inst_strings(p, dur, vel)


def inst_riser(dur):
    t = np.arange(int(dur * SR)) / SR
    ramp = (t / dur) ** 2
    sweep = np.sin(2 * np.pi * np.cumsum(300 + 2500 * (t / dur) ** 2) / SR) * 0.15
    return (band(noise(len(t)), 1500, 9000) * 0.6 + sweep) * ramp


def inst_drums(p, dur, vel):
    if p == RISER:
        return inst_riser(dur)
    if p == OHAT:
        t = np.arange(int(0.35 * SR)) / SR
        return band(noise(len(t)), 6500) * np.exp(-t / 0.09) * 0.7
    if p == KICK:
        t = np.arange(int(0.3 * SR)) / SR
        f = 55 + 140 * np.exp(-t / 0.02)
        return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12))
    return cb.inst_drums(p, dur, vel)


def render_808(notes, total_s, gain):
    """808 monophonique : oscillateur continu, glissando quand les notes s'enchaînent, saturation douce."""
    nsamp = int((total_s + 3) * SR)
    freq = np.zeros(nsamp)
    amp = np.zeros(nsamp)
    prev_f, prev_end = None, -1.0
    for s, d, p, v in sorted(notes):
        i0, i1 = int(s * gen.BEAT * SR), int((s + d) * gen.BEAT * SR)
        rel = int(0.06 * SR)
        seg = np.arange(min(i1 + rel, nsamp) - i0) / SR
        f = hz(p)
        if prev_f is not None and s - prev_end < 0.05:  # notes liées : glissando
            fcurve = f + (prev_f - f) * np.exp(-seg / 0.045)
        else:
            fcurve = f * (1 + 0.6 * np.exp(-seg / 0.018))  # « punch » d'attaque
        freq[i0:i0 + len(seg)] = fcurve
        held = d * gen.BEAT
        env = np.exp(-seg / 1.8) * np.clip(seg / 0.002, 0, 1)
        env = np.where(seg > held, env * np.exp(-(seg - held) / 0.02), env)
        amp[i0:i0 + len(seg)] = np.maximum(amp[i0:i0 + len(seg)], env * (v / 127) ** 1.2)
        prev_f, prev_end = f, s + d
    phase = 2 * np.pi * np.cumsum(freq) / SR
    y = np.tanh(2.2 * np.sin(phase)) * amp * gain
    return np.stack([y, y], axis=1)


gen.MIX = {
    VOICE: (None, 0.34, 0.0, 0.45),
    BELL_TRAP: (inst_bell_trap, 0.16, 0.2, 0.40),
    PAD: (inst_pad_dark, 0.20, -0.2, 0.55),
    B808: (None, 0.15, 0.0, 0.0),
    TOWN_BELL: (cb.inst_bell, 0.22, 0.15, 0.50),
    DRUMS: (inst_drums, 0.30, 0.0, 0.10),
}

_render_track = gen.render_track  # déjà enrichi par la carte blanche (voix sur les voyelles)


def render_track(name, notes, total_s):
    if name == B808:
        return render_808(notes, total_s, gen.MIX[name][1])
    return _render_track(name, notes, total_s)


gen.render_track = render_track


# --------------------------------------------------------------------------
# Batterie trap
# --------------------------------------------------------------------------
def hats(start, end, step, v0=60, v1=None, accent=True):
    out, t, i = [], start, 0
    while t < end - 1e-6:
        v = v0 if v1 is None else v0 + (v1 - v0) * (t - start) / max(end - start, 1e-6)
        out.append(n(round(t, 4), min(step, .2), HAT, v + (8 if accent and i % 2 == 0 else 0)))
        t += step
        i += 1
    return out


def snare(t, vel=110):
    return [n(t, .25, SNARE, vel), n(t, .25, GROUP_CLAP, vel - 6)]


def final_hit(t):
    return [n(t, .25, KICK, 124), n(t, .25, TAMPON, 120), n(t, .25, GROUP_CLAP, 112)]


# --------------------------------------------------------------------------
# Les deux propositions
# --------------------------------------------------------------------------
def cue_logo():
    lead = name_motif(0, 104, ment=3)
    changes = [(0, "Db", 2), (2, "Eb", 2)]
    final = [(4, "Fm", 7)]
    drums = [n(0, .25, KICK, 112), n(1.5, .25, KICK, 96)] + snare(2)
    drums += hats(0, 2, .5) + hats(2, 3, .25) + hats(3, 3.5, 1 / 6, 60, 90) + hats(3.5, 4, .125, 70, 104)
    drums += final_hit(4)
    bass = [n(0, 2, "Db2", 108), n(2, 2, "Eb2", 108), n(4, 6, "F2", 120)]
    return dict(
        name="logo", title="Ville et Engagement (trap) - logo", length=5.0, fade=0.9,
        markers=[(0, "Ville et Engagement"), (4, "Cloche + 808")],
        tracks={
            VOICE: cb.voices(lead),
            BELL_TRAP: gen.transpose(lead, 12, 0.8),
            PAD: gen.strings(changes + final, 70),
            B808: bass,
            TOWN_BELL: [n(4, 4, "F4", 120), n(6, 4, "F4", 84)],
            DRUMS: drums,
        })


def cue_jingle():
    # Groove continu du début à la fin : la densité monte par paliers, sans coupure, jusqu'à la cloche finale.
    lead = name_motif(0, 98, ment=2) + name_motif(8, 106, ment=2)
    changes = [(0, "Db", 2), (2, "Eb", 2), (4, "Fm", 4),
               (8, "Db", 2), (10, "Eb", 2), (12, "Fm", 2), (14, "C", 2)]
    final = [(16, "Fm", 4)]

    # 0–8 : groove posé (kick, caisse claire, charleston en croches), relance en doubles croches vers la mesure 3
    drums = [n(0, .25, KICK, 112), n(1.5, .25, KICK, 92), n(2, .25, SNARE, 100)]
    drums += [n(4, .25, KICK, 112), n(4, .25, TAMPON, 100), n(5.75, .25, KICK, 94), n(6, .25, SNARE, 104)]
    drums += hats(0, 3.5, .5, 52) + hats(3.5, 4, .25, 56, 70)
    drums += hats(4, 6, .5, 56) + hats(6, 7, .25, 60, 76) + hats(7, 8, 1 / 6, 66, 96)
    # 8–16 : même groove, plus dense (mains, tampon, roulements)
    drums += [n(8, .25, KICK, 120), n(9.75, .25, KICK, 104)] + snare(10)
    drums += hats(8, 10, .5) + hats(10, 11, .25) + hats(11, 11.5, 1 / 6, 64, 92) + hats(11.5, 12, .5)
    drums += [n(11.5, .25, TAMPON, 100)]
    drums += [n(12, .25, KICK, 120), n(13.5, .25, KICK, 100), n(13.5, .5, OHAT, 76)] + snare(14)
    drums += hats(12, 13.5, .5) + hats(14, 15, .25) + hats(15, 15.5, .125, 70, 100) + hats(15.5, 16, 1 / 6, 84, 112)
    drums += final_hit(16)

    bass = [n(0, 1.5, "Db2", 104), n(1.5, .5, "Db2", 92), n(2, 2, "Eb2", 104),
            n(4, 1.75, "F2", 108), n(5.75, .25, "F2", 96), n(6, 2, "F2", 104),
            n(8, 1.5, "Db2", 118), n(9.75, .25, "Db2", 100), n(10, 1.5, "Eb2", 116), n(11.5, .5, "Eb2", 104),
            n(12, 1.5, "F2", 118), n(13.5, .5, "F2", 100), n(14, 1.5, "C2", 116), n(15.5, .5, "E2", 108),
            n(16, 4, "F2", 124)]
    return dict(
        name="jingle", title="Ville et Engagement (trap) - jingle", length=8.6, fade=0.9,
        markers=[(0, "Ville et Engagement"), (8, "Ville et Engagement (2)"), (16, "Cloche + 808")],
        tracks={
            VOICE: cb.voices(lead),
            BELL_TRAP: gen.transpose(lead, 12, 0.8),
            PAD: gen.strings(changes + final, 66),
            B808: bass,
            TOWN_BELL: [n(16, 4, "F4", 122), n(18, 3, "F4", 86)],
            DRUMS: drums,
        })


CUT_BEAT = 6  # juste après « GE-MENT »


def cue_jingle_coupe():
    """Le jingle continu, qui s'éteint en fondu juste après « GE-MENT » (temps 6)."""
    cue = cue_jingle()
    for name, notes in cue["tracks"].items():
        # plus aucune note ne démarre après la coupure ; celles en cours résonnent naturellement
        cue["tracks"][name] = [x for x in notes if x[0] < CUT_BEAT]
    cue.update(name="jingle-coupe", title="Ville et Engagement (trap) - jingle court en fondu",
               length=CUT_BEAT * gen.BEAT + 1.0, fade=1.2,
               markers=[(0, "Ville et Engagement"), (4, "GE-MENT"), (CUT_BEAT, "Fondu")])
    return cue


def mute_envelope(nsamp, a, b, depth=0.02, ramp=0.008):
    """Coupe tout entre les temps a et b (fondus de 8 ms) : le « silence » avant le drop."""
    t = np.arange(nsamp) / SR
    ta, tb = a * gen.BEAT, b * gen.BEAT
    down = np.clip((t - ta) / ramp, 0, 1)
    up = np.clip((tb - t) / ramp, 0, 1)
    return 1 - (1 - depth) * np.minimum(down, up)


def main():
    for d in ("midi", "stems", "maquettes"):
        os.makedirs(os.path.join(HERE, d), exist_ok=True)
    for i, build in enumerate((cue_logo, cue_jingle, cue_jingle_coupe), 1):
        cue = gen.dedupe(build())
        words, vowels = syllable_map([x for x in cue["tracks"][VOICE] if x[2] >= note("C4")])
        cb.CURRENT_VOWELS.clear()
        # les voix graves (octave inférieure) chantent la même voyelle au même instant
        cb.CURRENT_VOWELS.update(vowels)
        base = f"{i:02d}_VilleEtEngagement_trap_{cue['name']}_{gen.BPM}bpm_Fm"
        mid_path = os.path.join(HERE, "midi", base + ".mid")
        gen.write_midi(cue, mid_path)
        cb.add_lyrics(mid_path, words)
        mix, stems, lufs, peak = gen.render_cue(cue)
        for a, b in cue.get("mute", []):
            g = mute_envelope(len(mix), a, b)
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
