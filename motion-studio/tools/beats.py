"""Measure the beat grid of an audio file and write beats.json.

usage: python3 tools/beats.py <audio> <beats.json> [--full]

The pulse is tracked on the low band (< 200 Hz, where the kick lives) so syncopated stabs and off-beat
hats can't pull the grid off the beat. Pass --full for tracks without a clear kick.
"""
import json
import os
import sys

import librosa
import numpy as np

args = [a for a in sys.argv[1:] if not a.startswith("--")]
src, dst = args
y, sr = librosa.load(src, sr=None, mono=True)
hop = 128  # ~2.7 ms at 48 kHz

band = {} if "--full" in sys.argv else {"fmax": 200, "n_mels": 24}
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, **band)
tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=hop, units="time", tightness=200)
tempo = float(np.atleast_1d(tempo)[0])
# Backtracked onsets mark where each hit actually starts.
onsets = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=hop, units="time", backtrack=True)


def snap(t, window=0.05):
    """Move a beat onto the nearest onset, so hits land on the transient, not after it."""
    if len(onsets) == 0:
        return t
    near = onsets[np.argmin(np.abs(onsets - t))]
    return near if abs(near - t) <= window else t


beats = [float(snap(t)) for t in beats]
# The tracker skips the first beat or two; step back one period at a time while there are onsets to land on.
period = 60.0 / tempo
while beats and beats[0] - period > -0.02:
    t = snap(max(0.0, beats[0] - period))
    if abs(t - (beats[0] - period)) > 0.05 and t != 0.0:
        break
    beats.insert(0, max(0.0, t))
beats = [round(t, 4) for t in beats]

with open(dst, "w") as f:
    json.dump(
        {
            "source": os.path.basename(src),
            "tempo": round(tempo, 2),
            "beats": beats,
            # Bar starts assume 4/4 from the first beat; check by ear before relying on them.
            "bars": beats[::4],
            "onsets": [round(float(t), 4) for t in onsets],
        },
        f,
        indent=1,
    )
print(f"beats: {len(beats)} at {tempo:.1f} BPM -> {dst}")
