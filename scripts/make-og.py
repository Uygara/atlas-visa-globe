"""Generate the brand assets:
   - assets/og.png       (1200x630, social share card)
   - assets/favicon.png  (192x192, browser tab + apple-touch)
   - assets/favicon.svg  (preferred by modern browsers)

Design: clean white background, light-blue continent silhouettes drawn from a
small embedded coastline polygon set, hairline latitude lines, slate wordmark.

Run:  python scripts/make-og.py"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ASSETS, exist_ok=True)

# ─── Palette ────────────────────────────────────────────────────────────────
BG_WHITE       = (255, 255, 255)
BG_TINT        = (244, 248, 255)          # OG card tint
CONTINENT_FILL = (207, 224, 244)          # pale blue
CONTINENT_STROKE = (91, 116, 142)         # slate
GRATICULE      = (200, 215, 230)          # very light blue, latitude lines
WORDMARK       = (26, 34, 54)             # dark slate
TAGLINE        = (107, 117, 145)          # muted
ACCENT         = (96, 165, 250)           # CSS --self (accent dot)

# ─── Coastline shapes (low-poly, hand-trimmed Mercator-ish for visual only) ─
# Each shape is a list of (x_norm, y_norm) in [0,1] coordinates relative to a
# 360x180 lon/lat space (lon: -180..180, lat: 90..-90).
# Not geographically accurate at sub-degree level — that's intentional; we want
# a CLEAN minimal silhouette, not a real map.
def lonlat(lon, lat):
    """Convert lon,lat to normalised [0,1] x,y."""
    return ((lon + 180.0) / 360.0, (90.0 - lat) / 180.0)

CONTINENTS = [
    # North America (Alaska→Greenland→Florida→Mexico)
    [(-168, 65), (-160, 70), (-140, 70), (-100, 80), (-80, 78), (-60, 80),
     (-50, 70), (-55, 60), (-70, 50), (-80, 45), (-75, 35), (-82, 25),
     (-90, 20), (-100, 20), (-105, 30), (-117, 32), (-125, 40), (-130, 55),
     (-145, 60), (-160, 60), (-168, 65)],
    # Central America + Caribbean blob (rough)
    [(-95, 18), (-90, 16), (-85, 12), (-78, 9), (-83, 8), (-92, 14), (-95, 18)],
    # South America
    [(-78, 12), (-70, 11), (-60, 5), (-50, 0), (-40, -5), (-35, -8),
     (-38, -20), (-45, -30), (-58, -40), (-68, -52), (-72, -54), (-75, -45),
     (-80, -30), (-80, -20), (-82, -10), (-78, -5), (-78, 12)],
    # Europe + western Russia (combined silhouette)
    [(-10, 36), (-8, 43), (-5, 48), (2, 51), (5, 58), (12, 65), (18, 68),
     (28, 70), (35, 67), (45, 66), (55, 68), (65, 68), (75, 70), (85, 70),
     (90, 65), (85, 55), (70, 50), (55, 45), (45, 40), (35, 38),
     (28, 36), (20, 38), (12, 38), (5, 36), (-5, 36), (-10, 36)],
    # Africa
    [(-17, 14), (-15, 22), (-10, 30), (0, 32), (10, 33), (20, 32), (30, 31),
     (35, 25), (40, 15), (50, 12), (51, 5), (45, -5), (40, -15), (35, -25),
     (28, -32), (20, -34), (15, -30), (12, -20), (10, -10), (8, 0), (5, 5),
     (0, 8), (-10, 8), (-17, 14)],
    # Asia (eastern bulge — China, India, SE Asia)
    [(60, 55), (75, 55), (90, 50), (100, 53), (115, 50), (125, 52), (135, 50),
     (140, 45), (135, 35), (125, 30), (120, 25), (115, 20), (108, 12),
     (105, 5), (98, 5), (95, 12), (90, 15), (85, 22), (80, 25), (75, 22),
     (70, 25), (62, 30), (58, 38), (55, 45), (58, 50), (60, 55)],
    # India peninsula (sub-shape, draws on top of Asia)
    [(70, 22), (75, 22), (80, 18), (82, 10), (78, 8), (75, 12), (72, 18), (70, 22)],
    # Australia
    [(115, -12), (125, -12), (135, -15), (145, -15), (153, -25), (148, -38),
     (140, -38), (130, -32), (118, -22), (114, -22), (115, -12)],
    # Antarctica strip (purely decorative — we never draw it on the icon)
    # Greenland (separate)
    [(-50, 60), (-30, 60), (-22, 72), (-30, 82), (-50, 82), (-55, 75), (-50, 60)],
    # British Isles
    [(-8, 50), (-6, 55), (-2, 58), (0, 58), (1, 51), (-2, 49), (-6, 49), (-8, 50)],
    # Japan archipelago
    [(130, 33), (140, 36), (142, 42), (138, 44), (132, 38), (130, 33)],
    # Indonesia / Philippines clusters (decorative dots)
    [(100, 0), (110, -2), (118, -5), (122, -2), (120, 5), (110, 4), (100, 0)],
    [(120, 7), (125, 10), (127, 16), (122, 17), (118, 13), (120, 7)],
]

def project_continent(coords, cx, cy, w, h):
    """Map (lon,lat) coords into pixels inside a bounding rect [cx-w/2 .. cx+w/2]."""
    out = []
    for lon, lat in coords:
        x_norm, y_norm = lonlat(lon, lat)
        px = cx - w / 2 + x_norm * w
        py = cy - h / 2 + y_norm * h
        out.append((px, py))
    return out

def load_font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeuil.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_world_map(draw, cx, cy, w, h,
                   show_graticule=True, stroke_width=1, fill=CONTINENT_FILL,
                   stroke=CONTINENT_STROKE):
    """Draws the continents as filled blue silhouettes with thin slate outline."""
    # Optional graticule (equator + 30°N/S)
    if show_graticule:
        for lat in (-30, 0, 30):
            _, y_norm = lonlat(0, lat)
            y = cy - h / 2 + y_norm * h
            draw.line([(cx - w / 2, y), (cx + w / 2, y)],
                      fill=GRATICULE, width=1)

    for shape in CONTINENTS:
        pts = project_continent(shape, cx, cy, w, h)
        # Filled body
        draw.polygon(pts, fill=fill)
        # Stroke
        if stroke_width > 0:
            for i in range(len(pts)):
                a, b = pts[i], pts[(i + 1) % len(pts)]
                draw.line([a, b], fill=stroke, width=stroke_width)

# ─── Open Graph card (1200×630) ─────────────────────────────────────────────
def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG_TINT)
    draw = ImageDraw.Draw(img)

    # Right-side world map (more visual weight on the right)
    map_cx, map_cy = 820, 320
    map_w, map_h = 700, 350
    draw_world_map(draw, map_cx, map_cy, map_w, map_h, stroke_width=1)

    # Accent dot — a small pin on the map (Europe area for symbolism)
    pin_x = map_cx - map_w / 2 + (170.0 / 360.0) * map_w   # ~10°E
    pin_y = map_cy - map_h / 2 + (40.0 / 180.0) * map_h    # ~50°N
    rr = 8
    draw.ellipse((pin_x - rr, pin_y - rr, pin_x + rr, pin_y + rr),
                 fill=ACCENT, outline=BG_TINT)

    # Wordmark + tagline on the left
    title_font = load_font(108, bold=True)
    tag_font   = load_font(30)
    sub_font   = load_font(20)
    domain_font = load_font(22, bold=True)

    draw.text((80, 210), "Atlas", font=title_font, fill=WORDMARK)
    draw.text((84, 340), "Where can your passport take you?", font=tag_font, fill=TAGLINE)
    draw.text((84, 392), "200 passports · daily refresh · free", font=sub_font, fill=(150, 158, 175))
    draw.text((84, 540), "travelnow.info", font=domain_font, fill=ACCENT)

    out = os.path.join(ASSETS, "og.png")
    img.save(out, "PNG", optimize=True)
    print(f"OK wrote {out} ({os.path.getsize(out)} bytes)")

# ─── Favicon (192×192) — globe inside a circle, no text ─────────────────────
def make_favicon():
    S = 192
    img = Image.new("RGB", (S, S), BG_WHITE)
    draw = ImageDraw.Draw(img)

    cx, cy = S // 2, S // 2
    r = 86

    # Outer ring (very thin)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r),
                 outline=CONTINENT_STROKE, width=2)

    # World map clipped to the circle. We draw the whole world, then crop with
    # a circular mask.
    map_w, map_h = r * 2 - 6, r * 2 - 6
    map_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    map_draw = ImageDraw.Draw(map_layer)
    draw_world_map(map_draw, cx, cy, map_w, map_h,
                   show_graticule=False, stroke_width=0, fill=CONTINENT_FILL)

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse((cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2), fill=255)
    img.paste(map_layer, (0, 0), mask)

    # Accent pin
    rr = 5
    pin_x = cx + 10
    pin_y = cy - 18
    draw.ellipse((pin_x - rr, pin_y - rr, pin_x + rr, pin_y + rr),
                 fill=ACCENT, outline=BG_WHITE)

    out = os.path.join(ASSETS, "favicon.png")
    img.save(out, "PNG", optimize=True)
    print(f"OK wrote {out} ({os.path.getsize(out)} bytes)")

# ─── SVG favicon ────────────────────────────────────────────────────────────
# Modern browsers prefer vector; build a path string from the same coastlines.
def make_favicon_svg():
    # Map continents into a unit viewBox.
    paths = []
    for shape in CONTINENTS:
        pts = []
        for lon, lat in shape:
            x_norm, y_norm = lonlat(lon, lat)
            # Map normalised x,y inside a 64x64 disk centred at (32,32) with r=28
            cx, cy, r = 32, 32, 28
            px = cx - r + x_norm * 2 * r
            py = cy - r + y_norm * 2 * r
            pts.append(f"{px:.1f},{py:.1f}")
        paths.append("M" + " L".join(pts) + " Z")
    map_d = " ".join(paths)
    fill = "#cfe0f4"
    stroke = "#5b748e"
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<defs><clipPath id="c"><circle cx="32" cy="32" r="28"/></clipPath></defs>'
        f'<rect width="64" height="64" fill="white"/>'
        f'<circle cx="32" cy="32" r="29" fill="white" stroke="{stroke}" stroke-width="1.4"/>'
        f'<g clip-path="url(#c)"><path d="{map_d}" fill="{fill}"/></g>'
        '<circle cx="38" cy="26" r="1.8" fill="#60a5fa" stroke="white" stroke-width="0.6"/>'
        '</svg>'
    )
    out = os.path.join(ASSETS, "favicon.svg")
    with open(out, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"OK wrote {out} ({os.path.getsize(out)} bytes)")

if __name__ == "__main__":
    make_og()
    make_favicon()
    make_favicon_svg()
