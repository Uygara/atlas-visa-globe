"""Generate /assets/og.png (1200x630 Open Graph image) and /assets/favicon.png (192x192).
Run with `python scripts/make-og.py`. Output paths are deterministic — re-running overwrites.

No external assets needed; we draw the brand mark in pure code so the result is
reproducible and tiny (~15 KB)."""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ASSETS, exist_ok=True)

# Brand palette (matches the site CSS)
BG_TOP    = (5, 7, 13)       # --bg-0
BG_MID    = (10, 15, 28)
BG_GRAD   = (32, 50, 88)     # subtle blue glow
FG        = (231, 236, 245)  # --fg
FG_DIM    = (170, 180, 200)
ACCENT    = (96, 165, 250)   # --self
VF        = (74, 222, 128)   # --vf
EV        = (163, 230, 53)
VOA       = (250, 204, 21)
VR        = (239, 68, 68)

def load_font(size, bold=False):
    """Try a couple of common font paths; fall back to PIL default."""
    candidates = [
        # Windows
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def radial_gradient_bg(w, h, center=(800, 250), inner=BG_GRAD, outer=BG_TOP, falloff=600):
    """Hand-rolled radial gradient — fast enough for one-off generation."""
    img = Image.new("RGB", (w, h), BG_TOP)
    px = img.load()
    cx, cy = center
    fx = falloff
    for y in range(h):
        for x in range(w):
            dx = x - cx
            dy = y - cy
            d = (dx * dx + dy * dy) ** 0.5
            if d >= fx:
                continue
            t = 1 - d / fx
            # Quadratic falloff so the center is brighter, edges fade smoothly
            t = t * t
            r = int(outer[0] + (inner[0] - outer[0]) * t * 0.4)
            g = int(outer[1] + (inner[1] - outer[1]) * t * 0.4)
            b = int(outer[2] + (inner[2] - outer[2]) * t * 0.4)
            px[x, y] = (r, g, b)
    return img

def draw_globe(draw, cx, cy, r, ring_color=ACCENT):
    """A stylised globe icon: outer disk, meridians, equator, dots for cities."""
    # Outer sphere with subtle inner shading
    draw.ellipse((cx - r, cy - r, cx + r, cy + r),
                 outline=ring_color, width=4, fill=(15, 22, 38))
    # Equator
    draw.ellipse((cx - r, cy - r // 4, cx + r, cy + r // 4),
                 outline=(60, 100, 160), width=2)
    # Two meridians
    draw.ellipse((cx - r // 3, cy - r, cx + r // 3, cy + r),
                 outline=(60, 100, 160), width=2)
    draw.ellipse((cx - r * 2 // 3, cy - r, cx + r * 2 // 3, cy + r),
                 outline=(60, 100, 160), width=2)
    # Status dots
    colors_at = [
        (cx - r * 0.55, cy - r * 0.30, VF),   # Europe
        (cx + r * 0.40, cy - r * 0.20, VF),   # Asia
        (cx - r * 0.30, cy + r * 0.10, EV),   # Africa
        (cx + r * 0.15, cy + r * 0.40, VOA),  # Oceania
        (cx - r * 0.10, cy - r * 0.55, EV),   # northern
        (cx + r * 0.60, cy + r * 0.15, VR),   # east
    ]
    for x, y, col in colors_at:
        rr = 7
        draw.ellipse((x - rr, y - rr, x + rr, y + rr), fill=col, outline=(0, 0, 0))

# ─── Open Graph (1200×630) ──────────────────────────────────────────────────
def make_og():
    W, H = 1200, 630
    img = radial_gradient_bg(W, H, center=(880, 280), inner=BG_GRAD, falloff=520)
    draw = ImageDraw.Draw(img)

    # Globe on the right side
    draw_globe(draw, cx=900, cy=H // 2, r=200)

    # Word-mark + tagline on the left
    title_font = load_font(112, bold=True)
    tag_font   = load_font(34)
    sub_font   = load_font(22)

    draw.text((80, 200), "Atlas", font=title_font, fill=FG)
    draw.text((84, 340), "Where can your passport take you?", font=tag_font, fill=FG_DIM)
    draw.text((84, 400), "200 passports · daily refresh · free", font=sub_font, fill=(120, 130, 150))

    # Domain footer
    domain_font = load_font(22, bold=True)
    draw.text((84, H - 70), "travelnow.info", font=domain_font, fill=ACCENT)

    out = os.path.join(ASSETS, "og.png")
    img.save(out, "PNG", optimize=True)
    print(f"✓ wrote {out}  ({os.path.getsize(out)} bytes)")

# ─── Favicon (192×192) ──────────────────────────────────────────────────────
def make_favicon():
    S = 192
    img = Image.new("RGB", (S, S), BG_TOP)
    draw = ImageDraw.Draw(img)
    draw_globe(draw, cx=S // 2, cy=S // 2, r=78)
    out = os.path.join(ASSETS, "favicon.png")
    img.save(out, "PNG", optimize=True)
    print(f"✓ wrote {out}  ({os.path.getsize(out)} bytes)")

if __name__ == "__main__":
    make_og()
    make_favicon()
