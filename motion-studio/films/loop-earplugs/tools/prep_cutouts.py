"""Prepare the shop cutouts for the 2.5D shader: crop to alpha, bleed colour under transparent pixels (no dark fringes
when the shader resamples), and derive a depth map from the silhouette (every part of a Loop is a rounded tube, so its
height across the tube is a half-circle of the local tube radius).

usage: python3 tools/prep_cutouts.py <source dir with *_01 PNGs> ; writes assets/cut/<name>.webp and assets/depth/<name>.png
"""
import sys, glob, os, numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = {
 'switch2-emerald': 'switch__PDP_SWITCH_EMERALD_1*', 'switch2-black': 'switch__PDP_SWITCH_BLACK_1*', 'switch2-gold': 'switch__PDP_SWITCH_GOLD_1*', 'switch2-silver': 'switch__PDP_SWITCH_SILVER_1*',
 'experience2-black': 'experience__PDP_EXPERIENCE2_BLACK_01*', 'experience2-gold': 'experience__PDP_EXPERIENCE2_GOLD_01*', 'experience2-silver': 'experience__PDP_EXPERIENCE2_SILVER_01*',
 'experience2plus-rosegold': 'experience-plus__PDP_EXPERIENCE2PLUS_ROSEGOLD_01*', 'experience2plus-gold': 'experience-plus__PDP_EXPERIENCE2PLUS_GOLD_01*',
 'quiet2-violet': 'quiet__PDP_QUIET_VIOLET_01*', 'quiet2-mint': 'quiet__PDP_QUIET_MINT_01*', 'quiet2-white': 'quiet__PDP_QUIET_WHITE_01*',
 'dream-lilac': 'dream__PDP_DREAM_LILAC_1*', 'dream-peach': 'dream__PDP_DREAM_PEACH_1*', 'dream-black': 'dream__PDP_DREAM_BLACK_1*',
 'engage2-clear': 'engage__PDP_ENGAGE2_CLEAR_01*', 'engage2-rose': 'engage__PDP_ENGAGE2_ROSE_01*', 'engage2-dusk': 'engage__PDP_ENGAGE2_DUSK_01*',
 'engage2plus-clear': 'engage-plus__PDP_ENGAGE2PLUS_CLEAR_01*', 'engage2plus-rose': 'engage-plus__PDP_ENGAGE2PLUS_ROSE_01*',
 'kids2-berryblue': 'engage-kids__PDP_ENGAGE_KIDS_2_BERRY_BLUE_01*', 'kids2-oceanorange': 'engage-kids__PDP_ENGAGE_KIDS_2_OCEAN_ORANGE_01*', 'kids2-watermelon': 'engage-kids__PDP_ENGAGE_KIDS_2_WATERMELON_RED_01*',
}

def depth_of(a):
    m = a > 0.5
    d = nd.distance_transform_edt(m)
    k = max(9, int(np.percentile(d[m], 97) * 2.2)) | 1
    r = nd.gaussian_filter(nd.maximum_filter(d, size=k), k / 6)
    h = np.sqrt(np.clip(r ** 2 - (r - np.minimum(d, r)) ** 2, 0, None))
    h = nd.gaussian_filter(h / (h.max() + 1e-6), 2)
    return h * nd.gaussian_filter(m.astype(np.float32), 1.5)

def bleed(rgb, a):
    # every transparent pixel takes the colour of the nearest opaque one
    idx = nd.distance_transform_edt(a < 0.5, return_distances=False, return_indices=True)
    return rgb[idx[0], idx[1]]

src = sys.argv[1]
os.makedirs('assets/cut', exist_ok=True); os.makedirs('assets/depth', exist_ok=True)
for name, pat in SRC.items():
    im = Image.open(sorted(glob.glob(os.path.join(src, pat)))[0]).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 40
    im = im.crop((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad))
    im.thumbnail((1800, 1800), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float32)
    a = arr[..., 3] / 255
    arr[..., :3] = bleed(arr[..., :3], a)
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save(f'assets/cut/{name}.webp', quality=92, method=6)
    Image.fromarray((depth_of(a) * 255).astype(np.uint8)).resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f'assets/depth/{name}.png', optimize=True)
    print(name, im.size)
