#!/usr/bin/env node
// Brand icons from one drawing: assets/favicon.svg (the tile), favicon.png (192),
// apple-touch-icon.png (180, full-bleed: iOS rounds it itself), icon-512.png.
//
//   node scripts/make-icons.js
//
// The tile is the site's mark on the passport-navy board: a white "P" and a gold
// "<" — the opening of every machine-readable zone. Rendered by headless Chrome
// (CHROME_PATH to override); the SVG is the source of truth.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const puppeteer = require(path.join(ROOT, "tools", "node_modules", "puppeteer-core"));

const NAVY = "#1E3A5F", PAPER = "#F4F2E8", FOIL = "#D3B36C";
const GLYPH = (bg, rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64"${rx ? ` rx="${rx}"` : ""} fill="${bg}"/>
  <path d="M15 47V17h11a8 8 0 0 1 0 16H15" fill="none" stroke="${PAPER}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M50 20 41.5 31.5 50 43" fill="none" stroke="${FOIL}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

function chromePath() {
  const c = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((x) => fs.existsSync(x));
  if (!c) throw new Error("No Chrome found — set CHROME_PATH");
  return c;
}

async function main() {
  const assets = path.join(ROOT, "assets");
  fs.writeFileSync(path.join(assets, "favicon.svg"), GLYPH(NAVY, 12));

  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run"] });
  try {
    const page = await browser.newPage();
    for (const [file, size, svg] of [
      ["favicon.png", 192, GLYPH(NAVY, 12)],
      ["icon-512.png", 512, GLYPH(NAVY, 12)],
      ["apple-touch-icon.png", 180, GLYPH(NAVY, 0)],
    ]) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
      await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
      await page.screenshot({ path: path.join(assets, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
      console.log(`✓ assets/${file} (${size}×${size})`);
    }
  } finally { await browser.close(); }
}

main().catch((e) => { console.error(e); process.exit(1); });
