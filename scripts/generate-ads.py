"""
Generate Google Ads creatives for travelnow.info.

Spec (from Google Ads "Add images" dialog, 2026):
  Landscape   1.91:1  recommended 1200 x 628
  Square      1:1     recommended 1200 x 1200
  Portrait    4:5     recommended  960 x 1200
  Tall        9:16    recommended 1080 x 1920

Design language: matches the live site — deep navy gradient backdrop,
sharp `travelnow.info` wordmark, status-coloured dots from the visa
palette (vf / eta / ev / voa / vr), abstract globe motif (wireframe
sphere + radial dot pattern, NO crude continent outline).

Run from project root:
    python scripts/generate-ads.py

Outputs go to ad-*.png in the project root so they are easy to upload
to Google Ads from the same folder. The script is deterministic
(seeded RNG) so re-running produces the same images.
"""
from __future__ import annotations

import math
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ─────────────────────────────────────────────────────────────────────────────
# Palette — pulled from index.html :root CSS so the ads match the site.
BG_DEEP = (5, 7, 13)        # --bg-0
BG_MID = (10, 15, 28)       # --bg-1
BG_GLOW = (40, 80, 150)     # radial glow
FG = (231, 236, 245)        # --fg
FG_DIM = (170, 180, 200)    # --fg-dim
SELF = (96, 165, 250)       # --self (brand blue)
VF = (74, 222, 128)         # --vf
ETA = (45, 212, 191)        # --eta
EV = (163, 230, 53)         # --ev
VOA = (250, 204, 21)        # --voa
VR = (239, 68, 68)          # --vr

STATUS_DOTS = [VF, ETA, EV, VOA, VR]

# ─────────────────────────────────────────────────────────────────────────────
# Fonts — best-effort. We try several system fonts that ship with Windows
# (the user is on Win11) and fall back to PIL's default if nothing matches.
FONT_CANDIDATES = [
    # SF Mono / monospaced first — closest to the site's Geist Mono wordmark.
    "C:/Windows/Fonts/consola.ttf",     # Consolas
    "C:/Windows/Fonts/consolab.ttf",    # Consolas Bold
    "C:/Windows/Fonts/cour.ttf",        # Courier New
    # Sans for taglines.
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
]


def _load_font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    """Pick a font file by intent and load at the given pixel size."""
    if weight == "mono-bold":
        order = ["consolab.ttf", "consola.ttf", "cour.ttf"]
    elif weight == "mono":
        order = ["consola.ttf", "consolab.ttf", "cour.ttf"]
    elif weight == "sans-bold":
        order = ["segoeuib.ttf", "arialbd.ttf", "segoeui.ttf", "arial.ttf"]
    else:
        order = ["segoeui.ttf", "arial.ttf"]
    for tail in order:
        for path in FONT_CANDIDATES:
            if path.endswith(tail) and os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except OSError:
                    continue
    # Last-resort fallback. Default font is bitmap so size is ignored, but
    # the ads will still draw — just less polished.
    return ImageFont.load_default()


# ─────────────────────────────────────────────────────────────────────────────
def _radial_gradient(w: int, h: int, cx: float, cy: float, inner: tuple,
                     outer: tuple, radius: float) -> Image.Image:
    """Soft radial gradient. cx/cy are pixel coords, radius is pixels."""
    img = Image.new("RGB", (w, h), outer)
    px = img.load()
    inv_r = 1.0 / max(radius, 1)
    ir, ig, ib = inner
    orr, og, ob = outer
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) * inv_r
            if d > 1.0:
                continue
            t = 1 - d
            t *= t  # ease-out
            px[x, y] = (
                int(orr + (ir - orr) * t),
                int(og + (ig - og) * t),
                int(ob + (ib - ob) * t),
            )
    return img


def _starfield(w: int, h: int, density: float = 0.0007) -> Image.Image:
    """Sparse white dots, slightly varied. Soft so it doesn't fight text."""
    rng = random.Random(42)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    count = int(w * h * density)
    for _ in range(count):
        x = rng.randrange(w)
        y = rng.randrange(h)
        alpha = rng.choice([40, 55, 80, 110, 160])
        r = rng.choice([0.5, 0.5, 1.0, 1.0, 1.5])
        draw.ellipse([x - r, y - r, x + r, y + r],
                     fill=(255, 255, 255, alpha))
    return img


def _make_background(w: int, h: int) -> Image.Image:
    """Deep-navy base + soft brand-blue glow + starfield."""
    # Base solid; radial gradient is slow at full size, so render small + scale.
    scale = 0.25
    sw, sh = max(int(w * scale), 60), max(int(h * scale), 40)
    grad = _radial_gradient(sw, sh, sw * 0.7, sh * 0.35,
                            inner=(28, 56, 110), outer=BG_DEEP,
                            radius=max(sw, sh) * 0.95)
    grad = grad.resize((w, h), Image.LANCZOS)
    # Second softer glow lower-left (purple-ish, matches site).
    grad2 = _radial_gradient(sw, sh, sw * 0.15, sh * 0.9,
                             inner=(55, 25, 95), outer=BG_DEEP,
                             radius=max(sw, sh) * 0.7)
    grad2 = grad2.resize((w, h), Image.LANCZOS)
    base = Image.blend(grad, grad2, 0.35)
    # Slight overall blur to smooth banding.
    base = base.filter(ImageFilter.GaussianBlur(radius=max(w, h) * 0.004))
    # Stars on top.
    stars = _starfield(w, h)
    base = base.convert("RGBA")
    base.alpha_composite(stars)
    return base.convert("RGB")


def _draw_globe(img: Image.Image, cx: float, cy: float, r: float) -> None:
    """Abstract wireframe globe: gradient sphere + a few meridians/parallels
    + scattered status-coloured dots ON the front-facing hemisphere. No crude
    continent outlines."""
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Sphere gradient: bright top-left to dark bottom-right.
    sphere_size = int(r * 2) + 2
    sphere = Image.new("RGBA", (sphere_size, sphere_size), (0, 0, 0, 0))
    sp = sphere.load()
    cr = sphere_size / 2
    for y in range(sphere_size):
        for x in range(sphere_size):
            dx = x - cr
            dy = y - cr
            dist = math.hypot(dx, dy)
            if dist > cr:
                continue
            # Surface normal approximation; light from upper-left.
            nz = math.sqrt(max(0.0, 1 - (dist / cr) ** 2))
            lx, ly, lz = -0.5, -0.55, 0.7
            lambert = max(0.0, (dx / cr) * lx + (dy / cr) * ly + nz * lz)
            lambert = lambert ** 0.6
            # Base colour: deep teal-blue, brightening toward the light.
            base_r = int(15 + 60 * lambert)
            base_g = int(25 + 95 * lambert)
            base_b = int(50 + 150 * lambert)
            sp[x, y] = (base_r, base_g, base_b, 245)
    overlay.paste(sphere, (int(cx - r), int(cy - r)), sphere)

    # Wireframe: meridians (longitude lines) and parallels (latitude lines).
    line_alpha = 90
    line_col = (130, 170, 220, line_alpha)
    # Outline circle.
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=line_col, width=2)
    # 4 meridians — drawn as ellipses with varying horizontal radii.
    for k in range(1, 4):
        ratio = math.cos(k / 4 * math.pi / 2)
        rx = r * abs(math.sin(k / 4 * math.pi))
        if rx < 4:
            continue
        d.ellipse([cx - rx, cy - r, cx + rx, cy + r],
                  outline=line_col, width=1)
    # 3 parallels — straight ellipses with varying vertical radii.
    for k in range(1, 4):
        ry = r * math.cos(k / 4 * math.pi)
        if abs(ry) < 4:
            continue
        d.ellipse([cx - r, cy - abs(ry), cx + r, cy + abs(ry)],
                  outline=line_col, width=1)

    # Scattered status-coloured passport dots, biased to the visible hemisphere
    # (front of the sphere). Each dot has a soft glow halo.
    rng = random.Random(7)
    # Seeded so every run produces the same poster.
    n = 22
    placed = 0
    attempts = 0
    while placed < n and attempts < 400:
        attempts += 1
        # Random spherical coord biased to front.
        u = rng.random() * 2 - 1
        v = rng.random() * 2 - 1
        if u * u + v * v > 0.92:
            continue
        # Project onto sphere: front face only.
        nz = math.sqrt(1 - u * u - v * v)
        # Skip back-face dots (nz < 0.15 too close to limb → looks crowded).
        if nz < 0.18:
            continue
        px = cx + u * r * 0.95
        py = cy + v * r * 0.95
        col = STATUS_DOTS[rng.randrange(len(STATUS_DOTS))]
        dot_r = rng.choice([3.5, 4.0, 4.5, 5.0, 6.0])
        # Glow.
        halo = (col[0], col[1], col[2], 60)
        d.ellipse([px - dot_r * 2.4, py - dot_r * 2.4,
                   px + dot_r * 2.4, py + dot_r * 2.4], fill=halo)
        d.ellipse([px - dot_r, py - dot_r, px + dot_r, py + dot_r],
                  fill=(col[0], col[1], col[2], 255))
        placed += 1

    # Subtle outer atmosphere glow.
    glow_r = r * 1.18
    glow = Image.new("RGBA", (int(glow_r * 2) + 4, int(glow_r * 2) + 4),
                     (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # Build glow with concentric rings.
    cr2 = glow_r
    for step in range(20):
        alpha = max(0, 35 - step * 2)
        rr = glow_r - step * (glow_r * 0.01)
        gd.ellipse([cr2 - rr, cr2 - rr, cr2 + rr, cr2 + rr],
                   outline=(96, 165, 250, alpha), width=2)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=glow_r * 0.04))
    overlay.alpha_composite(glow, (int(cx - glow_r), int(cy - glow_r)))

    img.alpha_composite(overlay)


def _draw_legend_strip(img: Image.Image, cx: float, cy: float,
                       width: float, label_size: int) -> None:
    """Tiny horizontal legend strip: five status dots with their tag labels.
    Adds product-shape context without taking up a lot of room."""
    items = [(VF, "VISA-FREE"), (ETA, "eTA"), (EV, "eVISA"),
             (VOA, "ON ARRIVAL"), (VR, "REQUIRED")]
    font = _load_font("mono", label_size)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # Measure total width with chosen spacing.
    gap = label_size * 1.0
    dot_r = label_size * 0.45
    cell_widths = []
    for col, label in items:
        bbox = d.textbbox((0, 0), label, font=font)
        cell_widths.append(dot_r * 2 + label_size * 0.5 + (bbox[2] - bbox[0]))
    total = sum(cell_widths) + gap * (len(items) - 1)
    x = cx - total / 2
    for (col, label), cw in zip(items, cell_widths):
        d.ellipse([x, cy - dot_r, x + dot_r * 2, cy + dot_r],
                  fill=(col[0], col[1], col[2], 255))
        bbox = d.textbbox((0, 0), label, font=font)
        th = bbox[3] - bbox[1]
        d.text((x + dot_r * 2 + label_size * 0.5, cy - th / 2 - 2),
               label, fill=(FG_DIM[0], FG_DIM[1], FG_DIM[2], 230),
               font=font)
        x += cw + gap
    img.alpha_composite(overlay)


def _draw_text(img: Image.Image, text: str, pos: tuple, font, fill,
               anchor: str = "lt") -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    if len(fill) == 3:
        fill = fill + (255,)
    d.text(pos, text, fill=fill, font=font, anchor=anchor)
    img.alpha_composite(overlay)


# ─────────────────────────────────────────────────────────────────────────────
# Per-size composition. Each function picks font sizes + placement
# that look right at the target aspect ratio.

def make_landscape(w=1200, h=628) -> Image.Image:
    """Headline layout: text left-half, globe right-half."""
    img = _make_background(w, h).convert("RGBA")

    # Globe on the right.
    globe_r = h * 0.40
    globe_cx = w * 0.78
    globe_cy = h * 0.52
    _draw_globe(img, globe_cx, globe_cy, globe_r)

    # Text on the left.
    pad = int(w * 0.05)
    wordmark = _load_font("mono-bold", int(h * 0.13))
    tagline = _load_font("sans-bold", int(h * 0.07))
    sub = _load_font("sans", int(h * 0.045))

    # Wordmark
    _draw_text(img, "travelnow.info", (pad, int(h * 0.32)),
               wordmark, FG, anchor="lt")
    _draw_text(img, "Visa requirements for", (pad, int(h * 0.50)),
               tagline, FG, anchor="lt")
    _draw_text(img, "every passport.", (pad, int(h * 0.59)),
               tagline, SELF, anchor="lt")
    _draw_text(img,
               "Free · 200+ passports · daily refresh",
               (pad, int(h * 0.74)),
               sub, FG_DIM, anchor="lt")
    return img.convert("RGB")


def make_square(w=1200, h=1200) -> Image.Image:
    """Centered: wordmark top, globe middle, tagline + legend bottom."""
    img = _make_background(w, h).convert("RGBA")

    globe_r = w * 0.27
    globe_cx = w / 2
    globe_cy = h * 0.48
    _draw_globe(img, globe_cx, globe_cy, globe_r)

    wordmark = _load_font("mono-bold", int(w * 0.08))
    tagline = _load_font("sans-bold", int(w * 0.045))
    sub = _load_font("sans", int(w * 0.028))

    _draw_text(img, "travelnow.info", (w / 2, h * 0.12),
               wordmark, FG, anchor="mt")
    _draw_text(img, "Visa requirements for every passport.",
               (w / 2, h * 0.78), tagline, FG, anchor="mt")
    _draw_text(img, "Free · 200+ passports · daily refresh",
               (w / 2, h * 0.85), sub, FG_DIM, anchor="mt")
    _draw_legend_strip(img, w / 2, h * 0.92, w * 0.85, int(w * 0.018))
    return img.convert("RGB")


def make_portrait(w=960, h=1200) -> Image.Image:
    """4:5 portrait — wordmark top, big globe middle, tagline + url bottom."""
    img = _make_background(w, h).convert("RGBA")

    globe_r = w * 0.34
    globe_cx = w / 2
    globe_cy = h * 0.46
    _draw_globe(img, globe_cx, globe_cy, globe_r)

    wordmark = _load_font("mono-bold", int(w * 0.094))
    tagline = _load_font("sans-bold", int(w * 0.052))
    sub = _load_font("sans", int(w * 0.033))

    _draw_text(img, "travelnow.info", (w / 2, h * 0.085),
               wordmark, FG, anchor="mt")
    _draw_text(img, "Where can your passport", (w / 2, h * 0.79),
               tagline, FG, anchor="mt")
    _draw_text(img, "take you?", (w / 2, h * 0.84),
               tagline, SELF, anchor="mt")
    _draw_text(img, "Free · 200+ passports · daily refresh",
               (w / 2, h * 0.91), sub, FG_DIM, anchor="mt")
    _draw_legend_strip(img, w / 2, h * 0.95, w * 0.9, int(w * 0.022))
    return img.convert("RGB")


def make_tall(w=1080, h=1920) -> Image.Image:
    """9:16 tall portrait — big wordmark, huge centered globe, CTA at base."""
    img = _make_background(w, h).convert("RGBA")

    globe_r = w * 0.38
    globe_cx = w / 2
    globe_cy = h * 0.46
    _draw_globe(img, globe_cx, globe_cy, globe_r)

    wordmark = _load_font("mono-bold", int(w * 0.10))
    tagline = _load_font("sans-bold", int(w * 0.052))
    sub = _load_font("sans", int(w * 0.034))

    _draw_text(img, "travelnow.info", (w / 2, h * 0.10),
               wordmark, FG, anchor="mt")
    _draw_text(img, "Pick your passport.", (w / 2, h * 0.74),
               tagline, FG, anchor="mt")
    _draw_text(img, "See the world.", (w / 2, h * 0.78),
               tagline, SELF, anchor="mt")
    _draw_text(img,
               "Free · 200+ passports · daily refresh",
               (w / 2, h * 0.84),
               sub, FG_DIM, anchor="mt")
    _draw_legend_strip(img, w / 2, h * 0.89, w * 0.9, int(w * 0.023))
    return img.convert("RGB")


# ─────────────────────────────────────────────────────────────────────────────
SPECS = [
    ("ad-landscape-1200x628.png", make_landscape),
    ("ad-square-1200x1200.png",    make_square),
    ("ad-portrait-960x1200.png",   make_portrait),
    ("ad-tall-1080x1920.png",      make_tall),
]


def main() -> int:
    for name, fn in SPECS:
        out = os.path.join(OUT_DIR, name)
        print(f"... rendering {name}", flush=True)
        img = fn()
        img.save(out, format="PNG", optimize=True)
        size_kb = os.path.getsize(out) / 1024
        print(f"  -> {out}  ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
