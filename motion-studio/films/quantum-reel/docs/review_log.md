# SUPERPOSITION: review log

Scores: hook in the first 2 s · readability at phone size (390 px sheet) · motion quality · variety · art direction · sound sync.

## Build passes (stills per shot, before the first full sheet)
Problems found and fixed while building, in order:
- The detections were invisible: the title-drop bar plane sat just in front of the screen and rendered opaque black while "off". It is now only drawn from the drop.
- The chase camera sat ahead of the particle and grazed the barrier. It now trails the particle, lines up on the right slit and **threads it** (the slit is 0.12 wide; the path holds x = 0.35, y = 0 through it).
- The wavefronts drawn as rings in the floor plane read as edge-on lines; as half-cylinder sheets they were invisible from inside. Replaced by a **ripple tank**: a floor shader that sums the two circular waves from the slits and squares them, so the interference hyperbolas draw themselves as the front spreads.
- A white blob in the qubit shot: the fresnel shader took `pow()` of a slightly negative number (NaN), which the bloom smeared. All fresnel bases are clamped; a guard pass zeroes NaN/Inf and caps highlights before the bloom.
- Readouts were projected with the previous frame's camera (`lookAt` does not refresh `matrixWorld`): fixed in `aim()`. This was also carried state.
- Glare in the machine and the search: the backlight's specular on the glossy floor and on the mirror-polished plates. The rim light is set per shot, the floor is matte, the plates brushed.
- Grover readout: P fell during the oracle's dip. The oracle flips the sign only, so the bar dips below the floor but P holds, then rises.
- Purity check failed at 15.0 s (PSNR 39.8 dB): `will-change` promoted the title layer, and Chromium rasterized its text differently depending on history. Removed.

## Round 1 (full sheet)
| Hook | Read 390 | Motion | Variety | Art | Sound |
|---|---|---|---|---|---|
| 7 | 6 | 8 | 9 | 8 | 8 |
1. The cut into the qubit opened on an all-white frame (the camera started inside the tip's glow) → the tip now opens as a star and the camera pulls out to the sphere.
2. Mono readouts unreadable at phone width, serif lines fighting the 3D → mono 22 → 27 px and lighter, a dark halo behind all type (a halo, not a glow).
3. The collapse was illegible and the end card arrived before the point was centred → a single ring leaves the answer, the point starts large and settles, the camera reaches it by 27.1 s and the card waits for it.
Also: the hook gained a slow macro orbit with dust for parallax and a `1 photon · |ψ⟩` readout. The 3–4 s stretch after the slit was dark: the slit edges brighter, trails on the two ghosts, and the ripple-tank front fast enough to be seen. The last point lost its bloom in S7's fog, so emissives are now never fogged (the seam at 29.5 s matches frame 0).

## Round 2 (full sheet)
| Hook | Read 390 | Motion | Variety | Art | Sound |
|---|---|---|---|---|---|
| 8 | 7 | 9 | 9 | 8 | 8 |
1. Mono still small at phone width → 30 px; the end credit (it signs the reel) at 34 px.
2. "Colder than space." and "Every answer at once." crossed their subjects → a lens shift moves the machine and the field a third right while the lines are up.
3. Found while checking out of order: the gold copy of the title kept `visibility: visible`, which shows through a hidden parent, so it leaked into later shots (carried state the purity check's frame order could not see). It now uses opacity.

## Round 3
| Hook | Read 390 | Motion | Variety | Art | Sound |
|---|---|---|---|---|---|
| 8 | 8 | 9 | 9 | 9 | 8 |
All 8+: full render.
