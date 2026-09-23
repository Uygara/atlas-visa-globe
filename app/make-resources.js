// make-resources.js — the source images for the app icon and launch screen, drawn
// from the same P< mark as the site (scripts/make-icons.js) by headless Chrome.
//
//   node make-resources.js          writes app/resources/*.png
//   npx capacitor-assets generate   turns them into every iOS/Android size
//
// icon-only.png        1024, full-bleed navy tile (iOS rounds it itself)
// icon-foreground.png  1024, the mark alone in the Android adaptive-icon safe zone
// icon-background.png  1024, plain navy (adaptive-icon background layer)
// splash.png           2732, paper board with the mark   /  splash-dark.png: navy board

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const puppeteer = require(path.join(ROOT, "tools", "node_modules", "puppeteer-core"));

const NAVY = "#1E3A5F", PAPER = "#F4F2E8", FOIL = "#D3B36C", BOARD_LIGHT = "#F1ECDD", BOARD_DARK = "#0F1B2D";
// The mark on a 64-unit grid, without a background tile.
const MARK = (ink) => `<path d="M15 47V17h11a8 8 0 0 1 0 16H15" fill="none" stroke="${ink}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 20 41.5 31.5 50 43" fill="none" stroke="${FOIL}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>`;
// scale: how much of the canvas the 64-unit mark box fills.
const doc = (size, bg, ink, scale) => `<!doctype html><style>html,body{margin:0;background:${bg || "transparent"}}svg{display:block;width:${size}px;height:${size}px}</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${bg ? "" : ""}<g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${MARK(ink)}</g></svg>`;

function chromePath() {
  const c = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((x) => fs.existsSync(x));
  if (!c) throw new Error("No Chrome found — set CHROME_PATH");
  return c;
}

(async () => {
  const out = path.join(__dirname, "resources");
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run"] });
  try {
    const page = await browser.newPage();
    for (const [file, size, bg, ink, scale, transparent] of [
      ["icon-only.png", 1024, NAVY, PAPER, 1.0, false],
      ["icon-foreground.png", 1024, null, PAPER, 0.62, true],   // adaptive icons crop to the inner ~66%
      ["icon-background.png", 1024, NAVY, NAVY, 0.0001, false],
      ["splash.png", 2732, BOARD_LIGHT, NAVY, 0.34, false],
      ["splash-dark.png", 2732, BOARD_DARK, PAPER, 0.34, false],
    ]) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
      await page.setContent(doc(size, bg, ink, scale));
      await page.screenshot({ path: path.join(out, file), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
      console.log(`✓ resources/${file} (${size}×${size})`);
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
