#!/usr/bin/env node
// Per-passport social cards: assets/og/<iso>-en.png and <iso>-tr.png (1200x630).
//
//   node scripts/og-cards.js            render the cards whose numbers changed
//   node scripts/og-cards.js --force    render all of them
//   node scripts/og-cards.js tr us      only these passports
//
// Each /passport/<iso>/ page used to share one generic image, so a shared link
// looked the same for all 200 passports. The card is the passport's identity page
// in miniature: flag + name, the headline number, the rank as a stamp, the MRZ and
// the status bar — drawn by headless Chrome from the site's own tokens and fonts,
// so it can't drift from the site. Needs a local Chrome (CHROME_PATH to override)
// and, for the size squeeze, Python with Pillow (scripts/quantize-og.py).
//
// The numbers are a snapshot: a card is re-rendered only when its numbers (or the
// template) change, and shows the month rather than the day, so a daily data run
// doesn't churn 400 binaries. Re-run this after a batch of visa-data changes.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const puppeteer = require(path.join(ROOT, "tools", "node_modules", "puppeteer-core"));
const { BRAND_MARK } = require("./partials");
const { DATA, SNAPSHOT, LOC, computeRanks, passportName } = require("./generate-seo");

const OUT = path.join(ROOT, "assets", "og");
const MANIFEST = path.join(OUT, "manifest.json");
const TEMPLATE_VERSION = 3;
const FORCE = process.argv.includes("--force");
const ONLY = process.argv.slice(2).filter((a) => /^[a-z]{2}$/i.test(a)).map((a) => a.toUpperCase());

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
};
const TXT = {
  en: { eyebrow: "PASSPORT", rank: "GLOBAL RANK", evisa: (n) => `${n} counting eVisas`, updated: (m) => `Data · ${m}` },
  tr: { eyebrow: "PASAPORT", rank: "DÜNYA SIRALAMASI", evisa: (n) => `e-Vize dahil ${n}`, updated: (m) => `Veri · ${m}` },
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function chromePath() {
  const cands = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  const found = cands.find((c) => fs.existsSync(c));
  if (!found) throw new Error("No Chrome found — set CHROME_PATH");
  return found;
}

// Everything a card shows, per passport and language.
function facts(iso, lang, ranks) {
  const c = DATA.COUNTRIES.find((x) => x.iso2 === iso);
  if (!c) return null;
  const t = DATA.tally(iso);
  const r = ranks.get(iso);
  const date = String(DATA.SNAPSHOT_DATE || "").slice(0, 7); // 2026-09
  const [y, m] = date.split("-");
  return {
    iso, lang, flag: c.flag, name: passportName(iso, lang),
    mob: DATA.mobilityScore(t), acc: DATA.accessScore(t), rank: r ? r.rank : null,
    counts: DATA.tally(iso), mrz: DATA.mrzLines(iso),
    month: m ? `${MONTHS[lang][Number(m) - 1]} ${y}` : "",
  };
}

const STATUS_ORDER = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];
const nameSize = (s) => (s.length <= 9 ? 150 : s.length <= 14 ? 124 : s.length <= 22 ? 96 : 74);

function cardHtml(f, tokensCss) {
  const L = TXT[f.lang], S = LOC[f.lang];
  const bar = STATUS_ORDER.filter((s) => f.counts[s] > 0)
    .map((s) => `<i style="flex:${f.counts[s]} 0 0;background:var(--${s})"></i>`).join("");
  return `<!doctype html><html lang="${f.lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400..700&family=Sofia+Sans+Extra+Condensed:wght@600..850&family=DM+Mono:wght@400;500&display=swap">
<style>${tokensCss}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:var(--paper)}
.card{position:relative;width:1200px;height:630px;box-sizing:border-box;background:var(--paper);color:var(--ink);font-family:var(--font-sans)}
.edge{position:absolute;inset:16px;border:2px solid var(--rule-strong)}
.edge::after{content:"";position:absolute;inset:6px;border:1px solid var(--rule)}
.top{position:absolute;left:52px;right:52px;top:44px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:12px;font:800 38px/1 var(--font-display);letter-spacing:.005em;color:var(--ink)}
.brand svg{width:38px;height:38px}
.brand .tld{font:500 22px var(--font-mono);color:var(--ink-3);letter-spacing:0}
.band{font:500 15px var(--font-mono);letter-spacing:.2em;color:var(--ink-4)}
.eyebrow{position:absolute;left:56px;top:116px;font:500 21px var(--font-mono);letter-spacing:.2em;color:var(--ink-3)}
.idrow{position:absolute;left:56px;top:142px;width:770px;display:flex;align-items:center;gap:26px}
.flag{font-size:118px;line-height:1;flex:none}
.name{font:850 ${nameSize(f.name)}px/.9 var(--font-display);letter-spacing:-.005em;color:var(--ink)}
.score{position:absolute;left:56px;top:318px;display:flex;align-items:center;gap:30px}
.n{font:850 236px/.78 var(--font-display);color:var(--ink);letter-spacing:-.01em}
.cap{font:500 33px/1.2 var(--font-sans);color:var(--ink-2);max-width:470px}
.sub{display:block;margin-top:12px;font:500 24px var(--font-mono);color:var(--ink-3);letter-spacing:.02em}
.stamp{position:absolute;right:66px;top:150px;transform:rotate(-4deg);padding:16px 30px 12px;text-align:center;
  border:5px solid var(--accent);outline:2px solid var(--accent);outline-offset:5px;border-radius:6px;color:var(--accent)}
.stamp b{display:block;font:850 118px/.95 var(--font-display);letter-spacing:.01em}
.stamp span{display:block;font:600 17px var(--font-mono);letter-spacing:.18em;margin-bottom:4px}
.mrz{position:absolute;left:56px;bottom:82px;font:500 22px/1.3 var(--font-mono);letter-spacing:.09em;color:var(--ink-4);white-space:pre}
.month{position:absolute;right:56px;bottom:88px;font:500 19px var(--font-mono);letter-spacing:.1em;color:var(--ink-3)}
.bar{position:absolute;left:34px;right:34px;bottom:34px;height:22px;display:flex;gap:3px}
.bar i{display:block;border-radius:2px}
</style></head><body><div class="card">
<div class="edge"></div>
<div class="top"><div class="brand">${BRAND_MARK}<span>travelnow<span class="tld">.info</span></span></div><div class="band">${esc(S.docBand)}</div></div>
<div class="eyebrow">${esc(L.eyebrow)} · ${f.iso}</div>
<div class="idrow"><span class="flag">${f.flag}</span><span class="name">${esc(f.name)}</span></div>
<div class="score"><span class="n">${f.mob}</span><div class="cap">${esc(S.scoreLabel)}${f.acc > f.mob ? `<span class="sub">${esc(L.evisa(f.acc))}</span>` : ""}</div></div>
${f.rank ? `<div class="stamp"><span>${esc(L.rank)}</span><b>#${f.rank}</b></div>` : ""}
<div class="mrz">${esc(f.mrz[0])}\n${esc(f.mrz[1])}</div>
<div class="month">${esc(L.updated(f.month))}</div>
<div class="bar">${bar}</div>
</div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const all = Object.keys(SNAPSHOT).sort();
  const ranks = computeRanks(all);
  const tokensCss = fs.readFileSync(path.join(ROOT, "assets", "tokens.css"), "utf8")
    .replace(/@import[^;]+;/g, ""); // fonts come from the <link> below

  const todo = [];
  for (const iso of all) {
    if (ONLY.length && !ONLY.includes(iso)) continue;
    for (const lang of ["en", "tr"]) {
      const f = facts(iso, lang, ranks);
      if (!f) continue;
      const file = `${iso.toLowerCase()}-${lang}.png`;
      const sig = crypto.createHash("sha1").update(JSON.stringify([TEMPLATE_VERSION, f])).digest("hex").slice(0, 12);
      if (!FORCE && manifest[file] === sig && fs.existsSync(path.join(OUT, file))) continue;
      todo.push({ f, file, sig });
    }
  }
  if (!todo.length) { console.log("✓ all cards are up to date"); return; }

  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"] });
  const written = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    for (const [i, job] of todo.entries()) {
      await page.setContent(cardHtml(job.f, tokensCss), { waitUntil: "load", timeout: 60000 });
      // Web fonts (and the flag font, fetched only when a flag is on the page) load
      // after "load"; wait for them, then a beat for the paint.
      await page.evaluate(() => document.fonts.ready);
      // A long name wraps to two lines: shrink it until it clears the number below.
      await page.evaluate(() => {
        const n = document.querySelector(".name"), row = document.querySelector(".idrow");
        let size = parseFloat(getComputedStyle(n).fontSize);
        while (row.getBoundingClientRect().bottom > 300 && size > 56) { size -= 4; n.style.fontSize = size + "px"; }
      });
      await new Promise((r) => setTimeout(r, 120));
      const out = path.join(OUT, job.file);
      await page.screenshot({ path: out, type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
      manifest[job.file] = job.sig;
      written.push(out);
      if ((i + 1) % 25 === 0 || i + 1 === todo.length) console.log(`  ${i + 1}/${todo.length}`);
    }
  } finally { await browser.close(); }

  // Palette-PNG squeeze: flat colours + text quantise to ~30 KB with no visible loss.
  const q = spawnSync(process.env.PYTHON || "python", [path.join(__dirname, "quantize-og.py"), ...written], { stdio: "inherit" });
  if (q.status !== 0) console.warn("! quantize-og.py did not run (Python + Pillow missing?) — cards are valid but larger");

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`✓ rendered ${written.length} card(s) into assets/og/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
