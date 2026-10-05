# Reference grammar: "Introducing Skills for the Legora Agent" (whatships.com, 47 s)

Source: `legora-skills.mp4` (47 s, 1920×1080 @ 30 fps, from video.twimg.com; git-ignored, reference only).
Analysis: `ffmpeg` scene detection, a 1 fps contact sheet, and librosa on the soundtrack.

Take the grammar, never the content.

## The edit (from the video)
- **No hard cuts.** Scene detection finds zero cuts above 0.25 in 47 s. Everything is one continuous camera: drifts, push-ins, racks of focus, and objects passing the lens.
- **Beat map:** title (0–3 s) → kinetic line with a **word wheel** ("Teach the Agent your standards / processes / preferences / perspectives", neighbours faded above and below, ≈1 word per beat) → the prompt box assembles and files drop in (6–12 s) → **an infinite room of tiles** (12–13 s) → floating category tiles in depth (13–16 s) → **one tile is chosen**, the others fly away, it stacks into layers and flips to its content (16–22 s, the musical breath) → the hero "Working" panel with satellite tables (22–32 s) → **extreme close-up** on a UI detail (Yes / No buttons, shallow DOF) → documents fan out in 3D, "Send" (32–38 s) → the tagline swaps one word ("your way" becomes "without limits"), then a white field with the logo.
- **Light:** soft diagonal light sweeps cross the frame continuously; the palette is near-monochrome with one brand colour (the logo).
- **Type:** small, quiet, often a single line; the motion carries the energy, not the size.

## The music (librosa)
- **Tempo:** a 72 BPM pulse with 144 BPM subdivisions, in both halves.
- **Key:** A minor (Krumhansl correlation 0.60).
- **Energy:** steady from 0.5 to 14 s; **a breath from about 14.5 to 21 s** (−37 to −49 dB RMS, against about −24 dB elsewhere); full again from 22 s; a fade to silence at 43–47 s.
- **Brightness:** the spectral centroid moves between 1 and 3.9 kHz: bright plucks and airy textures over a soft low end.

## Grammar read from the poster
- **Space:** many UI panels float in one soft 3D space at different depths, each slightly rotated (≈5–12° on X and Y). No ground, no horizon.
- **Hierarchy by focus:** one hero panel, sharp and frontal, in the centre third; satellites around it are smaller, cropped by the frame edge and **out of focus** (depth of field).
- **Material:** frosted, translucent panels with large radii (~24 px at 1440), a hairline inner edge, soft long shadows, no glow.
- **Satellites are abstract:** titled panels ("… Table", "… Summary") whose bodies are **skeleton lines** (grey bars), not readable text. Only the hero panel carries readable copy.
- **The hero shows a process:** a request bubble, then a "Working" state with a vertical step list. Each step has a bullet on a thread, the active one is highlighted in a pill, and the last one is still typing.
- **Light:** soft key light from the top right, falling off to a cool shade at the bottom left. Low contrast, near-monochrome, colour only where the product speaks.
- **Type:** neutral grotesk; the product's own UI sizes, scaled up by the camera rather than enlarged in layout.

## Translation to CHUV Formation
| Reference | Our film |
|---|---|
| Frosted neutral panels | Frosted **mint and white** panels in a **forest-green** space (the Formation colorway) |
| Skeleton satellites | Satellites = the site's real components with skeleton bodies (category headings readable, rows as bars) |
| Hero step list "Working" | S04's path: Apprentissage → Bachelor → Master → Spécialiste → MD-PhD as a live step list, with the active step in the signal-green pill |
| Soft DOF hierarchy | Blur by distance from the focal plane; one sharp plane per beat |
| Soft key light top right | A radial light on the green space (texture, not a gradient behind a title) plus a soft shadow under each panel |
