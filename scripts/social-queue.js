#!/usr/bin/env node
// Adds a post to social/queue/ for scripts/ig-publish.js. The post starts unapproved.
//
//   node scripts/social-queue.js <YYYY-MM-DD> month [YYYY-MM]
//   node scripts/social-queue.js <YYYY-MM-DD> week [YYYY-MM-DD]
//   node scripts/social-queue.js <YYYY-MM-DD> passport <iso>
//   node scripts/social-queue.js <YYYY-MM-DD> text <slug>      uses social/specs/<slug>-tr.json and -en.json
//   node scripts/social-queue.js approve <folder|YYYY-MM-DD>   marks a queued post approved (a person decides this)
//
// The account speaks English: images are English and the caption starts in English. A post about one country
// adds that country's language under it (a Türkiye post adds Turkish; general posts such as Schengen add
// Turkish too, for the Turkish readers). Images are converted to JPEG (the only format the API takes).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const QUEUE = path.join(ROOT, "social", "queue");
const puppeteer = require(path.join(ROOT, "tools", "node_modules", "puppeteer-core"));
const { chromePath } = (() => {
  const c = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
  return { chromePath: () => c.find((p) => fs.existsSync(p)) };
})();

const [first, kind, ...rest] = process.argv.slice(2);

if (first === "approve") {
  const want = kind || "";
  const dirs = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).filter((d) => d === want || d.startsWith(want + "-")) : [];
  if (!dirs.length) { console.log("no queued post matches " + want); process.exit(1); }
  for (const d of dirs) {
    const f = path.join(QUEUE, d, "post.json");
    const p = JSON.parse(fs.readFileSync(f, "utf8"));
    p.approved = true;
    fs.writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
    console.log("approved " + d);
  }
  process.exit(0);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(first || "") || !kind) {
  console.log("usage: node scripts/social-queue.js <YYYY-MM-DD> <month|week|passport|text> [arg]");
  process.exit(1);
}

function render(lang, out) {
  const args = kind === "text"
    ? ["text", path.join(ROOT, "social", "specs", `${rest[0]}-${lang}.json`)]
    : [kind, ...rest];
  const r = spawnSync(process.execPath, [path.join(__dirname, "social-cards.js"), ...args, "--lang", lang, "--out", out], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`social-cards ${args.join(" ")} --lang ${lang}: ${(r.stderr || r.stdout).trim()}`);
  if (/no changes/i.test(r.stdout)) return false;
  return true;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "igq-"));
  const tr = path.join(tmp, "tr"), en = path.join(tmp, "en");
  if (!render("tr", tr) || !render("en", en)) { console.log("nothing to post (no changes)"); return; }
  const slug = kind === "text" ? rest[0] : [kind, ...rest].join("-").toLowerCase();
  const dir = path.join(QUEUE, `${first}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });

  const pngs = fs.readdirSync(en).filter((f) => /^\d+\.png$/.test(f)).sort();
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--no-first-run"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  for (const f of pngs) {
    const b64 = fs.readFileSync(path.join(en, f)).toString("base64");
    await page.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${b64}" style="display:block;width:1080px;height:1350px"></body></html>`);
    await page.screenshot({ path: path.join(dir, f.replace(".png", ".jpg")), type: "jpeg", quality: 90 });
  }
  await browser.close();

  const capTr = fs.readFileSync(path.join(tr, "caption.txt"), "utf8").trim();
  const capEn = fs.readFileSync(path.join(en, "caption.txt"), "utf8").trim();
  // Hashtags of both languages go once, at the end.
  const split = (c) => { const lines = c.split("\n"); const tags = lines.filter((l) => /^#/.test(l.trim())).join(" ").split(/\s+/).filter(Boolean); return { body: lines.filter((l) => !/^#/.test(l.trim())).join("\n").trim(), tags }; };
  const a = split(capTr), b = split(capEn);
  const tags = [...new Set([...a.tags, ...b.tags])].slice(0, 8).join(" ");
  // Second language: Turkish for a Türkiye passport post and for general (text, month, week) posts; none for
  // another country's passport (its own language is not one the site writes in).
  const second = kind === "passport" ? (String(rest[0]).toLowerCase() === "tr" ? a.body : "") : a.body;
  fs.writeFileSync(path.join(dir, "caption.txt"), `${b.body}${second ? `\n\nTürkçe:\n${second}` : ""}\n\n${tags}\n`);
  // Re-rendering changes what a person approved, so a regenerated post always needs approval again.
  const meta = path.join(dir, "post.json");
  const prev = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, "utf8")) : {};
  if (prev.published) { console.log(`${path.relative(ROOT, dir)} is already published; left as it was`); return; }
  fs.writeFileSync(meta, JSON.stringify({ publish_on: first, kind, arg: rest[0] || null, approved: false, published: null }, null, 2) + "\n");
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`queued ${path.relative(ROOT, dir)} (${pngs.length} image(s), waiting for approval)`);
})().catch((e) => { console.error("social-queue:", e.message); process.exit(1); });
