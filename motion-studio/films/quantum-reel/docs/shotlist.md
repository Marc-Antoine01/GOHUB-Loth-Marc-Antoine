# SUPERPOSITION: shot list (30 s, 1920×1080 @ 30 fps)

Score: original, **120 BPM** (beat 0.5 s, bar 2 s, 15 bars), A minor. Beat numbers below are indices in `beats.json`.

| # | Time | Beats | Shot | Craft on show | Type |
|---|---|---|---|---|---|
| S1 | 0–8 s | 0–15 | **The double slit.** One gold point breathes in the void (ticks on beats 0–3). On beat 4 it launches; the camera tracks it side-on through a barrier with two slits, and it splits into two ghost paths. Behind, a screen catches detections one by one; the camera arcs round to face it as thousands of hits build the interference fringes. | particles as data, camera arc, depth | serif: *One particle.* (b9) *Two paths.* (b11) mono readout by the screen: hit count |
| S2 | 8–10 s | 16–19 | **Title drop.** Half a beat of silence, then the hit: the fringes snap into vertical bars that wipe into the word *Superposition*, every letter drawn twice (two states, offset) until they collapse onto each other on beat 18. | kinetic type, pattern-to-type match | serif 300 px; mono: `a qubit is 0 and 1 until it is measured` |
| S3 | 10–14 s | 20–27 | **The qubit.** A glass Bloch sphere; the gold state vector sweeps a spiral and leaves a ribbon trail; the camera orbits 100°. A live readout rides the tip: `θ 1.571  φ 0.785`. | 3D, shaders (fresnel glass, ribbon), live data | serif: *The qubit.* |
| S4 | 14–18 s | 28–35 | **Entanglement.** Two spheres linked by a braided helix. On beat 32 one is measured (gold ring), and both vectors snap to opposite poles on the same frame. The camera pulls back fast: they are far apart, and a distance readout counts up to 1,203 km (Micius satellite, 2017). | mirrored motion, scale reveal | serif: *Entangled.* mono: `measure one, know the other` |
| S5 | 18–22 s | 36–43 | **The machine.** The gold dilution-refrigerator "chandelier": five plates, rods, coaxial cables coiling down. The camera cranes down through the plates; a readout steps 300 K → 4 K → 1 K → 0.1 K → 0.015 K as each plate passes. | hard-surface 3D, PBR gold, crane | serif: *Colder than space.* |
| S6 | 22–26 s | 44–51 | **The search.** Into the chip: a 16×16 field of 256 bars (every answer of 8 qubits) at equal height, rippling. Grover iterations on the beat: the marked bar rises gold while the others sink (true amplitudes, 12 iterations for N = 256). | data viz, procedural motion | serif: *Every answer at once.* (b45) *The right one, amplified.* (b48) mono: `grover search · N = 256` |
| S7 | 26–30 s | 52–59 | **Collapse.** The hit: every bar falls into the gold one, which shrinks to a point: the same point as frame 0. The end card types beside it. In the last beat the card clears and only the point is left, so the reel loops. | match cut, loop | serif: *Superposition* mono: `a quantum computing reel · motion, 3D, type & sound: Claude` |

## Sound map
- Ticks under the opening point (b0–3), a pitch-rising pluck for each detection burst, granular hiss whose density follows the hit count.
- Riser into the drop (b14–15), half a beat of silence, a sub impact plus a chord on b16, a glass ping when the letters collapse (b18).
- A FM bell for the qubit, two pings hard-panned on the same sample for entanglement (b32), a deep metallic thunk per plate (S5),
  a rising arpeggio note per Grover iteration (S6), and the final impact with a reverse swell (b52).
- Mix to −14 LUFS; every hit sits on beats.json.
