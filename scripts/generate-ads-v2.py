"""
Second batch of Google Ads creatives for travelnow.info — 4 distinct visual
concepts, each rendered at the 4 spec sizes (16 PNGs total).

Concepts:
  stat    — typographic: huge "200+ passports / one map" statement.
  dotglobe— halftone globe built from a lat/lon dot grid, a few dots in
            status colours (matches the product without a crude map).
  ticket  — stylized boarding-pass card: "YOU → WORLD".
  words   — stacked status words in the site's traffic-light palette.

Sizes (Google Ads "Add images" dialog):
  landscape 1200x628 (1.91:1) · square 1200x1200 (1:1)
  portrait 960x1200 (4:5)     · tall 1080x1920 (9:16)

Run from project root:  python scripts/generate-ads-v2.py
Outputs ad2-<concept>-<WxH>.png in the project root. Deterministic (seeded).
"""
from __future__ import annotations

import math
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Palette (matches index.html :root)
BG_DEEP = (5, 7, 13)
FG = (231, 236, 245)
FG_DIM = (170, 180, 200)
FG_MUTE = (107, 117, 145)
SELF = (96, 165, 250)
VF = (74, 222, 128)
ETA = (45, 212, 191)
EV = (163, 230, 53)
VOA = (250, 204, 21)
VR = (239, 68, 68)
STATUS_DOTS = [VF, ETA, EV, VOA, VR]

FONT_DIR = "C:/Windows/Fonts/"


def _font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    order = {
        "mono-bold": ["consolab.ttf", "consola.ttf", "cour.ttf"],
        "mono": ["consola.ttf", "cour.ttf"],
        "sans-bold": ["segoeuib.ttf", "arialbd.ttf", "arial.ttf"],
        "sans": ["segoeui.ttf", "arial.ttf"],
        "sans-black": ["seguibl.ttf", "segoeuib.ttf", "arialbd.ttf"],
    }[kind]
    for tail in order:
        p = FONT_DIR + tail
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _radial(w, h, cx, cy, inner, outer, radius):
    img = Image.new("RGB", (w, h), outer)
    px = img.load()
    inv = 1.0 / max(radius, 1)
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) * inv
            if d > 1.0:
                continue
            t = (1 - d) ** 2
            px[x, y] = tuple(int(o + (i - o) * t) for i, o in zip(inner, outer))
    return img


def _bg(w, h, glow=(28, 56, 110), gx=0.7, gy=0.35):
    scale = 0.22
    sw, sh = max(int(w * scale), 50), max(int(h * scale), 36)
    g1 = _radial(sw, sh, sw * gx, sh * gy, glow, BG_DEEP, max(sw, sh) * 0.95)
    g2 = _radial(sw, sh, sw * 0.15, sh * 0.92, (55, 25, 95), BG_DEEP,
                 max(sw, sh) * 0.7)
    base = Image.blend(g1.resize((w, h), Image.LANCZOS),
                       g2.resize((w, h), Image.LANCZOS), 0.35)
    base = base.filter(ImageFilter.GaussianBlur(radius=max(w, h) * 0.004))
    # starfield
    rng = random.Random(11)
    star = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(star)
    for _ in range(int(w * h * 0.00055)):
        x, y = rng.randrange(w), rng.randrange(h)
        a = rng.choice([35, 50, 75, 105, 150])
        r = rng.choice([0.5, 0.5, 1.0, 1.0, 1.5])
        sd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, a))
    out = base.convert("RGBA")
    out.alpha_composite(star)
    return out


def _text(img, s, pos, font, fill, anchor="mm"):
    d = ImageDraw.Draw(img)
    if len(fill) == 3:
        fill = fill + (255,)
    d.text(pos, s, font=font, fill=fill, anchor=anchor)


def _dots_row(img, cx, cy, dot_r, gap):
    d = ImageDraw.Draw(img)
    total = len(STATUS_DOTS) * dot_r * 2 + gap * (len(STATUS_DOTS) - 1)
    x = cx - total / 2 + dot_r
    for col in STATUS_DOTS:
        d.ellipse([x - dot_r * 2, cy - dot_r * 2, x + dot_r * 2, cy + dot_r * 2],
                  fill=col + (55,))
        d.ellipse([x - dot_r, cy - dot_r, x + dot_r, cy + dot_r],
                  fill=col + (255,))
        x += dot_r * 2 + gap


# ───────────────────────────── Concept: stat ───────────────────────────────
def concept_stat(w, h):
    img = _bg(w, h, gx=0.5, gy=0.42)
    m = min(w, h)
    tall = h / w > 1.4
    _text(img, "travelnow.info", (w / 2, h * (0.10 if tall else 0.13)),
          _font("mono-bold", int(m * 0.065)), FG)
    big = _font("sans-black", int(m * (0.30 if not tall else 0.26)))
    _text(img, "200+", (w / 2, h * 0.38), big, SELF)
    _text(img, "passports. One map.",
          (w / 2, h * (0.38 + (0.13 if tall else 0.20))),
          _font("sans-bold", int(m * 0.065)), FG)
    _text(img, "See where yours goes — visa-free, eVisa, on arrival.",
          (w / 2, h * (0.66 if not tall else 0.62)),
          _font("sans", int(m * 0.030)), FG_DIM)
    _dots_row(img, w / 2, h * (0.78 if not tall else 0.72),
              int(m * 0.012), int(m * 0.05))
    _text(img, "Free · updated daily", (w / 2, h * (0.88 if not tall else 0.82)),
          _font("mono", int(m * 0.026)), FG_MUTE)
    return img.convert("RGB")


# ─────────────────────────── Concept: dotglobe ─────────────────────────────
def concept_dotglobe(w, h):
    img = _bg(w, h, gx=0.5, gy=0.40)
    d = ImageDraw.Draw(img)
    m = min(w, h)
    tall = h / w > 1.4
    wide = w / h > 1.4
    R = m * (0.26 if not (tall or wide) else 0.32)
    cx, cy = w / 2, h * (0.45 if not tall else 0.42)
    if wide:
        cx = w * 0.74  # landscape: globe right, text left
    rng = random.Random(23)
    # Halftone sphere: dots on a lat/lon grid, orthographic projection,
    # front hemisphere only. Size falls off toward the limb; ~12% of dots
    # pick a status colour, the rest stay muted blue.
    steps = 26
    for i in range(steps + 1):
        lat = -math.pi / 2 + math.pi * i / steps
        ring = max(1, int(2 * steps * math.cos(lat)))
        for j in range(ring):
            lon = -math.pi + 2 * math.pi * j / ring + (i % 2) * (math.pi / ring)
            # rotate the globe a little so it doesn't look gridded straight-on
            lon2 = lon + 0.5
            x3 = math.cos(lat) * math.sin(lon2)
            y3 = math.sin(lat)
            z3 = math.cos(lat) * math.cos(lon2)
            if z3 <= 0.05:
                continue
            px = cx + x3 * R
            py = cy - y3 * R
            dr = (m * 0.0085) * (0.45 + 0.55 * z3)
            if rng.random() < 0.12:
                col = STATUS_DOTS[rng.randrange(len(STATUS_DOTS))]
                a = 235
            else:
                shade = int(105 + 90 * z3)
                col = (shade - 40, shade - 12, min(255, shade + 60))
                a = 170
            d.ellipse([px - dr, py - dr, px + dr, py + dr], fill=col + (a,))
    # soft ring
    d.ellipse([cx - R * 1.07, cy - R * 1.07, cx + R * 1.07, cy + R * 1.07],
              outline=(96, 165, 250, 70), width=max(2, int(m * 0.004)))
    if wide:
        # Landscape: text block on the left half, globe on the right.
        lx = w * 0.06
        _text(img, "travelnow.info", (lx, h * 0.22),
              _font("mono-bold", int(m * 0.10)), FG, anchor="lm")
        _text(img, "Every country.", (lx, h * 0.42),
              _font("sans-bold", int(m * 0.085)), FG, anchor="lm")
        _text(img, "One answer.", (lx, h * 0.55),
              _font("sans-bold", int(m * 0.085)), SELF, anchor="lm")
        _text(img, "Do you need a visa? Pick your", (lx, h * 0.70),
              _font("sans", int(m * 0.045)), FG_DIM, anchor="lm")
        _text(img, "passport and see.", (lx, h * 0.77),
              _font("sans", int(m * 0.045)), FG_DIM, anchor="lm")
    else:
        _text(img, "travelnow.info", (w / 2, h * (0.075 if tall else 0.09)),
              _font("mono-bold", int(m * 0.065)), FG)
        _text(img, "Every country. One answer.",
              (w / 2, h * (0.82 if not tall else 0.74)),
              _font("sans-bold", int(m * 0.052)), FG)
        _text(img, "Do you need a visa? Pick your passport and see.",
              (w / 2, h * (0.89 if not tall else 0.80)),
              _font("sans", int(m * 0.028)), FG_DIM)
        if tall:
            _dots_row(img, w / 2, h * 0.86, int(m * 0.012), int(m * 0.05))
    return img.convert("RGB")


# ──────────────────────────── Concept: ticket ──────────────────────────────
def concept_ticket(w, h):
    img = _bg(w, h, gx=0.6, gy=0.3)
    d = ImageDraw.Draw(img)
    m = min(w, h)
    tall = h / w > 1.4
    # Card geometry
    cw = w * (0.78 if not tall else 0.86)
    ch = h * (0.52 if not tall else 0.40)
    cx0 = (w - cw) / 2
    cy0 = h * (0.24 if not tall else 0.27)
    rad = m * 0.035
    card = (18, 26, 44, 245)
    d.rounded_rectangle([cx0, cy0, cx0 + cw, cy0 + ch], radius=rad, fill=card,
                        outline=(96, 165, 250, 90), width=max(2, int(m * 0.003)))
    pad = m * 0.045
    # Header row
    _text(img, "TRAVELNOW.INFO", (cx0 + pad, cy0 + pad * 1.1),
          _font("mono-bold", int(m * 0.032)), SELF, anchor="lm")
    _text(img, "WORLD PASS", (cx0 + cw - pad, cy0 + pad * 1.1),
          _font("mono", int(m * 0.026)), FG_MUTE, anchor="rm")
    # Big route
    midy = cy0 + ch * 0.46
    _text(img, "YOU", (cx0 + cw * 0.22, midy),
          _font("sans-black", int(m * 0.085)), FG)
    _text(img, "→", (cx0 + cw * 0.5, midy),
          _font("sans-bold", int(m * 0.075)), SELF)
    _text(img, "WORLD", (cx0 + cw * 0.76, midy),
          _font("sans-black", int(m * 0.085)), VF)
    # Perforation
    py = cy0 + ch * 0.68
    dash = m * 0.018
    x = cx0 + pad
    while x < cx0 + cw - pad:
        d.line([x, py, x + dash, py], fill=(96, 165, 250, 110),
               width=max(1, int(m * 0.0025)))
        x += dash * 2
    # Fields row
    fy = cy0 + ch * 0.84
    fields = [("STATUS", "VISA-FREE", VF), ("PASSPORTS", "200+", FG),
              ("REFRESH", "DAILY", ETA), ("PRICE", "FREE", VOA)]
    fx = cx0 + pad
    fw = (cw - pad * 2) / len(fields)
    for label, value, col in fields:
        _text(img, label, (fx, fy - m * 0.022),
              _font("mono", int(m * 0.018)), FG_MUTE, anchor="lm")
        _text(img, value, (fx, fy + m * 0.014),
              _font("mono-bold", int(m * 0.026)), col, anchor="lm")
        fx += fw
    # Tagline under the card
    _text(img, "Where can your passport take you?",
          (w / 2, cy0 + ch + h * (0.10 if not tall else 0.08)),
          _font("sans-bold", int(m * 0.045)), FG)
    _text(img, "Interactive visa map · free · no signup",
          (w / 2, cy0 + ch + h * (0.16 if not tall else 0.13)),
          _font("sans", int(m * 0.027)), FG_DIM)
    dots_y = min(cy0 + ch + h * (0.22 if not tall else 0.18), h - m * 0.05)
    _dots_row(img, w / 2, dots_y, int(m * 0.011), int(m * 0.045))
    return img.convert("RGB")


# ──────────────────────────── Concept: words ───────────────────────────────
def concept_words(w, h):
    img = _bg(w, h, gx=0.3, gy=0.3)
    m = min(w, h)
    tall = h / w > 1.4
    left = w * 0.10
    _text(img, "travelnow.info", (left, h * 0.10),
          _font("mono-bold", int(m * 0.055)), FG, anchor="lm")
    words = [("Visa-free.", VF), ("eVisa.", EV),
             ("On arrival.", VOA), ("Visa required.", VR)]
    big = _font("sans-black", int(m * (0.105 if not tall else 0.09)))
    y = h * (0.28 if not tall else 0.26)
    step = h * (0.135 if not tall else 0.11)
    for s, col in words:
        _text(img, s, (left, y), big, col, anchor="lm")
        y += step
    _text(img, "Know before you book.", (left, y + step * 0.25),
          _font("sans-bold", int(m * 0.052)), FG, anchor="lm")
    _text(img, "Pick your passport — the map shows the rest.",
          (left, y + step * 0.62),
          _font("sans", int(m * 0.029)), FG_DIM, anchor="lm")
    return img.convert("RGB")


# ─────────────────────────────────────────────────────────────────────────────
CONCEPTS = {
    "stat": concept_stat,
    "dotglobe": concept_dotglobe,
    "ticket": concept_ticket,
    "words": concept_words,
}
SIZES = [(1200, 628), (1200, 1200), (960, 1200), (1080, 1920)]


def main() -> int:
    for cname, fn in CONCEPTS.items():
        for (w, h) in SIZES:
            name = f"ad2-{cname}-{w}x{h}.png"
            out = os.path.join(OUT_DIR, name)
            print(f"... {name}", flush=True)
            fn(w, h).save(out, format="PNG", optimize=True)
            print(f"  -> {os.path.getsize(out)/1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
