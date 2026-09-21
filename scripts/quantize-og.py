"""Squeeze rendered social cards to palette PNGs (used by scripts/og-cards.js).

    python scripts/quantize-og.py assets/og/tr-en.png ...

The cards are flat inks + antialiased text, so 64 colours with no dithering is
visually lossless and takes a 90 KB screenshot down to ~25 KB."""

import sys
from PIL import Image

for path in sys.argv[1:]:
    im = Image.open(path).convert("RGB")
    im = im.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    im.save(path, optimize=True)
print(f"quantized {len(sys.argv) - 1} file(s)")
