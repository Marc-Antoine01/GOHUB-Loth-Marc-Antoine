"""List the hard cuts in a rendered film and fail on any shot shorter than --min seconds (default 0.8).
A shot that flashes for a few frames reads as a glitch; this catches it on the real video, not on the timeline.

usage: python3 tools/cuts.py films/<name>/out/<file>.mp4 [--min 0.8] [--threshold 10]
"""
import re, subprocess, sys
args = sys.argv[1:]
video = args[0]
mn = float(args[args.index('--min') + 1]) if '--min' in args else 0.8
th = float(args[args.index('--threshold') + 1]) if '--threshold' in args else 10
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', video, '-vf', f'scdet=threshold={th}', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
cuts = [float(m) for m in re.findall(r'lavfi\.scd\.time:\s*([0-9.]+)', log)]
bounds = [0.0] + cuts + [dur]
bad = []
for a, b in zip(bounds, bounds[1:]):
    flag = b - a < mn
    if flag: bad.append((a, b))
    print(f'{a:6.2f} → {b:6.2f}  {b - a:5.2f} s' + ('   ← too short' if flag else ''))
print(f'{len(cuts)} cuts, {len(bad)} shot(s) under {mn} s')
sys.exit(1 if bad else 0)
