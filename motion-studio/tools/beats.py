"""Measure the beat grid of an audio file and write beats.json.

usage: python3 tools/beats.py <audio> <beats.json>
"""
import json
import os
import sys

import librosa
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
y, sr = librosa.load(src, sr=None, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
# Small hop for timing resolution (~2.7 ms at 48 kHz); backtracked onsets mark where each hit actually starts.
hop = 128
onsets = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units="time", backtrack=True)


def snap(t, window=0.05):
    """Move a tracked beat onto the nearest onset, so hits land on the transient, not after it."""
    if len(onsets) == 0:
        return t
    near = onsets[np.argmin(np.abs(onsets - t))]
    return near if abs(near - t) <= window else t


beats = [round(float(snap(t)), 4) for t in beats]

with open(dst, "w") as f:
    json.dump(
        {
            "source": os.path.basename(src),
            "tempo": round(float(np.atleast_1d(tempo)[0]), 2),
            "beats": beats,
            # Bar starts assume 4/4 from the first detected beat; check by ear before relying on them.
            "bars": beats[::4],
            "onsets": [round(float(t), 4) for t in onsets],
        },
        f,
        indent=1,
    )
print(f"beats: {len(beats)} at {float(np.atleast_1d(tempo)[0]):.1f} BPM -> {dst}")
